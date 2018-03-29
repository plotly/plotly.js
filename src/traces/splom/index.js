/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var createMatrix = require('regl-scattermatrix');

var Lib = require('../../lib');
var AxisIDs = require('../../plots/cartesian/axis_ids');

var calcMarkerSize = require('../scatter/calc').calcMarkerSize;
var calcAxisExpansion = require('../scatter/calc').calcAxisExpansion;
var calcColorscales = require('../scatter/colorscale_calc');
var convertMarkerStyle = require('../scattergl/convert').convertMarkerStyle;
var getTraceColor = require('../scatter/get_trace_color');

var BADNUM = require('../../constants/numerical').BADNUM;
var TOO_MANY_POINTS = require('../scattergl/constants').TOO_MANY_POINTS;

function calc(gd, trace) {
    var stash = {};
    var opts = {};
    var i, xa, ya;

    var dimLength = trace.dimensions.length;
    var hasTooManyPoints = (dimLength * trace._commonLength) > TOO_MANY_POINTS;
    var matrix = opts.data = new Array(dimLength);

    for(i = 0; i < dimLength; i++) {
        // using xa or ya should make no difference here
        xa = AxisIDs.getFromId(gd, trace.xaxes[i]);
        matrix[i] = makeCalcdata(xa, trace, trace.dimensions[i]);
    }

    calcColorscales(trace);
    Lib.extendFlat(opts, convertMarkerStyle(trace));

    for(i = 0; i < dimLength; i++) {
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
            ppad = calcMarkerSize(trace, trace._commonLength);
        }
        calcAxisExpansion(gd, trace, xa, ya, matrix[i], matrix[i], ppad);
    }


    var scene = stash._scene = sceneUpdate(gd, stash);
    if(!scene.matrix) scene.matrix = true;
    scene.matrixOptions = opts;

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
        dirty: true,
        opts: null
    };

    var first = {
        selectBatch: null,
        unselectBatch: null,
        matrix: false,
        select: null
    };

    if(!scene) {
        scene = stash._scene = Lib.extendFlat({}, reset, first);

        // TODO should we use something like this on drag?
        scene.update = function update(opt) {
            if(scene.matrix) scene.matrix.update(opt);
            scene.draw();
        };

        scene.draw = function draw() {
            if(scene.matrix) scene.matrix.draw();

            // TODO selection stuff

            // do we need to use this flag anywhere??
            scene.dirty = false;
        };

        // make sure canvas is clear
        scene.clear = function clear() {
            // TODO
        };

        // remove selection
        scene.clearSelect = function clearSelect() {
            if(!scene.selectBatch) return;
            scene.selectBatch = null;
            scene.unselectBatch = null;
            scene.matrix.update(scene.opts);
            scene.clear();
            scene.draw();
        };

        // remove scene resources
        scene.destroy = function destroy() {
            if(scene.matrix) scene.matrix.destroy();

            scene.opts = null;
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
    var scene = cd0.t._scene;
    var trace = cd0.trace;
    var regl = fullLayout._glcanvas.data()[0].regl;

    var dimLength = trace.dimensions.length;
    var viewOpts = {
        ranges: new Array(dimLength),
        domains: new Array(dimLength)
    };

    for(var i = 0; i < dimLength; i++) {
        var xa = AxisIDs.getFromId(gd, trace.xaxes[i]);
        var ya = AxisIDs.getFromId(gd, trace.yaxes[i]);
        viewOpts.ranges[i] = [xa.range[0], ya.range[0], xa.range[1], ya.range[1]];
        viewOpts.domains[i] = [xa.domain[0], ya.domain[0], xa.domain[1], ya.domain[1]];
    }

    viewOpts.viewport = [gs.l, gs.b, gs.w + gs.l, gs.h + gs.b];

    if(scene.matrix === true) {
        scene.matrix = createMatrix(regl);
    }

    // FIXME: generate multiple options for single update
    scene.matrix.update(scene.matrixOptions);
    scene.matrix.update(viewOpts);
    scene.matrix.draw();
}

// TODO splom 'needs' the grid component, register it here?

function hoverPoints(pointData, xval, yval, hovermode) {
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

    var xData = dimensions[xi].values;
    var yData = dimensions[yi].values;

    var id, ptx, pty, dx, dy, dist, dxy;

    if(hovermode === 'x') {
        for(i = 0; i < xData.length; i++) {
            ptx = xData[i];
            dx = Math.abs(xa.c2p(ptx) - xpx);
            if(dx < maxDistance) {
                maxDistance = dx;
                dy = ya.c2p(yData[i]) - ypx;
                dxy = Math.sqrt(dx * dx + dy * dy);
                id = i;
            }
        }
    }
    else {
        for(i = 0; i < xData.length; i++) {
            ptx = xData[i];
            pty = yData[i];
            dx = xa.c2p(ptx) - xpx;
            dy = ya.c2p(pty) - ypx;

            dist = Math.sqrt(dx * dx + dy * dy);
            if(dist < maxDistance) {
                maxDistance = dxy = dist;
                id = i;
            }
        }
    }

    pointData.index = id;


    if(id === undefined) return [pointData];

    // the closest data point
    var di = {
        pointNumber: id,
        x: xData[id],
        y: yData[id]
    };


    // that is single-item arrays_to_calcdata excerpt, since we are doing it for a single point and we don't have to do it beforehead for 1e6 points
    // FIXME: combine with scattergl hover di calc
    di.tx = Array.isArray(trace.text) ? trace.text[id] : trace.text;
    di.htx = Array.isArray(trace.hovertext) ? trace.hovertext[id] : trace.hovertext;
    di.data = Array.isArray(trace.customdata) ? trace.customdata[id] : trace.customdata;
    di.tp = Array.isArray(trace.textposition) ? trace.textposition[id] : trace.textposition;

    var font = trace.textfont;
    if(font) {
        di.ts = Array.isArray(font.size) ? font.size[id] : font.size;
        di.tc = Array.isArray(font.color) ? font.color[id] : font.color;
        di.tf = Array.isArray(font.family) ? font.family[id] : font.family;
    }

    var marker = trace.marker;
    if(marker) {
        di.ms = Lib.isArrayOrTypedArray(marker.size) ? marker.size[id] : marker.size;
        di.mo = Lib.isArrayOrTypedArray(marker.opacity) ? marker.opacity[id] : marker.opacity;
        di.mx = Array.isArray(marker.symbol) ? marker.symbol[id] : marker.symbol;
        di.mc = Lib.isArrayOrTypedArray(marker.color) ? marker.color[id] : marker.color;
    }

    var line = marker && marker.line;
    if(line) {
        di.mlc = Array.isArray(line.color) ? line.color[id] : line.color;
        di.mlw = Lib.isArrayOrTypedArray(line.width) ? line.width[id] : line.width;
    }

    var grad = marker && marker.gradient;
    if(grad && grad.type !== 'none') {
        di.mgt = Array.isArray(grad.type) ? grad.type[id] : grad.type;
        di.mgc = Array.isArray(grad.color) ? grad.color[id] : grad.color;
    }

    var xp = xa.c2p(di.x, true);
    var yp = ya.c2p(di.y, true);
    var rad = di.mrc || 1;

    var hoverlabel = trace.hoverlabel;

    if(hoverlabel) {
        di.hbg = Array.isArray(hoverlabel.bgcolor) ? hoverlabel.bgcolor[id] : hoverlabel.bgcolor;
        di.hbc = Array.isArray(hoverlabel.bordercolor) ? hoverlabel.bordercolor[id] : hoverlabel.bordercolor;
        di.hts = Array.isArray(hoverlabel.font.size) ? hoverlabel.font.size[id] : hoverlabel.font.size;
        di.htc = Array.isArray(hoverlabel.font.color) ? hoverlabel.font.color[id] : hoverlabel.font.color;
        di.htf = Array.isArray(hoverlabel.font.family) ? hoverlabel.font.family[id] : hoverlabel.font.family;
        di.hnl = Array.isArray(hoverlabel.namelength) ? hoverlabel.namelength[id] : hoverlabel.namelength;
    }
    var hoverinfo = trace.hoverinfo;
    if(hoverinfo) {
        di.hi = Array.isArray(hoverinfo) ? hoverinfo[id] : hoverinfo;
    }


    var fakeCd = {};
    fakeCd[pointData.index] = di;

    Lib.extendFlat(pointData, {
        color: getTraceColor(trace, di),

        x0: xp - rad,
        x1: xp + rad,
        xLabelVal: di.x,

        y0: yp - rad,
        y1: yp + rad,
        yLabelVal: di.y,

        cd: fakeCd,
        distance: maxDistance,
        spikeDistance: dxy
    });

    return [pointData];
}

function selectPoints(searchInfo, polygon) {

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
    style: function() {},

    meta: {
        description: [
            'SPLOM !!!'
        ].join(' ')
    }
};
