/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');


// arrayOk attributes, merge them into calcdata array
module.exports = function arraysToCalcdata(cd) {
    var trace = cd[0].trace,
        marker = trace.marker;

    Lib.mergeArray(trace.text, cd, 'tx');
    Lib.mergeArray(trace.textposition, cd, 'tp');
    if(trace.textfont) {
        Lib.mergeArray(trace.textfont.size, cd, 'ts');
        Lib.mergeArray(trace.textfont.color, cd, 'tc');
        Lib.mergeArray(trace.textfont.family, cd, 'tf');
    }

    if(marker && marker.line) {
        var markerLine = marker.line;
        Lib.mergeArray(marker.opacity, cd, 'mo');
        Lib.mergeArray(marker.symbol, cd, 'mx');
        Lib.mergeArray(marker.color, cd, 'mc');
        Lib.mergeArray(markerLine.color, cd, 'mlc');
        Lib.mergeArray(markerLine.width, cd, 'mlw');
    }
};
