/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

var kernels = {
    gaussian: function(v) {
        return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * v * v);
    },
    epanechnikov: function(v) {
        return Math.abs(v) <= 1 ? 0.75 * (1 - v * v) : 0;
    }
};

exports.makeKDE = function(calcItem, trace, vals) {
    var len = vals.length;
    var kernel = kernels[trace.kernel];
    var bandwidth = calcItem.bandwidth;
    var factor = 1 / (len * bandwidth);

    // don't use Lib.aggNums to skip isNumeric checks
    return function(x) {
        var sum = 0;
        for(var i = 0; i < len; i++) {
            sum += kernel((x - vals[i]) / bandwidth);
        }
        return factor * sum;
    };
};

exports.extractVal = function(o) { return o.v; };
