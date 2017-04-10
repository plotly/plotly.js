/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var extendFlat = require('../../lib').extendFlat;
var Registry = require('../../registry');
var colorscaleCalc = require('../../components/colorscale/calc');
var hasColumns = require('../heatmap/has_columns');
var convertColumnData = require('../heatmap/convert_column_xyz');
var clean2dArray = require('../heatmap/clean_2d_array');
var maxRowLength = require('../heatmap/max_row_length');
var interp2d = require('../heatmap/interp2d');
var findEmpties = require('../heatmap/find_empties');
var makeBoundArray = require('../heatmap/make_bound_array');
var supplyDefaults = require('./defaults');
var lookupCarpet = require('../carpet/lookup_carpetid');

// most is the same as heatmap calc, then adjust it
// though a few things inside heatmap calc still look for
// contour maps, because the makeBoundArray calls are too entangled
module.exports = function calc(gd, trace) {
    var carpet = trace.carpetTrace = lookupCarpet(gd, trace);
    if(!carpet || !carpet.visible || carpet.visible === 'legendonly') return;

    if(!trace.a || !trace.b) {
        // Look up the original incoming carpet data:
        var carpetdata = gd.data[carpet.index];

        // Look up the incoming trace data, *except* perform a shallow
        // copy so that we're not actually modifying it when we use it
        // to supply defaults:
        var tracedata = gd.data[trace.index];
        // var tracedata = extendFlat({}, gd.data[trace.index]);

        // If the data is not specified
        if(!tracedata.a) tracedata.a = carpetdata.a;
        if(!tracedata.b) tracedata.b = carpetdata.b;

        supplyDefaults(tracedata, trace, trace._defaultColor, gd._fullLayout);
    }

    var cd = heatmappishCalc(gd, trace),
        contours = trace.contours;

    // Autocontour is unset for constraint plots so also autocontour if undefind:
    if(trace.autocontour === true) {
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

function heatmappishCalc(gd, trace) {
    // prepare the raw data
    // run makeCalcdata on x and y even for heatmaps, in case of category mappings
    var carpet = trace.carpetTrace;
    var aax = carpet.aaxis,
        bax = carpet.baxis,
        isContour = Registry.traceIs(trace, 'contour'),
        zsmooth = isContour ? 'best' : trace.zsmooth,
        a,
        a0,
        da,
        b,
        b0,
        db,
        z,
        i;

    // cancel minimum tick spacings (only applies to bars and boxes)
    aax._minDtick = 0;
    bax._minDtick = 0;

    if(hasColumns(trace)) convertColumnData(trace, aax, bax, 'a', 'b', ['z']);

    a = trace.a ? aax.makeCalcdata(trace, 'a') : [];
    b = trace.b ? bax.makeCalcdata(trace, 'b') : [];
    a0 = trace.a0 || 0;
    da = trace.da || 1;
    b0 = trace.b0 || 0;
    db = trace.db || 1;

    z = clean2dArray(trace.z, trace.transpose);

    trace._emptypoints = findEmpties(z);
    trace._interpz = interp2d(z, trace._emptypoints, trace._interpz);

    function noZsmooth(msg) {
        zsmooth = trace._input.zsmooth = trace.zsmooth = false;
        Lib.notifier('cannot fast-zsmooth: ' + msg);
    }

    // check whether we really can smooth (ie all boxes are about the same size)
    if(zsmooth === 'fast') {
        if(aax.type === 'log' || bax.type === 'log') {
            noZsmooth('log axis found');
        }
        else {
            if(a.length) {
                var avgda = (a[a.length - 1] - a[0]) / (a.length - 1),
                    maxErrX = Math.abs(avgda / 100);
                for(i = 0; i < a.length - 1; i++) {
                    if(Math.abs(a[i + 1] - a[i] - avgda) > maxErrX) {
                        noZsmooth('a scale is not linear');
                        break;
                    }
                }
            }
            if(b.length && zsmooth === 'fast') {
                var avgdy = (b[b.length - 1] - b[0]) / (b.length - 1),
                    maxErrY = Math.abs(avgdy / 100);
                for(i = 0; i < b.length - 1; i++) {
                    if(Math.abs(b[i + 1] - b[i] - avgdy) > maxErrY) {
                        noZsmooth('b scale is not linear');
                        break;
                    }
                }
            }
        }
    }

    // create arrays of brick boundaries, to be used by autorange and heatmap.plot
    var xlen = maxRowLength(z),
        xIn = trace.xtype === 'scaled' ? '' : a,
        xArray = makeBoundArray(trace, xIn, a0, da, xlen, aax),
        yIn = trace.ytype === 'scaled' ? '' : b,
        yArray = makeBoundArray(trace, yIn, b0, db, z.length, bax);

    var cd0 = {
        a: xArray,
        b: yArray,
        z: z,
        //mappedZ: mappedZ
    };

    if(trace.contours.type === 'levels') {
        // auto-z and autocolorscale if applicable
        colorscaleCalc(trace, z, '', 'z');
    }

    return [cd0];
}
