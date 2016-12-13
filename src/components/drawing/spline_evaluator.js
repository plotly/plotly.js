/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

// generalized Catmull-Rom splines, per
// http://www.cemyuksel.com/research/catmullrom_param/catmullrom.pdf
var CatmullRomExp = 0.5;
function makeControlPoints(p0, p1, p2, smoothness) {
  var d1x = p0[0] - p1[0],
      d1y = p0[1] - p1[1],
      d2x = p2[0] - p1[0],
      d2y = p2[1] - p1[1],
      d1a = Math.pow(d1x * d1x + d1y * d1y, CatmullRomExp / 2),
      d2a = Math.pow(d2x * d2x + d2y * d2y, CatmullRomExp / 2),
      numx = (d2a * d2a * d1x - d1a * d1a * d2x) * smoothness,
      numy = (d2a * d2a * d1y - d1a * d1a * d2y) * smoothness,
      denom1 = 3 * d2a * (d1a + d2a),
      denom2 = 3 * d1a * (d1a + d2a);
    var dxL = p1[0] + (denom1 && numx / denom1);
    var dyL = p1[1] + (denom1 && numy / denom1);
    var dxU = p1[0] - (denom2 && numx / denom2);
    var dyU = p1[1] - (denom2 && numy / denom2);

  return [[dxL, dyL], [dxU, dyU]];
}

/*
 * Computes centripetal catmull-rom control points. These shouldn't be confused
 * with tangents, which are slightly different. Specifically, the length of the
 * tangent vector is
 *
 *   degree * (control point - reference point)
 *
 * In other words, it really doesn't make too much of a difference whether we
 * work with tangents or control points.
 */
module.exports.computeControlPoints = function (pts, smoothness) {
    var tangents = [];
    for(i = 1; i < pts.length - 1; i++) {
        tangents.push(makeControlPoints(pts[i - 1], pts[i], pts[i + 1], smoothness));
    }
    return tangents;
}

module.exports.evaluateSpline = function evaluateSpline (t, pts, controlpts, smoothness) {
    var n = pts.length;
    if (n < 3) {
        var x = (1 - t) * pts[0][0] + t * pts[1][0];
        var y = (1 - t) * pts[0][1] + t * pts[1][1];
        return [x, y];
    } else {
        // Compute the controlpts *once* at the beginning, and store them:
        var a, b, c, d, p0, p1, p2, p3, i, t, ot;
        param = Math.max(0, Math.min(n - 1, param));
        i = Math.min(Math.floor(param), n - 2);
        t = param - i;
        ot = 1 - t;

        p0 = pts[i];
        p3 = pts[i + 1];

        if (i === 0 || i === n - 2) {
            // Evaluate the quadratic first and last segments;
            p1 = i === 0 ? controlpts[i][0] : controlpts[i - 1][1];
            a = ot * ot;
            b = 2 * ot * t;
            c = t * t;
            return [
                a * p0[0] + b * p1[0] + c * p3[0],
                a * p0[1] + b * p1[1] + c * p3[1]
            ];
        } else {
        // Evaluate internal cubic spline segments:
            p1 = controlpts[i - 1][1];
            p2 = controlpts[i][0];
            p3 = pts[i + 1];

            a = ot * ot * ot;
            b = 3 * ot * ot * t;
            c = 3 * ot * t * t;
            d = t * t * t;

            return [
                a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
                a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]
            ];
        }
    }
}

