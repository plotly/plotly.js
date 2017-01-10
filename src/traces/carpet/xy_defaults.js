/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

// var Lib = require('../../lib');

// var isNumeric = require('fast-isnumeric');

var hasColumns = require('./has_columns');
var convertColumnData = require('../heatmap/convert_column_xyz');

module.exports = function handleXYDefaults(traceIn, traceOut, coerce) {
    var hasxcols = true;
    var hasycols = true;
    var cols = [];
    var x = coerce('x');

    var hasxcols = !!(x && !hasColumns(x));
    if (hasxcols) cols.push('x');

    traceOut._cheater = !x;

    var y = coerce('y');

    var hasycols = !!(y && !hasColumns(y));
    if (hasycols) cols.push('y');

    if (cols.length) {
        convertColumnData(traceOut, traceOut.aaxis, traceOut.baxis, 'a', 'b', cols);
    } else {
        return 0;
    }

    return y.length;
};

/*
function isValidZ(z) {
    var allRowsAreArrays = true,
        oneRowIsFilled = false,
        hasOneNumber = false,
        zi;


    // Without this step:
    //
    // hasOneNumber = false breaks contour but not heatmap
    // allRowsAreArrays = false breaks contour but not heatmap
    // oneRowIsFilled = false breaks both

    for(var i = 0; i < z.length; i++) {
        zi = z[i];
        if(!Array.isArray(zi)) {
            allRowsAreArrays = false;
            break;
        }
        if(zi.length > 0) oneRowIsFilled = true;
        for(var j = 0; j < zi.length; j++) {
            if(isNumeric(zi[j])) {
                hasOneNumber = true;
                break;
            }
        }
    }

    return (allRowsAreArrays && oneRowIsFilled && hasOneNumber);
}
*/
