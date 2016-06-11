/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Plots = require('../../plots/plots');
var Axes = require('../../plots/cartesian/axes');
var Lib = require('../../lib');

/**
 * setPositions is a bit of a misnomer here. It comes from the box plot
 * type that actually does setting of positions. It's the hook though
 * that we need to set up links between traces so that trace-level .plot
 * doesn't require any links between traces.
 */
module.exports = function setPositions(gd, plotinfo) {
    var i, cd, trace;
    var fullLayout = gd._fullLayout;
    var xa = plotinfo.x();
    var ya = plotinfo.y();

    var prevtrace = null;

    for(i = 0; i < gd.calcdata.length; ++i) {
        cd = gd.calcdata[i];
        trace = cd[0].trace;

        if(trace.visible === true && Plots.traceIs(trace, 'cartesian') &&
            trace.xaxis === xa._id &&
            trace.yaxis === ya._id) {

            if (['tonextx', 'tonexty', 'tonext'].indexOf(trace.fill) !== -1) {
                trace._prevtrace = prevtrace;

                if (prevtrace) {
                    prevtrace._nexttrace = trace;
                }
            }

            prevtrace = trace;
        }
    }
};
