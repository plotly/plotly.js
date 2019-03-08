/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../../plots/cartesian/axes');
var arraysToCalcdata = require('./arrays_to_calcdata');
var calcSelection = require('../scatter/calc_selection');

function isAbsolute(a) {
    return (a === 'a' || a === 'absolute');
}

function isTotal(a) {
    return (a === 't' || a === 'total');
}

module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x');
    var ya = Axes.getFromId(gd, trace.yaxis || 'y');
    var size, pos;

    if(trace.orientation === 'h') {
        size = xa.makeCalcdata(trace, 'x');
        pos = ya.makeCalcdata(trace, 'y');
    } else {
        size = ya.makeCalcdata(trace, 'y');
        pos = xa.makeCalcdata(trace, 'x');
    }

    // create the "calculated data" to plot
    var serieslen = Math.min(pos.length, size.length);
    var cd = new Array(serieslen);

    // set position and size (as well as for waterfall total size)
    var previousSum = 0;
    var newSize;
    var i;

    for(i = 0; i < serieslen; i++) {
        var amount = size[i] || 0;
        cd[i] = {
            p: pos[i],
            s: amount,
            rawS: amount
        };

        if(isAbsolute(trace.valuetype[i])) {

            previousSum = cd[i].s;

            cd[i].isSum = true;
            cd[i].s = previousSum;
        } else if(isTotal(trace.valuetype[i])) {

            cd[i].isSum = true;
            cd[i].s = previousSum;
        } else { // default: relative
            cd[i].isSum = false;
            newSize = cd[i].s;
            cd[i].s = previousSum + newSize;
            previousSum += newSize;
        }

        if(trace.ids) {
            cd[i].id = String(trace.ids[i]);
        }
    }

    var vals = [];
    if(trace._autoMarkerColor || trace._autoMarkerLineColor) {
        for(i = 0; i < serieslen; i++) {
            vals[i] = (cd[i].isSum) ? 0 :
                (i === 0) ? cd[i].s : cd[i].s - cd[i - 1].s;
        }
    }

    arraysToCalcdata(cd, trace, vals);
    calcSelection(cd, trace);

    return cd;
};
