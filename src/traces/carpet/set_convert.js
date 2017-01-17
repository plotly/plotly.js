/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var search = require('../../lib/search').findBin;
var computeControlPoints = require('./compute_control_points');
var createSplineEvaluator = require('./create_spline_evaluator');
var createIDerivativeEvaluator = require('./create_i_derivative_evaluator');
var createJDerivativeEvaluator = require('./create_j_derivative_evaluator');

/*
 * Create conversion functions to go from one basis to another. In particular the letter
 * abbreviations are:
 *
 *   i: i/j coordinates along the grid. Integer values correspond to data points
 *   a: real-valued coordinates along the a/b axes
 *   c: cartesian x-y coordinates
 *   p: screen-space pixel coordinates
 */
module.exports = function setConvert(trace) {
    var a = trace.a;
    var b = trace.b;
    var na = trace.a.length;
    var nb = trace.b.length;
    var aax = trace.aaxis;
    var bax = trace.baxis;
    var x = trace.x;
    var y = trace.y;

    // This is potentially a very expensive step! It does the bulk of the work of constructing
    // an expanded basis of control points. Note in particular that it overwrites the existing
    // basis without creating a new array since that would potentially thrash the garbage
    // collector.
    var result = computeControlPoints(trace._xctrl, trace._yctrl, x, y, aax.smoothing, bax.smoothing);
    trace._xctrl = result[0];
    trace._yctrl = result[1];

    // This step is the second step in the process, but it's somewhat simpler. It just unrolls
    // some logic since it would be unnecessarily expensive to compute both interpolations
    // nearly identically but separately and to include a bunch of linear vs. bicubic logic in
    // every single call.
    trace._evalxy = createSplineEvaluator([trace._xctrl, trace._yctrl], aax.smoothing, bax.smoothing);

    trace.dxydi = createIDerivativeEvaluator([trace._xctrl, trace._yctrl], aax.smoothing, bax.smoothing);
    trace.dxydj = createJDerivativeEvaluator([trace._xctrl, trace._yctrl], aax.smoothing, bax.smoothing);

    /*
     * Convert from i/j data grid coordinates to a/b values. Note in particular that this
     * is *linear* interpolation, even if the data is interpolated bicubically.
     */
    trace.i2a = function(i) {
        var i0 = Math.max(0, Math.floor(i[0]), na - 2);
        var ti = i[0] - i0;
        return (1 - ti) * a[i0] + ti * a[i0 + 1];
    };

    trace.j2b = function(j) {
        var j0 = Math.max(0, Math.floor(j[1]), na - 2);
        var tj = j[1] - j0;
        return (1 - tj) * b[j0] + tj * b[j0 + 1];
    };

    trace.ij2ab = function(ij) {
        return [trace.i2a(ij[0]), trace.j2b(ij[1])];
    };

    /*
     * Convert from a/b coordinates to i/j grid-numbered coordinates. This requires searching
     * through the a/b data arrays and assumes they are monotonic, which is presumed to have
     * been enforced already.
     */
    trace.a2i = function(aval) {
        var i0 = Math.max(0, Math.min(search(aval, a), na - 2));
        var a0 = a[i0];
        var a1 = a[i0 + 1];
        return Math.max(0, Math.min(na - 1, i0 + (aval - a0) / (a1 - a0)));
    };

    trace.b2j = function(bval) {
        var j0 = Math.max(0, Math.min(search(bval, b), nb - 2));
        var b0 = b[j0];
        var b1 = b[j0 + 1];
        return Math.max(0, Math.min(nb - 1, j0 + (bval - b0) / (b1 - b0)));
    };

    trace.ab2ij = function(ab) {
        return [trace.a2i(ab[0]), trace.b2j(ab[1])];
    };

    /*
     * Convert from i/j coordinates to x/y caretesian coordinates. This means either bilinear
     * or bicubic spline evaluation, but the hard part is already done at this point.
     */
    trace.i2c = function(ij) {
        var i0 = Math.max(0, Math.min(na - 2, Math.floor(ij[0])));
        var ti = ij[0] - i0;
        var j0 = Math.max(0, Math.min(nb - 2, Math.floor(ij[1])));
        var tj = ij[1] - j0;
        return trace._evalxy([], i0, j0, ti, tj);
    };

    trace.ab2xy = function(aval, bval) {
        if(aval < a[0] || aval > a[na - 1] | bval < b[0] || bval > b[nb - 1]) {
            return [false, false];
        }
        var i = trace.a2i(aval);
        var i0 = Math.max(0, Math.min(na - 2, Math.floor(i)));
        var ti = i - i0;

        var j = trace.b2j(bval);
        var j0 = Math.max(0, Math.min(nb - 2, Math.floor(j)));
        var tj = j - j0;

        if(tj < 0 || tj > 1 || ti < 0 || ti > 1) {
            return [false, false];
        }
        return trace._evalxy([], i0, j0, ti, tj);
    };

    trace.c2p = function(xy, xa, ya) {
        return [xa.c2p(xy[0]), ya.c2p(xy[1])];
    };

    trace.p2x = function(p, xa, ya) {
        return [xa.p2c(p[0]), ya.p2c(p[1])];
    };

    trace.dadi = function(i /* , u*/) {
        // Right now only a piecewise linear a or b basis is permitted since smoother interpolation
        // would cause monotonicity problems. As a retult, u is entirely disregarded in this
        // computation, though we'll specify it as a parameter for the sake of completeness and
        // future-proofing. It would be possible to use monotonic cubic interpolation, for example.
        //
        // See: https://en.wikipedia.org/wiki/Monotone_cubic_interpolation

        // u = u || 0;

        var i0 = Math.max(0, Math.min(a.length - 2, i));

        // The step (demoninator) is implicitly 1 since that's the grid spacing.
        return a[i0 + 1] - a[i0];
    };

    trace.dbdj = function(j /* , v*/) {
        // See above caveats for dadi which also apply here
        var j0 = Math.max(0, Math.min(b.length - 2, j));

        // The step (demoninator) is implicitly 1 since that's the grid spacing.
        return b[j0 + 1] - b[j0];
    };

    // Takes: grid cell coordinate (i, j) and fractional grid cell coordinates (u, v)
    // Returns: (dx/da, dy/db)
    //
    // NB: separate grid cell + fractional grid cell coordinate format is due to the discontinuous
    // derivative, as described better in create_i_derivative_evaluator.js
    trace.dxyda = function(i0, j0, u, v) {
        var dxydi = trace.dxydi(null, i0, j0, u, v);
        var dadi = trace.dadi(i0, u);

        return [dxydi[0] / dadi, dxydi[1] / dadi];
    };

    trace.dxydb = function(i0, j0, u, v) {
        var dxydj = trace.dxydj(null, i0, j0, u, v);
        var dbdj = trace.dbdj(j0, v);

        return [dxydj[0] / dbdj, dxydj[1] / dbdj];
    };

    trace.dpdx = function(xa) {
        return xa._m;
    };

    trace.dpdy = function(ya) {
        return ya._m;
    };
};
