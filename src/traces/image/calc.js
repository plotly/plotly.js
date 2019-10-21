/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../../plots/cartesian/axes');

module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x');
    var ya = Axes.getFromId(gd, trace.yaxis || 'y');

    var x0 = trace.x0 - trace.dx / 2;
    var y0 = trace.y0 - trace.dy / 2;
    var h = trace.z.length;
    var w = trace.z[0].length;

    trace._extremes[xa._id] = Axes.findExtremes(xa, [x0, x0 + w * trace.dx]);
    trace._extremes[ya._id] = Axes.findExtremes(ya, [y0, y0 + h * trace.dy]);

    var cd0 = {
        x0: x0,
        y0: y0,
        z: trace.z,
        w: w,
        h: h
    };
    return [cd0];
};
