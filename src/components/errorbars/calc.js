/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');

var Plots = require('../../plots/plots');
var Axes = require('../../plots/cartesian/axes');

var compureError = require('./compute_error');


module.exports = function calc(gd) {
    var calcdata = gd.calcdata;

    for(var i = 0; i < calcdata.length; i++) {
        var calcTrace = calcdata[i],
            trace = calcTrace[0].trace;

        if(!Plots.traceIs(trace, 'errorBarsOK')) continue;

        var xObj = trace.error_x || {},
            yObj = trace.error_y || {},
            xa = Axes.getFromId(gd, trace.xaxis),
            ya = Axes.getFromId(gd, trace.yaxis),
            xVis = xObj.visible && ['linear', 'log'].indexOf(xa.type)!==-1,
            yVis = yObj.visible && ['linear', 'log'].indexOf(ya.type)!==-1;

        if(!xVis && !yVis) continue;

        var xVals = [],
            yVals = [];

        for(var j = 0; j < calcTrace.length; j++) {
            var calcPt = calcTrace[j],
                calcX = calcPt.x,
                calcY = calcPt.y;

            if(!isNumeric(ya.c2l(calcY)) || !isNumeric(xa.c2l(calcX))) continue;

            var errorY = compureError(calcY, j, yObj);
            if(isNumeric(errorY[0]) && isNumeric(errorY[1])) {
                calcPt.ys = calcY - errorY[0];
                calcPt.yh = calcY + errorY[1];
                yVals.push(calcPt.ys, calcPt.yh);
            }

            var errorX = compureError(calcX, j, xObj);
            if(isNumeric(errorX[0]) && isNumeric(errorX[1])) {
                calcPt.xs = calcX - errorX[0];
                calcPt.xh = calcX + errorX[1];
                xVals.push(calcPt.xs, calcPt.xh);
            }
        }

        Axes.expand(ya, yVals, {padded: true});
        Axes.expand(xa, xVals, {padded: true});
    }
};
