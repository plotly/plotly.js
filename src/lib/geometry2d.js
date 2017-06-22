/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/*
 * look for intersection of two line segments
 *   (1->2 and 3->4) - returns array [x,y] if they do, null if not
 */
exports.segmentsIntersect = segmentsIntersect;
function segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
    var a = x2 - x1,
        b = x3 - x1,
        c = x4 - x3,
        d = y2 - y1,
        e = y3 - y1,
        f = y4 - y3,
        det = a * f - c * d;
    // parallel lines? intersection is undefined
    // ignore the case where they are colinear
    if(det === 0) return null;
    var t = (b * f - c * e) / det,
        u = (b * d - a * e) / det;
    // segments do not intersect?
    if(u < 0 || u > 1 || t < 0 || t > 1) return null;

    return {x: x1 + a * t, y: y1 + d * t};
}

/*
 * find the minimum distance between two line segments (1->2 and 3->4)
 */
exports.segmentDistance = function segmentDistance(x1, y1, x2, y2, x3, y3, x4, y4) {
    if(segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4)) return 0;

    // the two segments and their lengths squared
    var x12 = x2 - x1;
    var y12 = y2 - y1;
    var x34 = x4 - x3;
    var y34 = y4 - y3;
    var l2_12 = x12 * x12 + y12 * y12;
    var l2_34 = x34 * x34 + y34 * y34;

    // calculate distance squared, then take the sqrt at the very end
    var dist2 = Math.min(
        perpDistance2(x12, y12, l2_12, x3 - x1, y3 - y1),
        perpDistance2(x12, y12, l2_12, x4 - x1, y4 - y1),
        perpDistance2(x34, y34, l2_34, x1 - x3, y1 - y3),
        perpDistance2(x34, y34, l2_34, x2 - x3, y2 - y3)
    );

    return Math.sqrt(dist2);
};

/*
 * distance squared from segment ab to point c
 * [xab, yab] is the vector b-a
 * [xac, yac] is the vector c-a
 * l2_ab is the length squared of (b-a), just to simplify calculation
 */
function perpDistance2(xab, yab, l2_ab, xac, yac) {
    var fc_ab = (xac * xab + yac * yab);
    if(fc_ab < 0) {
        // point c is closer to point a
        return xac * xac + yac * yac;
    }
    else if(fc_ab > l2_ab) {
        // point c is closer to point b
        var xbc = xac - xab;
        var ybc = yac - yab;
        return xbc * xbc + ybc * ybc;
    }
    else {
        // perpendicular distance is the shortest
        var crossProduct = xac * yab - yac * xab;
        return crossProduct * crossProduct / l2_ab;
    }
}
