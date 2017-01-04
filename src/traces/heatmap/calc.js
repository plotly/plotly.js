/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Registry = require('../../registry');
var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');

var histogram2dCalc = require('../histogram2d/calc');
var colorscaleCalc = require('../../components/colorscale/calc');
var hasColumns = require('./has_columns');
var convertColumnXYZ = require('./convert_column_xyz');
var maxRowLength = require('./max_row_length');
var clean2dArray = require('./clean_2d_array');
var interp2d = require('./interp2d');
var findEmpties = require('./find_empties');
var makeBoundArray = require('./make_bound_array');


module.exports = function calc(gd, trace) {
    // prepare the raw data
    // run makeCalcdata on x and y even for heatmaps, in case of category mappings
    var xa = Axes.getFromId(gd, trace.xaxis || 'x'),
        ya = Axes.getFromId(gd, trace.yaxis || 'y'),
        isContour = Registry.traceIs(trace, 'contour'),
        isHist = Registry.traceIs(trace, 'histogram'),
        isGL2D = Registry.traceIs(trace, 'gl2d'),
        zsmooth = isContour ? 'best' : trace.zsmooth,
        x,
        x0,
        dx,
        y,
        y0,
        dy,
        z,
        i;

    // cancel minimum tick spacings (only applies to bars and boxes)
    xa._minDtick = 0;
    ya._minDtick = 0;

    if(isHist) {
        var binned = histogram2dCalc(gd, trace);
        x = binned.x;
        x0 = binned.x0;
        dx = binned.dx;
        y = binned.y;
        y0 = binned.y0;
        dy = binned.dy;
        z = binned.z;
    }
    else {
        if(hasColumns(trace)) convertColumnXYZ(trace, xa, ya);

        x = trace.x ? xa.makeCalcdata(trace, 'x') : [];
        y = trace.y ? ya.makeCalcdata(trace, 'y') : [];
        x0 = trace.x0 || 0;
        dx = trace.dx || 1;
        y0 = trace.y0 || 0;
        dy = trace.dy || 1;

        z = clean2dArray(trace.z, trace.transpose);

        if(isContour || trace.connectgaps) {
            trace._emptypoints = findEmpties(z);
            trace._interpz = interp2d(z, trace._emptypoints, trace._interpz);
        }
    }

    function noZsmooth(msg) {
        zsmooth = trace._input.zsmooth = trace.zsmooth = false;
        Lib.notifier('cannot fast-zsmooth: ' + msg);
    }

    // check whether we really can smooth (ie all boxes are about the same size)
    if(zsmooth === 'fast') {
        if(xa.type === 'log' || ya.type === 'log') {
            noZsmooth('log axis found');
        }
        else if(!isHist) {
            if(x.length) {
                var avgdx = (x[x.length - 1] - x[0]) / (x.length - 1),
                    maxErrX = Math.abs(avgdx / 100);
                for(i = 0; i < x.length - 1; i++) {
                    if(Math.abs(x[i + 1] - x[i] - avgdx) > maxErrX) {
                        noZsmooth('x scale is not linear');
                        break;
                    }
                }
            }
            if(y.length && zsmooth === 'fast') {
                var avgdy = (y[y.length - 1] - y[0]) / (y.length - 1),
                    maxErrY = Math.abs(avgdy / 100);
                for(i = 0; i < y.length - 1; i++) {
                    if(Math.abs(y[i + 1] - y[i] - avgdy) > maxErrY) {
                        noZsmooth('y scale is not linear');
                        break;
                    }
                }
            }
        }
    }

    // create arrays of brick boundaries, to be used by autorange and heatmap.plot
    var xlen = maxRowLength(z),
        xIn = trace.xtype === 'scaled' ? '' : x,
        xArray = makeBoundArray(trace, xIn, x0, dx, xlen, xa),
        yIn = trace.ytype === 'scaled' ? '' : y,
        yArray = makeBoundArray(trace, yIn, y0, dy, z.length, ya);

    // handled in gl2d convert step
    if(!isGL2D) {
        Axes.expand(xa, xArray);
        Axes.expand(ya, yArray);
    }

    var cd0 = {x: xArray, y: yArray, z: z};

    // auto-z and autocolorscale if applicable
    colorscaleCalc(trace, z, '', 'z');

    if(isContour && trace.contours && trace.contours.coloring === 'heatmap') {
        var dummyTrace = {
            type: trace.type === 'contour' ? 'heatmap' : 'histogram2d',
            xcalendar: trace.xcalendar,
            ycalendar: trace.ycalendar
        };
        cd0.xfill = makeBoundArray(dummyTrace, xIn, x0, dx, xlen, xa);
        cd0.yfill = makeBoundArray(dummyTrace, yIn, y0, dy, z.length, ya);
    }

    return [cd0];
};
