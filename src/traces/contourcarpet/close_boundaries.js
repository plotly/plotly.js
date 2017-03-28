
/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function(pathinfo, operation, perimeter, trace) {
    var i, value;
    var na = trace.a.length;
    var nb = trace.b.length;
    var z = trace.z;

    switch(operation) {
        case '>':
        case '>=':
            var boundaryMax = -Infinity;

            for(i = 0; i < na; i++) {
                boundaryMax = Math.max(boundaryMax, z[i][0]);
                boundaryMax = Math.max(boundaryMax, z[i][nb - 1]);
            }
            for(i = 1; i < nb - 1; i++) {
                boundaryMax = Math.max(boundaryMax, z[0][i]);
                boundaryMax = Math.max(boundaryMax, z[na - 1][i]);
            }

            value = trace.contours.value;

            if(value > boundaryMax) {
                pathinfo[0].prefixBoundary = true;
            }

            break;
        case '<':
        case '<=':
            var boundaryMin = Infinity;

            for(i = 0; i < na; i++) {
                boundaryMin = Math.min(boundaryMin, z[i][0]);
                boundaryMin = Math.min(boundaryMin, z[i][nb - 1]);
            }
            for(i = 1; i < nb - 1; i++) {
                boundaryMin = Math.min(boundaryMin, z[0][i]);
                boundaryMin = Math.min(boundaryMin, z[na - 1][i]);
            }

            value = trace.contours.value;

            if(value < boundaryMin) {
                pathinfo[0].prefixBoundary = true;
            }

            break;
    }
};
