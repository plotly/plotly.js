/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Axes = require('../../plots/cartesian/axes');
var heatmapCalc = require('../heatmap/calc');


// most is the same as heatmap calc, then adjust it
// though a few things inside heatmap calc still look for
// contour maps, because the makeBoundArray calls are too entangled
module.exports = function calc(gd, trace) {
    var cd = heatmapCalc(gd, trace),
        contours = trace.contours;

    // check if we need to auto-choose contour levels
    if(trace.autocontour !== false) {
        var dummyAx = {
            type: 'linear',
            range: [trace.zmin, trace.zmax]
        };

        Axes.autoTicks(
            dummyAx,
            (trace.zmax - trace.zmin) / (trace.ncontours || 15)
        );

        contours.start = Axes.tickFirst(dummyAx);
        contours.size = dummyAx.dtick;
        dummyAx.range.reverse();
        contours.end = Axes.tickFirst(dummyAx);

        if(contours.start === trace.zmin) contours.start += contours.size;
        if(contours.end === trace.zmax) contours.end -= contours.size;

        // so rounding errors don't cause us to miss the last contour
        contours.end += contours.size / 100;

        // copy auto-contour info back to the source data.
        trace._input.contours = contours;
    }

    return cd;
};
