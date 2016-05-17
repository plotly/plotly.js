/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Axes = require('../../plots/cartesian/axes');
var hasColorscale = require('../../components/colorscale/has_colorscale');
var colorscaleCalc = require('../../components/colorscale/calc');


module.exports = function calc(gd, trace) {
    // depending on bar direction, set position and size axes
    // and data ranges
    // note: this logic for choosing orientation is
    // duplicated in graph_obj->setstyles

    var xa = Axes.getFromId(gd, trace.xaxis || 'x'),
        ya = Axes.getFromId(gd, trace.yaxis || 'y'),
        orientation = trace.orientation || ((trace.x && !trace.y) ? 'h' : 'v'),
        pos, size, i;

    if(orientation === 'h') {
        size = xa.makeCalcdata(trace, 'x');
        pos = ya.makeCalcdata(trace, 'y');
    }
    else {
        size = ya.makeCalcdata(trace, 'y');
        pos = xa.makeCalcdata(trace, 'x');
    }

    // create the "calculated data" to plot
    var serieslen = Math.min(pos.length, size.length),
        cd = [];
    for(i = 0; i < serieslen; i++) {
        if(isNumeric(pos[i])) {
            cd.push({p: pos[i], s: size[i], b: 0});
        }
    }

    // auto-z and autocolorscale if applicable
    if(hasColorscale(trace, 'marker')) {
        colorscaleCalc(trace, trace.marker.color, 'marker', 'c');
    }
    if(hasColorscale(trace, 'marker.line')) {
        colorscaleCalc(trace, trace.marker.line.color, 'marker.line', 'c');
    }

    return cd;
};
