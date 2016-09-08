/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var mergeArray = require('../../lib').mergeArray;


// arrayOk attributes, merge them into calcdata array
module.exports = function arraysToCalcdata(cd) {
    var trace = cd[0].trace,
        marker = trace.marker;

    mergeArray(trace.text, cd, 'tx');

    if(marker && marker.line) {
        var markerLine = marker.line;

        mergeArray(marker.opacity, cd, 'mo');
        mergeArray(marker.color, cd, 'mc');
        mergeArray(markerLine.color, cd, 'mlc');
        mergeArray(markerLine.width, cd, 'mlw');
    }
};
