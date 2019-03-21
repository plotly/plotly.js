/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var barCrossTraceCalc = require('../bar/cross_trace_calc').crossTraceCalc;

module.exports = function crossTraceCalc(gd, plotinfo) {

    barCrossTraceCalc(gd, plotinfo);

    var xa = plotinfo.xaxis;
    var ya = plotinfo.yaxis;

    var fullTraces = gd._fullData;
    var calcTraces = gd.calcdata;
    var waterfalls = [];
    var i;

    for(i = 0; i < fullTraces.length; i++) {
        var fullTrace = fullTraces[i];
        if(
            fullTrace.visible === true &&
            fullTrace.xaxis === xa._id &&
            fullTrace.yaxis === ya._id &&
            fullTrace.type === 'waterfall'
        ) {
            waterfalls.push(calcTraces[i]);
        }
    }

    for(i = 0; i < waterfalls.length; i++) {
        var cd = waterfalls[i];

        for(var j = 0; j < cd.length; j++) {
            var di = cd[j];

            if(di.isSum === false) {
                di.s0 += (j === 0) ? 0 : cd[j - 1].s;
            }
        }
    }
};
