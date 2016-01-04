/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');


module.exports = function convertColumnXYZ(trace, xa, ya) {
    var xCol = trace.x.slice(),
        yCol = trace.y.slice(),
        zCol = trace.z,
        textCol = trace.text,
        colLen = Math.min(xCol.length, yCol.length, zCol.length),
        hasColumnText = (textCol!==undefined && !Array.isArray(textCol[0]));

    var i;

    if(colLen < xCol.length) xCol = xCol.slice(0, colLen);
    if(colLen < yCol.length) yCol = yCol.slice(0, colLen);

    for(i = 0; i < colLen; i++) {
        xCol[i] = xa.d2c(xCol[i]);
        yCol[i] = ya.d2c(yCol[i]);
    }

    var xColdv = Lib.distinctVals(xCol),
        x = xColdv.vals,
        yColdv = Lib.distinctVals(yCol),
        y = yColdv.vals,
        z = Lib.init2dArray(y.length, x.length);

    var ix, iy, text;

    if(hasColumnText) text = Lib.init2dArray(y.length, x.length);

    for(i = 0; i < colLen; i++) {
        ix = Lib.findBin(xCol[i] + xColdv.minDiff / 2, x);
        iy = Lib.findBin(yCol[i] + yColdv.minDiff / 2, y);

        z[iy][ix] = zCol[i];
        if(hasColumnText) text[iy][ix] = textCol[i];
    }

    trace.x = x;
    trace.y = y;
    trace.z = z;
    if(hasColumnText) trace.text = text;
};
