/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

module.exports = function emptyPathinfo(contours, plotinfo, cd0) {
    var cs = contours.size;
    var pathinfo = [];

    var carpet = cd0.trace.carpetTrace;

    for(var ci = contours.start; ci < contours.end + cs / 10; ci += cs) {
        pathinfo.push({
            level: ci,
            // all the cells with nontrivial marching index
            crossings: {},
            // starting points on the edges of the lattice for each contour
            starts: [],
            // all unclosed paths (may have less items than starts,
            // if a path is closed by rounding)
            edgepaths: [],
            // all closed paths
            paths: [],
            // store axes so we can convert to px
            xaxis: carpet.aaxis,
            yaxis: carpet.baxis,
            // full data arrays to use for interpolation
            x: cd0.a,
            y: cd0.b,
            z: cd0.z,
            smoothing: cd0.trace.line.smoothing
        });

        if(pathinfo.length > 1000) {
            Lib.warn('Too many contours, clipping at 1000', contours);
            break;
        }
    }
    return pathinfo;
};
