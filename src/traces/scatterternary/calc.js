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

var dataArrays = ['a', 'b', 'c'];
var arraysToFill = {a: ['b', 'c'], b: ['a', 'c'], c: ['a', 'b']};


module.exports = function calc(gd, trace) {
    var ternary = gd._fullLayout[trace.subplot],
        displaySum = ternary.sum,
        normSum = trace.sum || displaySum;

    var i, j, dataArray, newArray, fillArray1, fillArray2;

    // fill in one missing component
    for(i = 0; i < dataArrays.length; i++) {
        dataArray = dataArrays[i];
        if(trace[dataArray]) continue;

        fillArray1 = trace[arraysToFill[dataArray][0]];
        fillArray2 = trace[arraysToFill[dataArray][1]];
        newArray = new Array(fillArray1.length);
        for(j = 0; j < fillArray1.length; j++) {
            newArray[j] = normSum - fillArray1[j] - fillArray2[j];
        }
        trace[dataArray] = newArray;
    }

    // make the calcdata array
    var serieslen = trace.a.length;
    var cd = new Array(serieslen);
    var a, b, c, norm, x, y;
    for(i = 0; i < serieslen; i++) {
        a = trace.a[i];
        b = trace.b[i];
        c = trace.c[i];
        if(isNumeric(a) && isNumeric(b) && isNumeric(c)) {
            a = +a;
            b = +b;
            c = +c;
            norm = displaySum / (a + b + c);
            if(norm !== 1) {
                a *= norm;
                b *= norm;
                c *= norm;
            }
            // map a, b, c onto x and y where the full scale of y
            // is [0, sum], and x is [-sum, sum]
            // TODO: this makes `a` always the top, `b` the bottom left,
            // and `c` the bottom right. Do we want options to rearrange
            // these?
            y = a;
            x = c - b;
            cd[i] = {x: x, y: y, a: a, b: b, c: c};
        }
        else cd[i] = {x: false, y: false};
    }

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
    if(typeof s !== undefined) Lib.mergeArray(s, cd, 'ms');

    return cd;
};
