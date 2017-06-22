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
exports.segmentsIntersect = function segmentsIntersect(x1, y1, x2, y2, x3, y3, x4, y4) {
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
};
