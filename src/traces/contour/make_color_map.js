/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var Colorscale = require('../../components/colorscale');

module.exports = function makeColorMap(trace) {
    var contours = trace.contours,
        start = contours.start,
        end = contours.end,
        cs = contours.size || 1,
        nc = Math.floor((end + cs / 10 - start) / cs) + 1,
        extra = contours.coloring === 'lines' ? 0 : 1;

    var scl = trace.colorscale,
        len = scl.length;

    var domain = new Array(len),
        range = new Array(len);

    var si, i;

    if(contours.coloring === 'heatmap') {
        if(trace.zauto && trace.autocontour === false) {
            trace.zmin = start - cs / 2;
            trace.zmax = trace.zmin + nc * cs;
        }

        for(i = 0; i < len; i++) {
            si = scl[i];

            domain[i] = si[0] * (trace.zmax - trace.zmin) + trace.zmin;
            range[i] = si[1];
        }

        // do the contours extend beyond the colorscale?
        // if so, extend the colorscale with constants
        var zRange = d3.extent([trace.zmin, trace.zmax, contours.start,
                contours.start + cs * (nc - 1)]),
            zmin = zRange[trace.zmin < trace.zmax ? 0 : 1],
            zmax = zRange[trace.zmin < trace.zmax ? 1 : 0];

        if(zmin !== trace.zmin) {
            domain.splice(0, 0, zmin);
            range.splice(0, 0, Range[0]);
        }

        if(zmax !== trace.zmax) {
            domain.push(zmax);
            range.push(range[range.length - 1]);
        }
    }
    else {
        for(i = 0; i < len; i++) {
            si = scl[i];

            domain[i] = (si[0] * (nc + extra - 1) - (extra / 2)) * cs + start;
            range[i] = si[1];
        }
    }

    return Colorscale.makeColorScaleFunc({
        domain: domain,
        range: range,
    }, {
        noNumericCheck: true
    });
};
