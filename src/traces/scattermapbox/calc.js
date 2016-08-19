/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var hasColorscale = require('../../components/colorscale/has_colorscale');
var makeColorScaleFn = require('../../components/colorscale/make_scale_function');
var subtypes = require('../scatter/subtypes');
var calcMarkerColorscale = require('../scatter/colorscale_calc');
var makeBubbleSizeFn = require('../scatter/make_bubble_size_func');


module.exports = function calc(gd, trace) {
    var len = trace.lon.length,
        marker = trace.marker;

    var hasMarkers = subtypes.hasMarkers(trace),
        hasColorArray = (hasMarkers && Array.isArray(marker.color)),
        hasSizeArray = (hasMarkers && Array.isArray(marker.size)),
        hasSymbolArray = (hasMarkers && Array.isArray(marker.symbol)),
        hasTextArray = Array.isArray(trace.text);

    calcMarkerColorscale(trace);

    var colorFn = hasColorscale(trace, 'marker') ?
            makeColorScaleFn(marker.colorscale, marker.cmin, marker.cmax) :
            Lib.identity;

    var sizeFn = subtypes.isBubble(trace) ?
            makeBubbleSizeFn(trace) :
            Lib.identity;

    var calcTrace = [],
        cnt = 0;

    // Different than cartesian calc step
    // as skip over non-numeric lon, lat pairs.
    // This makes the hover and convert calculations simpler.

    for(var i = 0; i < len; i++) {
        var lon = trace.lon[i],
            lat = trace.lat[i];

        if(!isNumeric(lon) || !isNumeric(lat)) {
            if(cnt > 0) calcTrace[cnt - 1].gapAfter = true;
            continue;
        }

        var calcPt = {};
        cnt++;

        // coerce numeric strings into numbers
        calcPt.lonlat = [+lon, +lat];

        if(hasMarkers) {

            if(hasColorArray) {
                var mc = marker.color[i];

                calcPt.mc = mc;
                calcPt.mcc = colorFn(mc);
            }

            if(hasSizeArray) {
                var ms = marker.size[i];

                calcPt.ms = ms;
                calcPt.mrc = sizeFn(ms);
            }

            if(hasSymbolArray) {
                var mx = marker.symbol[i];
                calcPt.mx = (typeof mx === 'string') ? mx : 'circle';
            }
        }

        if(hasTextArray) {
            var tx = trace.text[i];
            calcPt.tx = (typeof tx === 'string') ? tx : '';
        }

        calcTrace.push(calcPt);
    }

    return calcTrace;
};
