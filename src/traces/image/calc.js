/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../../plots/cartesian/axes');
var maxRowLength = require('../../lib').maxRowLength;

module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x');
    var ya = Axes.getFromId(gd, trace.yaxis || 'y');

    var x0 = xa.d2c(trace.x0) - trace.dx / 2;
    var y0 = ya.d2c(trace.y0) - trace.dy / 2;
    var h = trace.z.length;
    var w = maxRowLength(trace.z);

    // Set axis range
    var i;
    var xrange = [x0, x0 + w * trace.dx];
    var yrange = [y0, y0 + h * trace.dy];
    if(xa && xa.type === 'log') for(i = 0; i < w; i++) xrange.push(x0 + i * trace.dx);
    if(ya && ya.type === 'log') for(i = 0; i < h; i++) yrange.push(y0 + i * trace.dy);
    trace._extremes[xa._id] = Axes.findExtremes(xa, xrange);
    trace._extremes[ya._id] = Axes.findExtremes(ya, yrange);

    var cd0 = {
        x0: x0,
        y0: y0,
        z: trace.z,
        w: w,
        h: h
    };
    return [cd0];
};
