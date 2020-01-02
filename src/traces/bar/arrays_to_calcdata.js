/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

// arrayOk attributes, merge them into calcdata array
module.exports = function arraysToCalcdata(cd, trace) {
    for(var i = 0; i < cd.length; i++) cd[i].i = i;

    Lib.mergeArray(trace.text, cd, 'tx');
    Lib.mergeArray(trace.hovertext, cd, 'htx');

    var marker = trace.marker;
    if(marker) {
        Lib.mergeArray(marker.opacity, cd, 'mo', true);
        Lib.mergeArray(marker.color, cd, 'mc');

        var markerLine = marker.line;
        if(markerLine) {
            Lib.mergeArray(markerLine.color, cd, 'mlc');
            Lib.mergeArrayCastPositive(markerLine.width, cd, 'mlw');
        }
    }
};
