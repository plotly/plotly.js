/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var mergeArray = require('../../lib').mergeArray;

// arrayOk attributes, merge them into calcdata array
module.exports = function arraysToCalcdata(cd, trace) {
    var i;
    var marker;
    var markerLine;

    for(i = 0; i < cd.length; i++) cd[i].i = i;

    mergeArray(trace.text, cd, 'tx');
    mergeArray(trace.hovertext, cd, 'htx');

    if('marker' in trace) {
        marker = trace.marker;
        mergeArray(marker.opacity, cd, 'mo');
        mergeArray(marker.color, cd, 'mc');

        markerLine = marker.line;
        mergeArray(markerLine.color, cd, 'mlc');
        mergeArray(markerLine.width, cd, 'mlw');
    } else {
        for(i = 0; i < cd.length; i++) {
            var di = cd[i];
            if(di.isSum) marker = trace.totals;
            else if(di.rawS < 0) marker = trace.decreasing;
            else marker = trace.increasing;

            di.mo = marker.opacity;
            di.mc = marker.color;

            di.mlc = (marker.line || {}).color || '#777';
            di.mlw = (marker.line || {}).width || 0;
        }
    }
};
