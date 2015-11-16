'use strict';

// similar to Lib.mergeArray, but using inside a loop
module.exports = function arrayToCalcItem(traceAttr, calcItem, calcAttr, i) {
    if(Array.isArray(traceAttr)) calcItem[calcAttr] = traceAttr[i];
};
