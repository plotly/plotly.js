/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var boxCalc = require('../box/calc');
var helpers = require('./helpers');
var BADNUM = require('../../constants/numerical').BADNUM;

module.exports = function calc(gd, trace) {
    var cd = boxCalc(gd, trace);

    if(cd[0].t.empty) return cd;

    var fullLayout = gd._fullLayout;
    var valAxis = Axes.getFromId(
        gd,
        trace[trace.orientation === 'h' ? 'xaxis' : 'yaxis']
    );

    var violinScaleGroupStats = fullLayout._violinScaleGroupStats;
    var scaleGroup = trace.scalegroup;
    var groupStats = violinScaleGroupStats[scaleGroup];
    if(!groupStats) {
        groupStats = violinScaleGroupStats[scaleGroup] = {
            maxWidth: 0,
            maxCount: 0
        };
    }

    for(var i = 0; i < cd.length; i++) {
        var cdi = cd[i];
        var vals = cdi.pts.map(helpers.extractVal);

        var bandwidth = cdi.bandwidth = calcBandwidth(trace, cdi, vals);
        var span = cdi.span = calcSpan(trace, cdi, valAxis, bandwidth);

        // step that well covers the bandwidth and is multiple of span distance
        var dist = span[1] - span[0];
        var n = Math.ceil(dist / (bandwidth / 3));
        var step = dist / n;

        if(!isFinite(step) || !isFinite(n)) {
            Lib.error('Something went wrong with computing the violin span');
            cd[0].t.empty = true;
            return cd;
        }

        var kde = helpers.makeKDE(cdi, trace, vals);
        cdi.density = new Array(n);

        for(var k = 0, t = span[0]; t < (span[1] + step / 2); k++, t += step) {
            var v = kde(t);
            groupStats.maxWidth = Math.max(groupStats.maxWidth, v);
            cdi.density[k] = {v: v, t: t};
        }

        Axes.expand(valAxis, span, {padded: true});
        groupStats.maxCount = Math.max(groupStats.maxCount, vals.length);
    }

    cd[0].t.labels.kde = Lib._(gd, 'kde:');

    return cd;
};

// Default to Silveman's rule of thumb
// - https://stats.stackexchange.com/a/6671
// - https://en.wikipedia.org/wiki/Kernel_density_estimation#A_rule-of-thumb_bandwidth_estimator
// - https://github.com/statsmodels/statsmodels/blob/master/statsmodels/nonparametric/bandwidths.py
function silvermanRule(len, ssd, iqr) {
    var a = Math.min(ssd, iqr / 1.349);
    return 1.059 * a * Math.pow(len, -0.2);
}

function calcBandwidth(trace, cdi, vals) {
    var span = cdi.max - cdi.min;

    // plot single-value violin with bandwidth of 1
    if(!span) return 1;

    // Limit how small the bandwidth can be.
    //
    // Silverman's rule of thumb can be "very" small
    // when IQR does a poor job at describing the spread
    // of the distribution.
    // We also want to limit custom bandwidths
    // to not blow up kde computations.

    if(trace.bandwidth) {
        return Math.max(trace.bandwidth, span / 1e4);
    } else {
        var len = vals.length;
        var ssd = Lib.stdev(vals, len - 1, cdi.mean);
        return Math.max(
            silvermanRule(len, ssd, cdi.q3 - cdi.q1),
            span / 100
        );
    }
}

function calcSpan(trace, cdi, valAxis, bandwidth) {
    var spanmode = trace.spanmode;
    var spanIn = trace.span || [];
    var spanTight = [cdi.min, cdi.max];
    var spanLoose = [cdi.min - 2 * bandwidth, cdi.max + 2 * bandwidth];
    var spanOut;

    function calcSpanItem(index) {
        var s = spanIn[index];
        var sc = valAxis.d2c(s, 0, trace[cdi.valLetter + 'calendar']);
        return sc === BADNUM ? spanLoose[index] : sc;
    }

    if(spanmode === 'soft') {
        spanOut = spanLoose;
    } else if(spanmode === 'hard') {
        spanOut = spanTight;
    } else {
        spanOut = [calcSpanItem(0), calcSpanItem(1)];
    }

    // to reuse the equal-range-item block
    var dummyAx = {
        type: 'linear',
        range: spanOut
    };
    Axes.setConvert(dummyAx);
    dummyAx.cleanRange();

    return spanOut;
}
