
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
    var i, value;
    var na = trace.a.length;
    var nb = trace.b.length;
    var z = trace.z;

    var boundaryMax = -Infinity;
    var boundaryMin = Infinity;

    for(i = 0; i < na; i++) {
        boundaryMin = Math.min(boundaryMin, z[i][0]);
        boundaryMin = Math.min(boundaryMin, z[i][nb - 1]);
        boundaryMax = Math.max(boundaryMax, z[i][0]);
        boundaryMax = Math.max(boundaryMax, z[i][nb - 1]);
    }
    for(i = 1; i < nb - 1; i++) {
        boundaryMin = Math.min(boundaryMin, z[0][i]);
        boundaryMin = Math.min(boundaryMin, z[na - 1][i]);
        boundaryMax = Math.max(boundaryMax, z[0][i]);
        boundaryMax = Math.max(boundaryMax, z[na - 1][i]);
    }


    switch(operation) {
        case '>':
        case '>=':
            if(trace.contours.value > boundaryMax) {
                pathinfo[0].prefixBoundary = 'reverse';
            }

            break;
        case '<':
        case '<=':
            if(trace.contours.value < boundaryMin) {
                pathinfo[0].prefixBoundary = 'reverse';
            }

            break;
        case '[]':
        case '()':
            var v1 = Math.min.apply(null, trace.contours.value);
            var v2 = Math.max.apply(null, trace.contours.value);
            if (v2 < boundaryMin) {
                pathinfo[0].prefixBoundary = 'reverse';
            }
            if (v1 > boundaryMax) {
                pathinfo[0].prefixBoundary = 'reverse';
            }
            break;
        case '][':
        case ')(':
            var v1 = Math.min.apply(null, trace.contours.value);
            var v2 = Math.max.apply(null, trace.contours.value);
            console.log('\nv1, v2, min, max:', v1, v2, boundaryMin, boundaryMax);
            if (v1 < boundaryMin && v2 > boundaryMax) {
                pathinfo[0].prefixBoundary = 'reverse';
            }
            /*if (v2 < boundaryMax && v1 > boundaryMin) {
                console.log('v2 < max & v1 > min');
                pathinfo[0].prefixBoundary = 'forward';
            } else {
                if (v2 > boundaryMax && v1 < boundaryMin) {
                } else {
                    if (v2 > boundaryMax) {
                        console.log('v2 > max');
                        pathinfo[0].prefixBoundary = 'forward';
                    }
                    if (v1 < boundaryMin) {
                        console.log('v1 < min');
                        pathinfo[0].suffixBoundary = 'forward';
                    }
                }
            }*/
            break;
    }
};
