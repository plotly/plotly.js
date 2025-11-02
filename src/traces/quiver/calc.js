'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var isNumeric = require('fast-isnumeric');
var BADNUM = require('../../constants/numerical').BADNUM;
var scatterCalc = require('../scatter/calc');

/**
 * Main calculation function for quiver trace
 * Creates calcdata with arrow path data for each vector
 */
module.exports = function calc(gd, trace) {
    // Map x/y through axes so category/date values become numeric calcdata
    var xa = trace._xA = Axes.getFromId(gd, trace.xaxis || 'x', 'x');
    var ya = trace._yA = Axes.getFromId(gd, trace.yaxis || 'y', 'y');

    var xVals = xa.makeCalcdata(trace, 'x');
    var yVals = ya.makeCalcdata(trace, 'y');

    // u/v are read in plot using the original trace arrays via cdi.i

    var len = Math.min(xVals.length, yVals.length);
    trace._length = len;
    var cd = new Array(len);

    for(var i = 0; i < len; i++) {
        var cdi = cd[i] = { i: i };
        var xValid = isNumeric(xVals[i]);
        var yValid = isNumeric(yVals[i]);

        if(xValid && yValid) {
            cdi.x = xVals[i];
            cdi.y = yVals[i];
        } else {
            cdi.x = BADNUM;
            cdi.y = BADNUM;
        }
    }

    // Ensure axes are expanded and categories registered like scatter traces do
    scatterCalc.calcAxisExpansion(gd, trace, xa, ya, xVals, yVals);

    return cd;
};


