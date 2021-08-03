'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var alignPeriod = require('../../plots/cartesian/align_period');

var calcCommon = require('../ohlc/calc').calcCommon;

module.exports = function(gd, trace) {
    var fullLayout = gd._fullLayout;
    var xa = Axes.getFromId(gd, trace.xaxis);
    var ya = Axes.getFromId(gd, trace.yaxis);

    var origX = xa.makeCalcdata(trace, 'x');
    var x = alignPeriod(trace, xa, 'x', origX).vals;

    var cd = calcCommon(gd, trace, origX, x, ya, ptFunc);

    if(cd.length) {
        Lib.extendFlat(cd[0].t, {
            num: fullLayout._numBoxes,
            dPos: Lib.distinctVals(x).minDiff / 2,
            posLetter: 'x',
            valLetter: 'y',
        });

        fullLayout._numBoxes++;
        return cd;
    } else {
        return [{t: {empty: true}}];
    }
};

function ptFunc(o, h, l, c) {
    return {
        min: l,
        q1: Math.min(o, c),
        med: c,
        q3: Math.max(o, c),
        max: h,
    };
}
