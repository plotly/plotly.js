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
module.exports = function arraysToCalcdata(cd, trace, vals) {
    for(var i = 0; i < cd.length; i++) cd[i].i = i;

    mergeArray(trace.text, cd, 'tx');
    mergeArray(trace.hovertext, cd, 'htx');

    var marker = trace.marker;
    if(marker) {
        mergeArray(marker.opacity, cd, 'mo');
        mergeArray(
            (trace._autoMarkerColor) ? vals : marker.color,
            cd, 'mc'
        );

        var markerLine = marker.line;
        if(markerLine) {
            mergeArray(
                (trace._autoMarkerLineColor) ? vals : markerLine.color,
                cd, 'mlc'
            );
            mergeArray(markerLine.width, cd, 'mlw');
        }
    }
};
