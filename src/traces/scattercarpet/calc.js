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
var Lib = require('../../lib');

var subTypes = require('../scatter/subtypes');
var calcColorscale = require('../scatter/colorscale_calc');

var dataArrays = ['a', 'b'];

module.exports = function calc(gd, trace) {
    var i, j, dataArray, newArray, fillArray1, fillArray2, carpet;

    for (i = 0; i < gd._fullData.length; i++) {
        if (gd._fullData[i].carpetid === trace.carpetid && gd._fullData[i].type === 'carpet') {
            carpet = gd._fullData[i];
            break;
        }
    }

    if (!carpet) return;

    trace._carpet = carpet;

    // Transfer this over from carpet before plotting since this is a necessary
    // condition in order for cartesian to actually plot this trace:
    trace.xaxis = carpet.xaxis;
    trace.yaxis = carpet.yaxis;

    var displaySum = carpet.sum,
        normSum = trace.sum || displaySum;

    // make the calcdata array
    var serieslen = trace.a.length;
    var cd = new Array(serieslen);
    var a, b, norm, x, y;
    for(i = 0; i < serieslen; i++) {
        a = trace.a[i];
        b = trace.b[i];
        if(isNumeric(a) && isNumeric(b)) {
            var xy = carpet.ab2xy(+a, +b);
            cd[i] = {x: xy[0], y: xy[1], a: a, b: b};
        }
        else cd[i] = {x: false, y: false};
    }

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

    // this has migrated up from arraysToCalcdata as we have a reference to 's' here
    if(typeof s !== 'undefined') Lib.mergeArray(s, cd, 'ms');

    return cd;
};
