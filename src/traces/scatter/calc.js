/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var BADNUM = require('../../constants/numerical').BADNUM;

var subTypes = require('./subtypes');
var calcColorscale = require('./colorscale_calc');
var arraysToCalcdata = require('./arrays_to_calcdata');
var calcSelection = require('./calc_selection');
var makeBubbleSizeFn = require('./make_bubble_size_func');

function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x');
    var ya = Axes.getFromId(gd, trace.yaxis || 'y');
    var x = xa.makeCalcdata(trace, 'x');
    var y = ya.makeCalcdata(trace, 'y');
    var serieslen = Math.min(x.length, y.length);

    // cancel minimum tick spacings (only applies to bars and boxes)
    xa._minDtick = 0;
    ya._minDtick = 0;

    if(x.length > serieslen) x.splice(serieslen, x.length - serieslen);
    if(y.length > serieslen) y.splice(serieslen, y.length - serieslen);

    // check whether bounds should be tight, padded, extended to zero...
    // most cases both should be padded on both ends, so start with that.
    var xOptions = {padded: true};
    var yOptions = {padded: true};

    var ppad = calcMarkerSize(trace, serieslen);
    if(ppad) xOptions.ppad = yOptions.ppad = ppad;

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
    for(var i = 0; i < serieslen; i++) {
        cd[i] = (isNumeric(x[i]) && isNumeric(y[i])) ?
            {x: x[i], y: y[i]} : {x: BADNUM, y: BADNUM};

        if(trace.ids) {
            cd[i].id = String(trace.ids[i]);
        }
    }

    arraysToCalcdata(cd, trace);
    calcColorscale(trace);
    calcSelection(cd, trace);

    gd.firstscatter = false;
    return cd;
}

function calcMarkerSize(trace, serieslen) {
    if(!subTypes.hasMarkers(trace)) return;

    // Treat size like x or y arrays --- Run d2c
    // this needs to go before ppad computation
    var marker = trace.marker;

    // use a modified version of the bubble size function
    // with smaller sizeref (resulting in a pad factor)
    // and making non-numeric and size-0 points count as pad=3.
    var sizeFn = makeBubbleSizeFn({
        marker: Lib.extendFlat({}, marker, {
            sizemode: marker.sizemode || 'diameter',
            sizeref: 0.8 * (marker.sizeref || 1),
        })
    });
    var markerTrans = function(v) {
        return Math.max(sizeFn(v), 3);
    };

    if(Array.isArray(marker.size)) {
        // no need to auto-type as category and dates do not make much sense.
        var ax = {type: 'linear'};
        Axes.setConvert(ax);

        var s = ax.makeCalcdata(trace.marker, 'size');
        if(s.length > serieslen) s.splice(serieslen, s.length - serieslen);

        return s.map(markerTrans);
    }

    return markerTrans(marker.size);
}

module.exports = {
    calc: calc,
    calcMarkerSize: calcMarkerSize
};
