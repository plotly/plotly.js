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

var subTypes = require('../scatter/subtypes');
var calcColorscale = require('../scatter/colorscale_calc');
var arraysToCalcdata = require('../scatter/arrays_to_calcdata');
var lookupCarpet = require('../carpet/lookup_carpetid');

module.exports = function calc(gd, trace) {
    var carpet = trace.carpetTrace = lookupCarpet(gd, trace);
    if(!carpet || !carpet.visible || carpet.visible === 'legendonly') return;
    var i;

    // Transfer this over from carpet before plotting since this is a necessary
    // condition in order for cartesian to actually plot this trace:
    trace.xaxis = carpet.xaxis;
    trace.yaxis = carpet.yaxis;

    // make the calcdata array
    var serieslen = trace.a.length;
    var cd = new Array(serieslen);
    var a, b;
    var needsCull = false;
    for(i = 0; i < serieslen; i++) {
        a = trace.a[i];
        b = trace.b[i];
        if(isNumeric(a) && isNumeric(b)) {
            var xy = carpet.ab2xy(+a, +b, true);
            var visible = carpet.isVisible(+a, +b);
            if(!visible) needsCull = true;
            cd[i] = {x: xy[0], y: xy[1], a: a, b: b, vis: visible};
        }
        else cd[i] = {x: false, y: false};
    }

    trace._needsCull = needsCull;

    cd[0].carpet = carpet;
    cd[0].trace = trace;

    // fill in some extras
    var marker, s;
    if(subTypes.hasMarkers(trace)) {
        // Treat size like x or y arrays --- Run d2c
        // this needs to go before ppad computation
        marker = trace.marker;
        s = marker.size;

        if(Array.isArray(s)) {
            var ax = {type: 'linear'};
            Axes.setConvert(ax);
            s = ax.makeCalcdata(trace.marker, 'size');
            if(s.length > serieslen) s.splice(serieslen, s.length - serieslen);
        }
    }

    calcColorscale(trace);

    arraysToCalcdata(cd, trace);

    return cd;
};
