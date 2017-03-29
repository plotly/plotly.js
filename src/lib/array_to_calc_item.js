/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

// similar to Lib.mergeArray, but using inside a loop
module.exports = function arrayToCalcItem(traceAttr, calcItem, calcAttr, i) {
    if(Array.isArray(traceAttr)) calcItem[calcAttr] = traceAttr[i];
};
