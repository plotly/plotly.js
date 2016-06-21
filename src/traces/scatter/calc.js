/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Axes = require('../../plots/cartesian/axes');
var Lib = require('../../lib');

var subTypes = require('./subtypes');
var calcColorscale = require('./colorscale_calc');


module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x'),
        ya = Axes.getFromId(gd, trace.yaxis || 'y');

    var x = xa.makeCalcdata(trace, 'x'),
        y = ya.makeCalcdata(trace, 'y');

    var serieslen = Math.min(x.length, y.length),
        marker,
        s,
        i;

    // cancel minimum tick spacings (only applies to bars and boxes)
    xa._minDtick = 0;
    ya._minDtick = 0;

    if(x.length > serieslen) x.splice(serieslen, x.length - serieslen);
    if(y.length > serieslen) y.splice(serieslen, y.length - serieslen);

    // check whether bounds should be tight, padded, extended to zero...
    // most cases both should be padded on both ends, so start with that.
    var xOptions = {padded: true},
        yOptions = {padded: true};

    if(subTypes.hasMarkers(trace)) {

        // Treat size like x or y arrays --- Run d2c
        // this needs to go before ppad computation
        marker = trace.marker;
        s = marker.size;

        if(Array.isArray(s)) {
            // I tried auto-type but category and dates dont make much sense.
            var ax = {type: 'linear'};
            Axes.setConvert(ax);
            s = ax.makeCalcdata(trace.marker, 'size');
            if(s.length > serieslen) s.splice(serieslen, s.length - serieslen);
        }

        var sizeref = 1.6 * (trace.marker.sizeref || 1),
            markerTrans;
        if(trace.marker.sizemode === 'area') {
            markerTrans = function(v) {
                return Math.max(Math.sqrt((v || 0) / sizeref), 3);
            };
        }
        else {
            markerTrans = function(v) {
                return Math.max((v || 0) / sizeref, 3);
            };
        }
        xOptions.ppad = yOptions.ppad = Array.isArray(s) ?
            s.map(markerTrans) : markerTrans(s);
    }

    calcColorscale(trace);

    // TODO: text size

    // include zero (tight) and extremes (padded) if fill to zero
    // (unless the shape is closed, then it's just filling the shape regardless)
    if(((trace.fill === 'tozerox') ||
            ((trace.fill === 'tonextx') && gd.firstscatter)) &&
            ((x[0] !== x[serieslen - 1]) || (y[0] !== y[serieslen - 1]))) {
        xOptions.tozero = true;
    }

    // if no error bars, markers or text, or fill to y=0 remove x padding
    else if(!trace.error_y.visible && (
            ['tonexty', 'tozeroy'].indexOf(trace.fill) !== -1 ||
            (!subTypes.hasMarkers(trace) && !subTypes.hasText(trace))
        )) {
        xOptions.padded = false;
        xOptions.ppad = 0;
    }

    // now check for y - rather different logic, though still mostly padded both ends
    // include zero (tight) and extremes (padded) if fill to zero
    // (unless the shape is closed, then it's just filling the shape regardless)
    if(((trace.fill === 'tozeroy') || ((trace.fill === 'tonexty') && gd.firstscatter)) &&
            ((x[0] !== x[serieslen - 1]) || (y[0] !== y[serieslen - 1]))) {
        yOptions.tozero = true;
    }

    // tight y: any x fill
    else if(['tonextx', 'tozerox'].indexOf(trace.fill) !== -1) {
        yOptions.padded = false;
    }

    Axes.expand(xa, x, xOptions);
    Axes.expand(ya, y, yOptions);

    // create the "calculated data" to plot
    var cd = new Array(serieslen);
    for(i = 0; i < serieslen; i++) {
        cd[i] = (isNumeric(x[i]) && isNumeric(y[i])) ?
            {x: x[i], y: y[i]} : {x: false, y: false};
    }

    // this has migrated up from arraysToCalcdata as we have a reference to 's' here
    if(typeof s !== undefined) Lib.mergeArray(s, cd, 'ms');

    gd.firstscatter = false;
    return cd;
};
