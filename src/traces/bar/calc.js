/**
* Copyright 2012-2017, Plotly, Inc.
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

var arraysToCalcdata = require('./arrays_to_calcdata');


module.exports = function calc(gd, trace) {
    // depending on bar direction, set position and size axes
    // and data ranges
    // note: this logic for choosing orientation is
    // duplicated in graph_obj->setstyles

    var xa = Axes.getFromId(gd, trace.xaxis || 'x'),
        ya = Axes.getFromId(gd, trace.yaxis || 'y'),
        orientation = trace.orientation || ((trace.x && !trace.y) ? 'h' : 'v'),
        sa, pos, size, i, scalendar;

    if(orientation === 'h') {
        sa = xa;
        size = xa.makeCalcdata(trace, 'x');
        pos = ya.makeCalcdata(trace, 'y');

        // not sure if it really makes sense to have dates for bar size data...
        // ideally if we want to make gantt charts or something we'd treat
        // the actual size (trace.x or y) as time delta but base as absolute
        // time. But included here for completeness.
        scalendar = trace.xcalendar;
    }
    else {
        sa = ya;
        size = ya.makeCalcdata(trace, 'y');
        pos = xa.makeCalcdata(trace, 'x');
        scalendar = trace.ycalendar;
    }

    // create the "calculated data" to plot
    var serieslen = Math.min(pos.length, size.length),
        cd = [];

    // set position
    for(i = 0; i < serieslen; i++) {

        // add bars with non-numeric sizes to calcdata
        // so that ensure that traces with gaps are
        // plotted in the correct order

        if(isNumeric(pos[i])) {
            cd.push({p: pos[i]});
        }
    }

    // set base
    var base = trace.base,
        b;

    if(Array.isArray(base)) {
        for(i = 0; i < Math.min(base.length, cd.length); i++) {
            b = sa.d2c(base[i], 0, scalendar);
            cd[i].b = (isNumeric(b)) ? b : 0;
        }
        for(; i < cd.length; i++) {
            cd[i].b = 0;
        }
    }
    else {
        b = sa.d2c(base, 0, scalendar);
        b = (isNumeric(b)) ? b : 0;
        for(i = 0; i < cd.length; i++) {
            cd[i].b = b;
        }
    }

    // set size
    for(i = 0; i < cd.length; i++) {
        if(isNumeric(size[i])) {
            cd[i].s = size[i];
        }
    }

    // auto-z and autocolorscale if applicable
    if(hasColorscale(trace, 'marker')) {
        colorscaleCalc(trace, trace.marker.color, 'marker', 'c');
    }
    if(hasColorscale(trace, 'marker.line')) {
        colorscaleCalc(trace, trace.marker.line.color, 'marker.line', 'c');
    }

    arraysToCalcdata(cd, trace);

    return cd;
};
