/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var calcMarkerColorscale = require('../scatter/colorscale_calc');


module.exports = function calc(gd, trace) {
    var hasLocationData = Array.isArray(trace.locations),
        len = hasLocationData ? trace.locations.length : trace.lon.length;

    var calcTrace = [],
        cnt = 0;

    for(var i = 0; i < len; i++) {
        var calcPt = {},
            skip;

        if(hasLocationData) {
            var loc = trace.locations[i];

            calcPt.loc = loc;
            skip = (typeof loc !== 'string');
        }
        else {
            var lon = trace.lon[i],
                lat = trace.lat[i];

            calcPt.lonlat = [+lon, +lat];
            skip = (!isNumeric(lon) || !isNumeric(lat));
        }

        if(skip) {
            if(cnt > 0) calcTrace[cnt - 1].gapAfter = true;
            continue;
        }

        cnt++;

        calcTrace.push(calcPt);
    }

    calcMarkerColorscale(trace);

    return calcTrace;
};
