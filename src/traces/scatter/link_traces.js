/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Plots = require('../../plots/plots');

module.exports = function linkTraces(gd, plotinfo, cdscatter) {
    var i, cd, trace;
    var xa = plotinfo.x();
    var ya = plotinfo.y();

    var prevtrace = null;

    for(i = 0; i < cdscatter.length; ++i) {
        cd = cdscatter[i];
        trace = cd[0].trace;

        // console.log('visible:', trace.uid, trace.visible);
        if(trace.visible === true && Plots.traceIs(trace, 'cartesian') &&
            trace.xaxis === xa._id &&
            trace.yaxis === ya._id) {

            trace._nexttrace = null;

            if(['tonextx', 'tonexty', 'tonext'].indexOf(trace.fill) !== -1) {
                trace._prevtrace = prevtrace;

                if(prevtrace) {
                    prevtrace._nexttrace = trace;
                }
            }

            prevtrace = trace;
        } else {
            trace._prevtrace = trace._nexttrace = null;
        }
    }
};
