/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createMatrix = require('regl-splom');
var arrayRange = require('array-range');

var Registry = require('../../registry');
var Grid = require('../../components/grid');
var Lib = require('../../lib');
var AxisIDs = require('../../plots/cartesian/axis_ids');

var subTypes = require('../scatter/subtypes');
var calcMarkerSize = require('../scatter/calc').calcMarkerSize;
var calcAxisExpansion = require('../scatter/calc').calcAxisExpansion;
var calcColorscales = require('../scatter/colorscale_calc');
var convertMarkerSelection = require('../scattergl/convert').markerSelection;
var convertMarkerStyle = require('../scattergl/convert').markerStyle;
var calcHover = require('../scattergl').calcHover;

var BADNUM = require('../../constants/numerical').BADNUM;
var TOO_MANY_POINTS = require('../scattergl/constants').TOO_MANY_POINTS;

function calc(gd, trace) {
    var dimensions = trace.dimensions;
    var commonLength = trace._length;
    var stash = {};
    var opts = {};
    // 'c' for calculated, 'l' for linear,
    // only differ here for log axes, pass ldata to createMatrix as 'data'
    var cdata = opts.cdata = [];
    var ldata = opts.data = [];
    var i, k, dim;

    for(i = 0; i < dimensions.length; i++) {
        dim = dimensions[i];

        if(dim.visible) {
            var axId = trace._diag[i][0] || trace._diag[i][1];
            var ax = AxisIDs.getFromId(gd, axId);
            if(ax) {
                var ccol = makeCalcdata(ax, trace, dim);
                var lcol = ax.type === 'log' ? Lib.simpleMap(ccol, ax.c2l) : ccol;
                cdata.push(ccol);
                ldata.push(lcol);
            }
        }
    }

    calcColorscales(trace);
    Lib.extendFlat(opts, convertMarkerStyle(trace));

    var visibleLength = cdata.length;
    var hasTooManyPoints = (visibleLength * commonLength) > TOO_MANY_POINTS;

    for(i = 0, k = 0; i < dimensions.length; i++) {
        dim = dimensions[i];

        if(dim.visible) {
            var xa = AxisIDs.getFromId(gd, trace._diag[i][0]) || {};
            var ya = AxisIDs.getFromId(gd, trace._diag[i][1]) || {};

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

            calcAxisExpansion(gd, trace, xa, ya, cdata[k], cdata[k], ppad);
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
    // call makeCalcdata with fake input
    var ccol = ax.makeCalcdata({
        v: dim.values,
        vcalendar: trace.calendar
    }, 'v');

    for(var i = 0; i < ccol.length; i++) {
        ccol[i] = ccol[i] === BADNUM ? NaN : ccol[i];
    }

    return ccol;
}

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

function plot(gd, _, splomCalcData) {
    if(!splomCalcData.length) return;

    for(var i = 0; i < splomCalcData.length; i++) {
        plotOne(gd, splomCalcData[i][0]);
    }
}

function plotOne(gd, cd0) {
    var fullLayout = gd._fullLayout;
    var gs = fullLayout._size;
    var trace = cd0.trace;
    var stash = cd0.t;
    var scene = stash._scene;
    var matrixOpts = scene.matrixOptions;
    var cdata = matrixOpts.cdata;
    var regl = fullLayout._glcanvas.data()[0].regl;
    var dragmode = fullLayout.dragmode;
    var xa, ya;
    var i, j, k;

    if(cdata.length === 0) return;

    // augment options with proper upper/lower halves
    // regl-splom's default grid starts from bottom-left
    matrixOpts.lower = trace.showupperhalf;
    matrixOpts.upper = trace.showlowerhalf;
    matrixOpts.diagonal = trace.diagonal.visible;

    var dimensions = trace.dimensions;
    var visibleLength = cdata.length;
    var viewOpts = {};
    viewOpts.ranges = new Array(visibleLength);
    viewOpts.domains = new Array(visibleLength);

    for(i = 0, k = 0; i < dimensions.length; i++) {
        if(trace.dimensions[i].visible) {
            var rng = viewOpts.ranges[k] = new Array(4);
            var dmn = viewOpts.domains[k] = new Array(4);

            xa = AxisIDs.getFromId(gd, trace._diag[i][0]);
            if(xa) {
                rng[0] = xa._rl[0];
                rng[2] = xa._rl[1];
                dmn[0] = xa.domain[0];
                dmn[2] = xa.domain[1];
            }

            ya = AxisIDs.getFromId(gd, trace._diag[i][1]);
            if(ya) {
                rng[1] = ya._rl[0];
                rng[3] = ya._rl[1];
                dmn[1] = ya.domain[0];
                dmn[3] = ya.domain[1];
            }

            k++;
        }
    }

    viewOpts.viewport = [gs.l, gs.b, gs.w + gs.l, gs.h + gs.b];

    if(scene.matrix === true) {
        scene.matrix = createMatrix(regl);
    }

    var selectMode = dragmode === 'lasso' || dragmode === 'select' || !!trace.selectedpoints;
    scene.selectBatch = null;
    scene.unselectBatch = null;

    if(selectMode) {
        var commonLength = trace._length;

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
            for(i = 0; i < commonLength; i++) {
                if(!selDict[i]) unselPts.push(i);
            }
            scene.unselectBatch = unselPts;
        }

        // precalculate px coords since we are not going to pan during select
        var xpx = stash.xpx = new Array(visibleLength);
        var ypx = stash.ypx = new Array(visibleLength);

        for(i = 0, k = 0; i < dimensions.length; i++) {
            if(trace.dimensions[i].visible) {
                xa = AxisIDs.getFromId(gd, trace._diag[i][0]);
                if(xa) {
                    xpx[k] = new Array(commonLength);
                    for(j = 0; j < commonLength; j++) {
                        xpx[k][j] = xa.c2p(cdata[k][j]);
                    }
                }

                ya = AxisIDs.getFromId(gd, trace._diag[i][1]);
                if(ya) {
                    ypx[k] = new Array(commonLength);
                    for(j = 0; j < commonLength; j++) {
                        ypx[k][j] = ya.c2p(cdata[k][j]);
                    }
                }

                k++;
            }
        }

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

function hoverPoints(pointData, xval, yval) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var stash = cd[0].t;
    var scene = stash._scene;
    var cdata = scene.matrixOptions.cdata;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var xpx = xa.c2p(xval);
    var ypx = ya.c2p(yval);
    var maxDistance = pointData.distance;

    var xi = getDimIndex(trace, xa);
    var yi = getDimIndex(trace, ya);
    if(xi === false || yi === false) return [pointData];

    var x = cdata[xi];
    var y = cdata[yi];

    var id, dxy;
    var minDist = maxDistance;

    for(var i = 0; i < x.length; i++) {
        var ptx = x[i];
        var pty = y[i];
        var dx = xa.c2p(ptx) - xpx;
        var dy = ya.c2p(pty) - ypx;
        var dist = Math.sqrt(dx * dx + dy * dy);

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
    var trace = cd[0].trace;
    var stash = cd[0].t;
    var scene = stash._scene;
    var cdata = scene.matrixOptions.cdata;
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var selection = [];
    var i;

    if(!scene) return selection;

    var hasOnlyLines = (!subTypes.hasMarkers(trace) && !subTypes.hasText(trace));
    if(trace.visible !== true || hasOnlyLines) return selection;

    var xi = getDimIndex(trace, xa);
    var yi = getDimIndex(trace, ya);
    if(xi === false || yi === false) return selection;

    var xpx = stash.xpx[xi];
    var ypx = stash.ypx[yi];
    var x = cdata[xi];
    var y = cdata[yi];

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


    return selection;
}

function style(gd, cds) {
    if(!cds) return;

    var fullLayout = gd._fullLayout;
    var cd0 = cds[0];
    var scene0 = cd0[0].t._scene;
    scene0.matrix.regl.clear({color: true, depth: true});

    if(fullLayout._splomGrid) {
        fullLayout._splomGrid.draw();
    }

    for(var i = 0; i < cds.length; i++) {
        var scene = cds[i][0].t._scene;
        scene.draw();
    }

    // redraw all subplot with scattergl traces,
    // as we cleared the whole canvas above
    if(fullLayout._has('cartesian')) {
        for(var k in fullLayout._plots) {
            var sp = fullLayout._plots[k];
            if(sp._scene) sp._scene.draw();
        }
    }
}

function getDimIndex(trace, ax) {
    var axId = ax._id;
    var axLetter = axId.charAt(0);
    var ind = {x: 0, y: 1}[axLetter];
    var dimensions = trace.dimensions;

    for(var i = 0, k = 0; i < dimensions.length; i++) {
        if(dimensions[i].visible) {
            if(trace._diag[i][ind] === axId) return k;
            k++;
        }
    }
    return false;
}

module.exports = {
    moduleType: 'trace',
    name: 'splom',

    basePlotModule: require('./base_plot'),
    categories: ['gl', 'regl', 'cartesian', 'symbols', 'showLegend', 'scatter-like'],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: require('../scatter/marker_colorbar'),

    calc: calc,
    plot: plot,
    hoverPoints: hoverPoints,
    selectPoints: selectPoints,
    style: style,

    meta: {
        description: [
            'Splom traces generate scatter plot matrix visualizations.',
            'Each splom `dimensions` items correspond to a generated axis.',
            'Values for each of those dimensions are set in `dimensions[i].values`.',
            'Splom traces support all `scattergl` marker style attributes.',
            'Specify `layout.grid` attributes and/or layout x-axis and y-axis attributes',
            'for more control over the axis positioning and style. '
        ].join(' ')
    }
};

// splom traces use the 'grid' component to generate their axes,
// register it here
Registry.register(Grid);
