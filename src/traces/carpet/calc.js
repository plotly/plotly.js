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
var search = require('../../lib/search').findBin;
var computeControlPoints = require('./compute_control_points');
var map2dArray = require('./map_2d_array');
var createSplineEvaluator = require('./create_spline_evaluator');
var setConvert = require('./set_convert');
var calcGridlines = require('./calc_gridlines');

module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x'),
        ya = Axes.getFromId(gd, trace.yaxis || 'y'),
        aax = trace.aaxis,
        bax = trace.baxis,
        a = trace.a,
        b = trace.b;

    var xdata;
    var ydata = trace.y;

    if(trace._cheater) {
        var avals = aax.cheatertype === 'index' ? a.length : a
        var bvals = bax.cheatertype === 'index' ? b.length : b;
        trace.x = xdata = cheaterBasis(avals, bvals, trace.cheaterslope);
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

    // Precompute the cartesian-space coordinates of the grid lines:
    var x = xdata;
    var y = trace.y;

    // Convert cartesian-space x/y coordinates to screen space pixel coordinates:
    trace.xp = map2dArray(trace.xp, x, xa.c2p);
    trace.yp = map2dArray(trace.yp, y, ya.c2p);

    // Create conversions from one coordinate system to another:
    setConvert(trace, xa, ya);

    trace._agrid = calcGridlines(trace, 'a', 'b', xa, ya);
    trace._bgrid = calcGridlines(trace, 'b', 'a', xa, ya);

    return [{
        x: x,
        y: y,
        a: a,
        b: b
    }];
};

/*
 * Given a data range from starting at x1, this function computes the first
 * point distributed along x0 + n * dx that lies within the range.
 */
function getLinspaceStartingPoint (xlow, x0, dx) {
    return x0 + dx * Math.ceil((xlow - x0) / dx);
}
