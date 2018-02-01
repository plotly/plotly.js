/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');

function toLog(v) {
    return Math.log(v) / Math.LN10;
}

module.exports = function makeBubbleSizeFn(trace) {
    var marker = trace.marker;
    var sizeRef = marker.sizeref || 1;
    var sizeMin = marker.sizemin || 0;
    var sizeMax = marker.sizemax || Infinity;
    var sizeDataMin = marker.sizedatamin || 0;
    var sizeDataMax = marker.sizedatamax || Infinity;
    var baseFn;

    switch(marker.sizemode) {
        case 'area':
            baseFn = function(v) { return Math.sqrt(v / sizeRef); };
            break;
        case 'log-diameter':
            baseFn = function(v) { return toLog(v) / sizeRef; };
            break;
        case 'log-area':
            baseFn = function(v) { return Math.sqrt(toLog(v) / sizeRef); };
            break;
        default:
            baseFn = function(v) { return v / sizeRef; };
            break;
    }

    // non-numeric and negative data values AND sizes correspond to size=0 points,
    // clamp positive data values outside data range to px extrema
    return function(v) {
        if(isNumeric(v) && v > 0) {
            if(v <= sizeDataMin) return sizeMin;
            if(v >= sizeDataMax) return sizeMax;
        }

        var s = baseFn(v / 2);
        return isNumeric(s) && s > 0 ?
            Math.min(Math.max(s, sizeMin), sizeMax) :
            0;
    };
};
