/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var boxCalc = require('../box/calc');

var kernels = {
    gaussian: function(v) {
        return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * v * v);
    }
};

module.exports = function calc(gd, trace) {
    var cd = boxCalc(gd, trace);

    if(cd[0].t.empty) return cd;

    for(var i = 0; i < cd.length; i++) {
        var cdi = cd[i];
        var vals = cdi.pts.map(extractVal);
        var len = vals.length;
        var span = trace.span || [cdi.min, cdi.max];
        var dist = span[1] - span[0];
        // sample standard deviation
        var ssd = Lib.stdev(vals, len - 1, cdi.mean);
        var bandwidthDflt = ruleOfThumbBandwidth(vals, ssd, cdi.q3 - cdi.q1);
        var bandwidth = trace.bandwidth || bandwidthDflt;
        var kde = makeKDE(vals, kernels.gaussian, bandwidth);
        // step that well covers the bandwidth and is multiple of span distance
        var n = Math.ceil(dist / (Math.min(bandwidthDflt, bandwidth) / 3));
        var step = dist / n;

        cdi.density = new Array(n);
        cdi.violinMaxWidth = 0;

        for(var k = 0, t = span[0]; t < (span[1] + step / 2); k++, t += step) {
            var v = kde(t);
            cdi.violinMaxWidth = Math.max(cdi.violinMaxWidth, v);
            cdi.density[k] = {v: v, t: t};
        }
    }

    return cd;
};

// Default to Silveman's rule of thumb:
// - https://en.wikipedia.org/wiki/Kernel_density_estimation#A_rule-of-thumb_bandwidth_estimator
// - https://github.com/statsmodels/statsmodels/blob/master/statsmodels/nonparametric/bandwidths.py
function ruleOfThumbBandwidth(vals, ssd, iqr) {
    var a = Math.min(ssd, iqr / 1.349);
    return 1.059 * a * Math.pow(vals.length, -0.2);
}

function makeKDE(vals, kernel, bandwidth) {
    var len = vals.length;
    var factor = 1 / (len * bandwidth);

    // don't use Lib.aggNums to skip isNumeric checks
    return function(x) {
        var sum = 0;
        for(var i = 0; i < len; i++) {
            sum += kernel((x - vals[i]) / bandwidth);
        }
        return factor * sum;
    };
}

function extractVal(o) { return o.v; }
