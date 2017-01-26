/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Axes = require('../../plots/cartesian/axes');
var extendFlat = require('../../lib').extendFlat;
var heatmapCalc = require('../heatmap/calc');


// most is the same as heatmap calc, then adjust it
// though a few things inside heatmap calc still look for
// contour maps, because the makeBoundArray calls are too entangled
module.exports = function calc(gd, trace) {
    var cd = heatmapCalc(gd, trace),
        contours = trace.contours;

    // check if we need to auto-choose contour levels
    if(trace.autocontour !== false) {
        var dummyAx = autoContours(trace.zmin, trace.zmax, trace.ncontours);

        contours.size = dummyAx.dtick;

        contours.start = Axes.tickFirst(dummyAx);
        dummyAx.range.reverse();
        contours.end = Axes.tickFirst(dummyAx);

        if(contours.start === trace.zmin) contours.start += contours.size;
        if(contours.end === trace.zmax) contours.end -= contours.size;

        // if you set a small ncontours, *and* the ends are exactly on zmin/zmax
        // there's an edge case where start > end now. Make sure there's at least
        // one meaningful contour, put it midway between the crossed values
        if(contours.start > contours.end) {
            contours.start = contours.end = (contours.start + contours.end) / 2;
        }

        // copy auto-contour info back to the source data.
        trace._input.contours = extendFlat({}, contours);
    }
    else {
        // sanity checks on manually-supplied start/end/size
        var start = contours.start,
            end = contours.end,
            inputContours = trace._input.contours;

        if(start > end) {
            contours.start = inputContours.start = end;
            end = contours.end = inputContours.end = start;
            start = contours.start;
        }

        if(!(contours.size > 0)) {
            var sizeOut;
            if(start === end) sizeOut = 1;
            else sizeOut = autoContours(start, end, trace.ncontours).dtick;

            inputContours.size = contours.size = sizeOut;
        }
    }

    return cd;
};

/*
 * autoContours: make a dummy axis object with dtick we can use
 * as contours.size, and if needed we can use Axes.tickFirst
 * with this axis object to calculate the start and end too
 *
 * start: the value to start the contours at
 * end: the value to end at (must be > start)
 * ncontours: max number of contours to make, like roughDTick
 *
 * returns: an axis object
 */
function autoContours(start, end, ncontours) {
    var dummyAx = {
        type: 'linear',
        range: [start, end]
    };

    Axes.autoTicks(
        dummyAx,
        (end - start) / (ncontours || 15)
    );

    return dummyAx;
}
