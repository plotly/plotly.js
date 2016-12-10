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
var evaluateControlPoints = require('./evaluate_control_points');

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
        xdata = cheaterBasis(avals, bvals, trace.cheaterslope);
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

    // Next compute the control points in whichever directions are necessary:
    var result = computeControlPoints(trace.xctrl, trace.yctrl, x, y, aax.smoothing, bax.smoothing);
    trace.xctrl = result[0];
    trace.yctrl = result[1];


    console.log('evaluateControlPoints(:', evaluateControlPoints([trace.xctrl, trace.yctrl], 0.5, 0.5));


    //trace.ab2c = getConvert(x, y, a, b, aax.smoothing, bax.smoothing);

    // This is just a transposed function that will be useful in making
    // the computations a/b-agnostic:
    //trace.ba2c = function (b, a) { return trace.ab2c(a, b); }

    //var agrid = makeGridLines(a, aax);
    //var bgrid = makeGridLines(b, bax);

    //trace.aaxis._tickinfo = agrid;
    //trace.baxis._tickinfo = bgrid;

    var cd0 = {
        x: x,
        y: y,
        a: a,
        b: b
    };

    return [cd0];
};



/*
 * Interpolate in the b-direction along constant-a lines
 *   x, y: 2D data arrays to be interpolated
 *   aidx: index of the a gridline along which to evaluate
 *   bidx0: lower-index of the b cell in which to interpolate
 *   tb: an interpolant in [0, 1]
 */
/*function interpolateConstA (x, y, aidx, bidx0, tb, bsmoothing) {
    if (bsmoothing) {
        return [
            x[aidx][bidx0] * (1 - tb) + x[aidx][bidx0 + 1] * tb,
            y[aidx][bidx0] * (1 - tb) + y[aidx][bidx0 + 1] * tb
        ];
    } else {
        return [
            x[aidx][bidx0] * (1 - tb) + x[aidx][bidx0 + 1] * tb,
            y[aidx][bidx0] * (1 - tb) + y[aidx][bidx0 + 1] * tb
        ];
    }
}*/

/*
 * Interpolate in the a and b directions
 *   x, y: 2D data arrays to be interpolated
 *   aidx0: lower index of the a cell in which to interpolatel
 *   bidx0: lower index of the b cell in which to interpolate
 *   ta: an interpolant for the a direction in [0, 1]
 *   tb: an interpolant for the b direction in [0, 1]
 */
/*function interpolateAB (x, y, aidx0, ta, bidx0, tb, asmoothing, bsmoothing) {
    if (asmoothing) {
        var xy0 = interpolateConstA(x, y, aidx0, bidx0, tb, bsmoothing);
        var xy1 = interpolateConstA(x, y, aidx0 + 1, bidx0, tb, bsmoothing);

        return [
            xy0[0] * (1 - ta) + xy1[0] * ta,
            xy0[1] * (1 - ta) + xy1[1] * ta
        ];
    } else {
        var xy0 = interpolateConstA(x, y, aidx0, bidx0, tb, bsmoothing);
        var xy1 = interpolateConstA(x, y, aidx0 + 1, bidx0, tb, bsmoothing);

        return [
            xy0[0] * (1 - ta) + xy1[0] * ta,
            xy0[1] * (1 - ta) + xy1[1] * ta
        ];
    }
}*/

/*
 * Return a function that converts a/b coordinates to x/y values
 */
/*function getConvert (x, y, a, b, asmoothing, bsmoothing) {
    return function (aval, bval) {
        // Get the lower-indices of the box in which the point falls:
        var aidx = Math.min(search(aval, a), a.length - 2);
        var bidx = Math.min(search(bval, b), b.length - 2);

        var ta = (aval - a[aidx]) / (a[aidx + 1] - a[aidx]);
        var tb = (bval - b[bidx]) / (b[bidx + 1] - b[bidx]);

        return interpolateAB(x, y, aidx, ta, bidx, tb, asmoothing, bsmoothing);
    };
}*/

/*
 * Interpret the tick properties to return indices, interpolants,
 * and values of grid lines
 *
 * Output is:
 *      ilower: lower index of the cell in which the gridline lies
 *      interpolant: fractional distance of this gridline to the next cell (in [0, 1])
 *      values: value of the axis coordinate at each respective gridline
 */
/*function makeGridLines (data, axis) {
    var gridlines = [];
    var t = [];
    var i0 = [];
    var i1 = [];
    var values = [];
    switch(axis.tickmode) {
    case 'array':
        var start = axis.arraytick0 % axis.arraydtick;
        var step = axis.arraydtick;
        var end = data.length;
        // This could be optimized, but we'll convert this to a/b space and then do
        // the interpolation in
        for (var i = start; i < end; i += step) {
            // If it's the end point, we'll use the end of the previous range to
            // avoid going out of bounds:
            var endshift = i >= end - 1 ? 1 : 0;

            gridlines.push({
                param: i,
                idx: i - endshift,
                tInterp: endshift,
                value: data[i]
            });
        }
        break;
    case 'linear':
        var v1 = getLinspaceStartingPoint(data[0], axis.tick0, axis.dtick);
        var n = Math.ceil((data[data.length - 1] - v1) / axis.dtick);

        // This could be optimized, but we'll convert this to a/b space and then do
        // the interpolation in
        for (var i = 0; i < n; i++) {
            var val = v1 + axis.dtick * i;
            var idx = Math.min(search(val, data), data.length - 2);
            gridlines.push({
                param: (val - data[0]) / (data[data.length - 1] - data[0]) * data.length,
                idx: idx,
                tInterp: (val - data[idx]) / (data[idx + 1] - data[idx]),
                value: val
            });
        }
    }

    console.log('gridlines:', gridlines);

    return gridlines;
}*/

/*
 * Given a data range from starting at x1, this function computes the first
 * point distributed along x0 + n * dx that lies within the range.
 */
function getLinspaceStartingPoint (xlow, x0, dx) {
    return x0 + dx * Math.ceil((xlow - x0) / dx);
}
