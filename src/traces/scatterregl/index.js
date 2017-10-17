/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var extend = require('object-assign');
var Axes = require('../../plots/cartesian/axes');
var kdtree = require('kdgrass');
var Lib = require('../../lib');
var Fx = require('../../components/fx');
var getTraceColor = require('../scatter/get_trace_color');
var ErrorBars = require('../../components/errorbars');
var MAXDIST = Fx.constants.MAXDIST;
var subtypes = require('../scatter/subtypes');
var arraysToCalcdata = require('../scatter/arrays_to_calcdata');
var calcColorscales = require('../scatter/colorscale_calc');

var Scatter = extend({}, require('../scatter/index'));

module.exports = Scatter;

Scatter.name = 'scatterregl';
Scatter.categories = ['gl', 'gl2d', 'symbols', 'errorBarsOK', 'markerColorscale', 'showLegend', 'scatter-like'];

Scatter.plot = require('./plot');

Scatter.calc = function calc(gd, trace) {
	var positions

    var xa = Axes.getFromId(gd, trace.xaxis || 'x');
    var ya = Axes.getFromId(gd, trace.yaxis || 'y');

    // makeCalcdata runs d2c (data-to-coordinate) on every point
    var x = xa.makeCalcdata(trace, 'x');
    var y = ya.makeCalcdata(trace, 'y');

    var serieslen = Math.max(x.length, y.length),
    	i;

    // create the "calculated data" to plot
    positions = new Array(serieslen*2);

    for(i = 0; i < serieslen; i++) {
        positions[i*2] = x[i]
        positions[i*2 + 1] = y[i];
    }

    calcColorscales(trace);

    // TODO: delegate this to webworker if possible
    // FIXME: make sure it is a good place to store the tree
    trace._tree = kdtree(positions, 512);

    // stash data for performance
    trace._x = x;
    trace._y = y;
    trace._positions = positions;

    Axes.expand(xa, x, 0);
    Axes.expand(ya, y, 0);

    return [{x: false, y: false, trace: trace}];
};

Scatter.hoverPoints = function hover(pointData, xval, yval) {
    var cd = pointData.cd,
        trace = cd[0].trace,
        xa = pointData.xa,
        ya = pointData.ya,
        positions = trace
        ._positions,
        // hoveron = trace.hoveron || '',
        tree = trace._tree;

    if(!tree) return [pointData];

    // FIXME: make sure this is a proper way to calc search radius
    var ids = tree.within(xval, yval, MAXDIST / xa._m);

    // pick the id closest to the point
    var min = MAXDIST, id = ids[0], ptx, pty;
    for(var i = 0; i < ids.length; i++) {
        ptx = positions[ids[i] * 2];
        pty = positions[ids[i] * 2 + 1];
        var dx = ptx - xval, dy = pty - yval;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if(dist < min) {
            min = dist;
            id = ids[i];
        }
    }

    pointData.index = id;

    if(id !== undefined) {
    	//FIXME: make proper hover eval here
        // the closest data point
        // var di = cd[pointData.index],
        //     xc = xa.c2p(di.x, true),
        //     yc = ya.c2p(di.y, true),
        //     rad = di.mrc || 1;

        // Lib.extendFlat(pointData, {
        //     color: getTraceColor(trace, di),

        //     x0: xc - rad,
        //     x1: xc + rad,
        //     xLabelVal: di.x,

        //     y0: yc - rad,
        //     y1: yc + rad,
        //     yLabelVal: di.y
        // });

        // if(di.htx) pointData.text = di.htx;
        // else if(trace.hovertext) pointData.text = trace.hovertext;
        // else if(di.tx) pointData.text = di.tx;
        // else if(trace.text) pointData.text = trace.text;
        // ErrorBars.hoverInfo(di, trace, pointData);
    }

    return [pointData];
};

Scatter.selectPoints = function select(searchInfo, polygon) {
    var cd = searchInfo.cd,
        xa = searchInfo.xaxis,
        ya = searchInfo.yaxis,
        selection = [],
        trace = cd[0].trace,
        i,
        di,
        x,
        y;

    var scene = cd[0] && cd[0].trace && cd[0].trace._scene;

    if (!scene) return;

    var hasOnlyLines = (!subtypes.hasMarkers(trace) && !subtypes.hasText(trace));
    if(trace.visible !== true || hasOnlyLines) return;

    // filter out points by visible scatter ones
    if(polygon === false) {
        // clear selection
        for(i = 0; i < cd.length; i++) cd[i].dim = 0;
    }
    else {
        for(i = 0; i < cd.length; i++) {
            di = cd[i];
            x = xa.c2p(di.x);
            y = ya.c2p(di.y);
            if(polygon.contains([x, y])) {
                selection.push({
                    pointNumber: i,
                    x: di.x,
                    y: di.y
                });
                di.dim = 0;
            }
            else di.dim = 1;
        }
    }

    trace.selection = selection;
    scene([cd]);

    return selection;
};

