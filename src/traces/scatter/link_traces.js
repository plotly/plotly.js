/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function linkTraces(gd, plotinfo, cdscatter) {
    var cd, trace;
    var prevtrace = null;

    for(var i = 0; i < cdscatter.length; ++i) {
        cd = cdscatter[i];
        trace = cd[0].trace;

        // Note: The check which ensures all cdscatter here are for the same axis and
        // are either cartesian or scatterternary has been removed. This code assumes
        // the passed scattertraces have been filtered to the proper plot types and
        // the proper subplots.
        if(trace.visible === true) {
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
