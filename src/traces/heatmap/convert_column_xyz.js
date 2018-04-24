/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var BADNUM = require('../../constants/numerical').BADNUM;

module.exports = function convertColumnData(trace, ax1, ax2, var1Name, var2Name, arrayVarNames) {
    var colLen = trace._length;
    var col1 = trace[var1Name].slice(0, colLen);
    var col2 = trace[var2Name].slice(0, colLen);
    var textCol = trace.text;
    var hasColumnText = (textCol !== undefined && Lib.isArray1D(textCol));
    var col1Calendar = trace[var1Name + 'calendar'];
    var col2Calendar = trace[var2Name + 'calendar'];

    var i, j, arrayVar, newArray, arrayVarName;

    for(i = 0; i < colLen; i++) {
        col1[i] = ax1.d2c(col1[i], 0, col1Calendar);
        col2[i] = ax2.d2c(col2[i], 0, col2Calendar);
    }

    var col1dv = Lib.distinctVals(col1),
        col1vals = col1dv.vals,
        col2dv = Lib.distinctVals(col2),
        col2vals = col2dv.vals,
        newArrays = [];

    for(i = 0; i < arrayVarNames.length; i++) {
        newArrays[i] = Lib.init2dArray(col2vals.length, col1vals.length);
    }

    var i1, i2, text;

    if(hasColumnText) text = Lib.init2dArray(col2vals.length, col1vals.length);

    for(i = 0; i < colLen; i++) {
        if(col1[i] !== BADNUM && col2[i] !== BADNUM) {
            i1 = Lib.findBin(col1[i] + col1dv.minDiff / 2, col1vals);
            i2 = Lib.findBin(col2[i] + col2dv.minDiff / 2, col2vals);

            for(j = 0; j < arrayVarNames.length; j++) {
                arrayVarName = arrayVarNames[j];
                arrayVar = trace[arrayVarName];
                newArray = newArrays[j];
                newArray[i2][i1] = arrayVar[i];
            }

            if(hasColumnText) text[i2][i1] = textCol[i];
        }
    }

    trace['_' + var1Name] = col1vals;
    trace['_' + var2Name] = col2vals;
    for(j = 0; j < arrayVarNames.length; j++) {
        trace['_' + arrayVarNames[j]] = newArrays[j];
    }
    if(hasColumnText) trace._text = text;
};
