/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createMatrix = require('regl-scattermatrix');
var arrayRange = require('array-range');

var Lib = require('../../lib');
var AxisIDs = require('../../plots/cartesian/axis_ids');

var subTypes = require('../scatter/subtypes');
var calcMarkerSize = require('../scatter/calc').calcMarkerSize;
var calcAxisExpansion = require('../scatter/calc').calcAxisExpansion;
var calcColorscales = require('../scatter/colorscale_calc');
var convertMarkerSelection = require('../scattergl/convert').convertMarkerSelection;
var convertMarkerStyle = require('../scattergl/convert').convertMarkerStyle;
var calcHover = require('../scattergl').calcHover;

var BADNUM = require('../../constants/numerical').BADNUM;
var TOO_MANY_POINTS = require('../scattergl/constants').TOO_MANY_POINTS;

function calc(gd, trace) {
    var stash = {};
    var opts = {};
    var i, xa, ya, dim;

    var commonLength = trace._commonLength;
    var activeLength = trace._activeLength;
    var matrix = opts.data = [];

    for(i = 0; i < activeLength; i++) {
        dim = trace.dimensions[i];

        if(dim.visible) {
            // using xa or ya should make no difference here
            xa = AxisIDs.getFromId(gd, trace.xaxes[i]);
            matrix.push(makeCalcdata(xa, trace, dim));
        }
    }

    calcColorscales(trace);
    Lib.extendFlat(opts, convertMarkerStyle(trace));

    var visibleLength = matrix.length;
    var hasTooManyPoints = (visibleLength * commonLength) > TOO_MANY_POINTS;
    var k = 0;

    for(i = 0; i < activeLength; i++) {
        dim = trace.dimensions[i];

        if(dim.visible) {
            xa = AxisIDs.getFromId(gd, trace.xaxes[i]);
            ya = AxisIDs.getFromId(gd, trace.yaxes[i]);

            // Re-use SVG scatter axis expansion routine except
            // for graph with very large number of points where it
            // performs poorly.
            // In big data case, fake Axes.expand outputs with data bounds,
            // and an average size for array marker.size inputs.
            var ppad;
            if(hasTooManyPoints) {
                ppad = 2 * (opts.sizeAvg || Math.max(opts.size, 3));
            } else {
                ppad = calcMarkerSize(trace, commonLength);
            }
            calcAxisExpansion(gd, trace, xa, ya, matrix[k], matrix[k], ppad);
            k++;
        }
    }

    var scene = stash._scene = sceneUpdate(gd, stash);
    if(!scene.matrix) scene.matrix = true;
    scene.matrixOptions = opts;

    scene.selectedOptions = convertMarkerSelection(trace, trace.selected);
    scene.unselectedOptions = convertMarkerSelection(trace, trace.unselected);

    return [{x: false, y: false, t: stash, trace: trace}];
}

function makeCalcdata(ax, trace, dim) {
    var i;

    var cdata = ax.makeCalcdata({
        v: dim.values,
        vcalendar: trace.calendar
    }, 'v');

    for(i = 0; i < cdata.length; i++) {
        cdata[i] = cdata[i] === BADNUM ? NaN : cdata[i];
    }

    if(ax.type === 'log') {
        for(i = 0; i < cdata.length; i++) {
            cdata[i] = ax.c2l(cdata[i]);
        }
    }

    return cdata;
}

// TODO do we need this?
function sceneUpdate(gd, stash) {
    var scene = stash._scene;

    var reset = {
        dirty: true
    };

    var first = {
        selectBatch: null,
        unselectBatch: null,
        matrix: false,
        select: null
    };

    if(!scene) {
        scene = stash._scene = Lib.extendFlat({}, reset, first);

        scene.draw = function draw() {
            // draw traces in selection mode
            if(scene.matrix && scene.selectBatch) {
                scene.matrix.draw(scene.unselectBatch, scene.selectBatch);
            }

            else if(scene.matrix) {
                scene.matrix.draw();
            }

            scene.dirty = false;
        };

        // remove scene resources
        scene.destroy = function destroy() {
            if(scene.matrix) scene.matrix.destroy();

            scene.matrixOptions = null;
            scene.selectBatch = null;
            scene.unselectBatch = null;

            stash._scene = null;
        };
    }

    // In case if we have scene from the last calc - reset data
    if(!scene.dirty) {
        Lib.extendFlat(scene, reset);
    }

    return scene;
}

function plot(gd, _, cdata) {
    if(!cdata.length) return;

    for(var i = 0; i < cdata.length; i++) {
        plotOne(gd, cdata[i][0]);
    }
}

function plotOne(gd, cd0) {
    var fullLayout = gd._fullLayout;
    var gs = fullLayout._size;
    var trace = cd0.trace;
    var stash = cd0.t;
    var scene = stash._scene;
    var matrixOpts = scene.matrixOptions;
    var matrixData = matrixOpts.data;
    var regl = fullLayout._glcanvas.data()[0].regl;
    var dragmode = fullLayout.dragmode;
    var xa, ya;

    if(matrixData.length === 0) return;

    // augment options with proper upper/lower halves
    matrixOpts.upper = trace.showupperhalf;
    matrixOpts.lower = trace.showlowerhalf;
    matrixOpts.diagonal = trace.diagonal.visible;

    console.log(matrixOpts.upper, matrixOpts.lower)

    var k = 0, i;
    var activeLength = trace._activeLength;
    var visibleLength = matrixData.length;
    var dataLength = matrixData[0].length;
    var viewOpts = {
        ranges: new Array(visibleLength),
        domains: new Array(visibleLength)
    };

    for(i = 0; i < activeLength; i++) {
        if(!trace.dimensions[i].visible) continue;

        xa = AxisIDs.getFromId(gd, trace.xaxes[i]);
        ya = AxisIDs.getFromId(gd, trace.yaxes[i]);
        viewOpts.ranges[k] = [xa.range[0], ya.range[0], xa.range[1], ya.range[1]];
        viewOpts.domains[k] = [xa.domain[0], ya.domain[0], xa.domain[1], ya.domain[1]];
        k++;
    }

    viewOpts.viewport = [gs.l, gs.b, gs.w + gs.l, gs.h + gs.b];

    if(scene.matrix === true) {
        scene.matrix = createMatrix(regl);
    }

    var selectMode = dragmode === 'lasso' || dragmode === 'select' || !!trace.selectedpoints;
    scene.selectBatch = null;
    scene.unselectBatch = null;

    if(selectMode) {
        if(!scene.selectBatch) {
            scene.selectBatch = [];
            scene.unselectBatch = [];
        }

        // regenerate scene batch, if traces number changed during selection
        if(trace.selectedpoints) {
            scene.selectBatch = trace.selectedpoints;

            var selPts = trace.selectedpoints;
            var selDict = {};
            for(i = 0; i < selPts.length; i++) {
                selDict[selPts[i]] = true;
            }
            var unselPts = [];
            for(i = 0; i < dataLength; i++) {
                if(!selDict[i]) unselPts.push(i);
            }
            scene.unselectBatch = unselPts;
        }

        // precalculate px coords since we are not going to pan during select
        var xpx = new Array(visibleLength);
        var ypx = new Array(visibleLength);
        var data;
        for(k = 0; k < visibleLength; k++) {
            xa = AxisIDs.getFromId(gd, trace.xaxes[k]);
            ya = AxisIDs.getFromId(gd, trace.yaxes[k]);

            xpx[k] = new Array(dataLength);
            ypx[k] = new Array(dataLength);

            data = matrixData[k];

            for(i = 0; i < dataLength; i++) {
                xpx[k][i] = xa.c2p(data[i]);
                ypx[k][i] = ya.c2p(data[i]);
            }
        }
        stash.xpx = xpx;
        stash.ypx = ypx;


        if(scene.selectBatch) {
            scene.matrix.update(matrixOpts, matrixOpts);
            scene.matrix.update(scene.unselectedOptions, scene.selectedOptions);
            scene.matrix.update(viewOpts, viewOpts);
        }
        else {
            // delete selection pass
            scene.matrix.update(viewOpts, null);
        }
    }
    else {
        scene.matrix.update(matrixOpts);
        scene.matrix.update(viewOpts);
        stash.xpx = stash.ypx = null;
    }

    scene.draw();
}

// TODO splom 'needs' the grid component, register it here?

function hoverPoints(pointData, xval, yval) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var xpx = xa.c2p(xval);
    var ypx = ya.c2p(yval);
    var maxDistance = pointData.distance;
    var dimensions = trace.dimensions;

    var xi, yi, i;
    for(i = 0; i < dimensions.length; i++) {
        if(trace.xaxes[i] === xa._id) xi = i;
        if(trace.yaxes[i] === ya._id) yi = i;
    }

    var x = dimensions[xi].values || [];
    var y = dimensions[yi].values || [];

    var id, ptx, pty, dx, dy, dist, dxy;
    var minDist = maxDistance;

    for(i = 0; i < x.length; i++) {
        ptx = x[i];
        pty = y[i];
        dx = xa.c2p(ptx) - xpx;
        dy = ya.c2p(pty) - ypx;

        dist = Math.sqrt(dx * dx + dy * dy);
        if(dist < minDist) {
            minDist = dxy = dist;
            id = i;
        }
    }

    pointData.index = id;
    pointData.distance = minDist;
    pointData.dxy = dxy;

    if(id === undefined) return [pointData];

    calcHover(pointData, x, y, trace);

    return [pointData];
}

function selectPoints(searchInfo, polygon) {
    var cd = searchInfo.cd;
    var selection = [];
    var trace = cd[0].trace;
    var stash = cd[0].t;
    var scene = stash._scene;
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var matrixData = scene.matrixOptions.data;

    if(!scene) return selection;

    var hasOnlyLines = (!subTypes.hasMarkers(trace) && !subTypes.hasText(trace));
    if(trace.visible !== true || hasOnlyLines) return selection;

    var xi, yi, i;
    for(i = 0; i < trace.dimensions.length; i++) {
        if(trace.xaxes[i] === xa._id) xi = i;
        if(trace.yaxes[i] === ya._id) yi = i;
    }

    var xpx = stash.xpx[xi];
    var ypx = stash.ypx[yi];
    var x = matrixData[xi];
    var y = matrixData[yi];

    // degenerate polygon does not enable selection
    // filter out points by visible scatter ones
    var els = null;
    var unels = null;
    if(polygon !== false && !polygon.degenerate) {
        els = [], unels = [];
        for(i = 0; i < x.length; i++) {
            if(polygon.contains([xpx[i], ypx[i]])) {
                els.push(i);
                selection.push({
                    pointNumber: i,
                    x: x[i],
                    y: y[i]
                });
            }
            else {
                unels.push(i);
            }
        }
    } else {
        unels = arrayRange(stash.count);
    }

    // make sure selectBatch is created
    if(!scene.selectBatch) {
        scene.selectBatch = [];
        scene.unselectBatch = [];
    }

    if(!scene.selectBatch) {
        // enter every trace select mode
        for(i = 0; i < scene.count; i++) {
            scene.selectBatch = [];
            scene.unselectBatch = [];
        }
        // we should turn scatter2d into unselected once we have any points selected
        scene.matrix.update(scene.unselectedOptions, scene.selectedOptions);
    }

    scene.selectBatch = els;
    scene.unselectBatch = unels;

    scene.matrix.regl.clear({ color: true });

    return selection;
}

function style(gd, cd) {
    if(cd) {
        var stash = cd[0].t;
        var scene = stash._scene;
        scene.draw();
    }
}

module.exports = {
    moduleType: 'trace',
    name: 'splom',

    basePlotModule: require('./base_plot'),
    categories: ['gl', 'regl', 'cartesian', 'symbols', 'markerColorscale', 'showLegend', 'scatter-like'],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),

    calc: calc,
    plot: plot,
    hoverPoints: hoverPoints,
    selectPoints: selectPoints,
    style: style,

    meta: {
        description: [
            'SPLOM !!!'
        ].join(' ')
    }
};
