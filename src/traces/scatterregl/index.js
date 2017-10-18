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
var Fx = require('../../components/fx');
var MAXDIST = Fx.constants.MAXDIST;
var subtypes = require('../scatter/subtypes');
var calcColorscales = require('../scatter/colorscale_calc');

var Scatter = extend({}, require('../scatter/index'));

module.exports = Scatter;

Scatter.name = 'scatterregl';
Scatter.categories = ['gl', 'gl2d', 'symbols', 'errorBarsOK', 'markerColorscale', 'showLegend', 'scatter-like'];

Scatter.plot = require('./plot');

Scatter.calc = function calc(gd, trace) {
    var positions;

    var xaxis = Axes.getFromId(gd, trace.xaxis || 'x');
    var yaxis = Axes.getFromId(gd, trace.yaxis || 'y');

    // makeCalcdata runs d2c (data-to-coordinate) on every point
    var x = xaxis.type === 'linear' ? trace.x : xaxis.makeCalcdata(trace, 'x');
    var y = yaxis.type === 'linear' ? trace.y : yaxis.makeCalcdata(trace, 'y');

    var serieslen = Math.max(x.length, y.length),
        i, l;

    // calculate axes range
    // FIXME: probably we may want to have more complex ppad calculation
    // FIXME: that is pretty slow thing here @etpinard your assistance required
    Axes.expand(xaxis, x, 0);
    Axes.expand(yaxis, y, 0);

    // convert log axes
    if(xaxis.type === 'log') {
        for(i = 0, l = x.length; i < l; i++) {
            x[i] = xaxis.d2l(x[i]);
        }
    }
    if(yaxis.type === 'log') {
        for(i = 0, l = y.length; i < l; i++) {
            y[i] = yaxis.d2l(y[i]);
        }
    }

    positions = new Array(serieslen * 2);

    for(i = 0; i < serieslen; i++) {
        positions[i * 2] = parseFloat(x[i]);
        positions[i * 2 + 1] = parseFloat(y[i]);
    }

    // TODO: delegate this to webworker if possible
    // FIXME: make sure it is a good place to store the tree
    trace._tree = kdtree(positions, 512);

    // stash data for performance
    trace._x = x;
    trace._y = y;
    trace._positions = positions;

    calcColorscales(trace);

    return [{x: false, y: false, trace: trace}];
};

Scatter.hoverPoints = function hover(pointData, xval, yval) {
    var cd = pointData.cd,
        trace = cd[0].trace,
        xa = pointData.xa,
        positions = trace._positions,
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
        // FIXME: make proper hover eval here
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

    if(!scene) return;

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
