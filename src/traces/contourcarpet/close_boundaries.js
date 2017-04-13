/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function(pathinfo, operation, perimeter, trace) {
    // Abandon all hope, ye who enter here.
    var i, v1, v2;
    var na = trace.a.length;
    var nb = trace.b.length;
    var z = trace.z;

    var boundaryMax = -Infinity;
    var boundaryMin = Infinity;

    for(i = 0; i < nb; i++) {
        boundaryMin = Math.min(boundaryMin, z[i][0]);
        boundaryMin = Math.min(boundaryMin, z[i][na - 1]);
        boundaryMax = Math.max(boundaryMax, z[i][0]);
        boundaryMax = Math.max(boundaryMax, z[i][na - 1]);
    }

    for(i = 1; i < na - 1; i++) {
        boundaryMin = Math.min(boundaryMin, z[0][i]);
        boundaryMin = Math.min(boundaryMin, z[nb - 1][i]);
        boundaryMax = Math.max(boundaryMax, z[0][i]);
        boundaryMax = Math.max(boundaryMax, z[nb - 1][i]);
    }

    switch(operation) {
        case '>':
        case '>=':
            if(trace.contours.value > boundaryMax) {
                pathinfo[0].prefixBoundary = true;
            }
            break;
        case '<':
        case '<=':
            if(trace.contours.value < boundaryMin) {
                pathinfo[0].prefixBoundary = true;
            }
            break;
        case '[]':
        case '()':
            v1 = Math.min.apply(null, trace.contours.value);
            v2 = Math.max.apply(null, trace.contours.value);
            if(v2 < boundaryMin) {
                pathinfo[0].prefixBoundary = true;
            }
            if(v1 > boundaryMax) {
                pathinfo[0].prefixBoundary = true;
            }
            break;
        case '][':
        case ')(':
            v1 = Math.min.apply(null, trace.contours.value);
            v2 = Math.max.apply(null, trace.contours.value);
            if(v1 < boundaryMin && v2 > boundaryMax) {
                pathinfo[0].prefixBoundary = true;
            }
            break;
    }
};
