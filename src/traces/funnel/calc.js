'use strict';

var Axes = require('../../plots/cartesian/axes');
var alignPeriod = require('../../plots/cartesian/align_period');
var arraysToCalcdata = require('./arrays_to_calcdata');
var calcSelection = require('../scatter/calc_selection');
var BADNUM = require('../../constants/numerical').BADNUM;

module.exports = function calc(gd, trace) {
    var xa = Axes.getFromId(gd, trace.xaxis || 'x');
    var ya = Axes.getFromId(gd, trace.yaxis || 'y');
    var size, pos, origPos, pObj, hasPeriod, pLetter, i, cdi;

    if(trace.orientation === 'h') {
        size = xa.makeCalcdata(trace, 'x');
        origPos = ya.makeCalcdata(trace, 'y');
        pObj = alignPeriod(trace, ya, 'y', origPos);
        hasPeriod = !!trace.yperiodalignment;
        pLetter = 'y';
    } else {
        size = ya.makeCalcdata(trace, 'y');
        origPos = xa.makeCalcdata(trace, 'x');
        pObj = alignPeriod(trace, xa, 'x', origPos);
        hasPeriod = !!trace.xperiodalignment;
        pLetter = 'x';
    }
    pos = pObj.vals;

    // create the "calculated data" to plot
    var serieslen = Math.min(pos.length, size.length);
    var cd = new Array(serieslen);

    // Unlike other bar-like traces funnels do not support base attribute.
    // bases for funnels are computed internally in a way that
    // the mid-point of each bar are located on the axis line.
    trace._base = [];

    // set position and size
    for(i = 0; i < serieslen; i++) {
        // treat negative values as bad numbers
        if(size[i] < 0) size[i] = BADNUM;

        var connectToNext = false;
        if(size[i] !== BADNUM) {
            if(i + 1 < serieslen && size[i + 1] !== BADNUM) {
                connectToNext = true;
            }
        }

        cdi = cd[i] = {
            p: pos[i],
            s: size[i],
            cNext: connectToNext
        };

        trace._base[i] = -0.5 * cdi.s;

        if(hasPeriod) {
            cd[i].orig_p = origPos[i]; // used by hover
            cd[i][pLetter + 'End'] = pObj.ends[i];
            cd[i][pLetter + 'Start'] = pObj.starts[i];
        }

        if(trace.ids) {
            cdi.id = String(trace.ids[i]);
        }

        // calculate total values
        if(i === 0) cd[0].vTotal = 0;
        cd[0].vTotal += fixNum(cdi.s);

        // ratio from initial value
        cdi.begR = fixNum(cdi.s) / fixNum(cd[0].s);
    }

    var prevGoodNum;
    for(i = 0; i < serieslen; i++) {
        cdi = cd[i];
        if(cdi.s === BADNUM) continue;

        // ratio of total value
        cdi.sumR = cdi.s / cd[0].vTotal;

        // ratio of previous (good) value
        cdi.difR = (prevGoodNum !== undefined) ? cdi.s / prevGoodNum : 1;

        prevGoodNum = cdi.s;
    }

    arraysToCalcdata(cd, trace);
    calcSelection(cd, trace);

    return cd;
};

function fixNum(a) {
    return (a === BADNUM) ? 0 : a;
}
