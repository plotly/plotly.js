/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Axes = require('../../plots/cartesian/axes');

module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x'),
        ya = Axes.getFromId(gd, trace.yaxis || 'y');

    var x = xa.makeCalcdata(trace, 'x'),
        y = ya.makeCalcdata(trace, 'y');

    var serieslen = Math.min(x.length, y.length), i;

    // create the "calculated data" to plot
    var cd = new Array(serieslen);
    for(i = 0; i < serieslen; i++) {
        cd[i] = {x: x[i], y: y[i]};
    }

    return cd;
};
