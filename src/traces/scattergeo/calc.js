/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');
var BADNUM = require('../../constants/numerical').BADNUM;

var calcMarkerColorscale = require('../scatter/colorscale_calc');
var arraysToCalcdata = require('../scatter/arrays_to_calcdata');

module.exports = function calc(gd, trace) {
    var hasLocationData = Array.isArray(trace.locations);
    var len = hasLocationData ? trace.locations.length : trace.lon.length;
    var calcTrace = new Array(len);

    for(var i = 0; i < len; i++) {
        var calcPt = calcTrace[i] = {};

        if(hasLocationData) {
            var loc = trace.locations[i];
            calcPt.loc = typeof loc === 'string' ? loc : null;
        } else {
            var lon = trace.lon[i];
            var lat = trace.lat[i];

            if(isNumeric(lon) && isNumeric(lat)) calcPt.lonlat = [+lon, +lat];
            else calcPt.lonlat = [BADNUM, BADNUM];
        }
    }

    arraysToCalcdata(calcTrace, trace);
    calcMarkerColorscale(trace);

    return calcTrace;
};
