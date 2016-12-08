/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../../plots/cartesian/axes');
var cheaterBasis = require('./cheater_basis');
var arrayMinmax = require('./array_minmax');


module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x'),
        ya = Axes.getFromId(gd, trace.yaxis || 'y');

    var xdata;
    var ydata = trace.y;

    if(trace._cheater) {
        xdata = cheaterBasis(trace.a.length, trace.b.length, trace.cheaterslope);
    } else {
        xdata = trace.x;
    }

    // This is a rather expensive scan. Nothing guarantees monotonicity,
    // so we need to scan through all data to get proper ranges:
    var xrange = arrayMinmax(xdata);
    var yrange = arrayMinmax(ydata);

    var dx = 0.5 * (xrange[1] - xrange[0]);
    var xc = 0.5 * (xrange[1] + xrange[0]);

    var dy = 0.5 * (yrange[1] - yrange[0]);
    var yc = 0.5 * (yrange[1] + yrange[0]);

    var grow = 1.3;
    xrange = [xc - dx * grow, xc + dx * grow];
    yrange = [yc - dy * grow, yc + dy * grow];

    Axes.expand(xa, xrange, {padded: true});
    Axes.expand(ya, yrange, {padded: true});

    var cd0 = {
        x: xdata,
        y: trace.y,
        a: trace.a,
        b: trace.b
    };

    return [cd0];
};
