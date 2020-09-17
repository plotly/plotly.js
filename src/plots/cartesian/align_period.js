/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var Lib = require('../../lib');
var ms2DateTime = Lib.ms2DateTime;
var dateTime2ms = Lib.dateTime2ms;
var incrementMonth = Lib.incrementMonth;
var ONEDAY = require('../../constants/numerical').ONEDAY;

module.exports = function alignPeriod(trace, ax, axLetter, vals) {
    if(ax.type !== 'date') return vals;

    var alignment = trace[axLetter + 'periodalignment'];
    if(!alignment) return vals;

    var period = trace[axLetter + 'period'];
    var mPeriod, dPeriod;
    if(isNumeric(period)) {
        dPeriod = +period;
        dPeriod /= ONEDAY; // convert milliseconds to days
        dPeriod = Math.round(dPeriod);
        if(dPeriod <= 0) return vals;
    } else if(typeof period === 'string' && period.charAt(0) === 'M') {
        var n = +(period.substring(1));
        if(n > 0 && Math.round(n) === n) {
            mPeriod = n;
        } else return vals;
    }

    var calendar = ax.calendar;

    var isStart = 'start' === alignment;
    // var isMiddle = 'middle' === alignment;
    var isEnd = 'end' === alignment;

    var period0 = trace[axLetter + 'period0'];
    var base = dateTime2ms(period0, calendar) || 0;

    var newVals = [];
    var len = vals.length;
    for(var i = 0; i < len; i++) {
        var v = vals[i] - base;

        var dateStr = ms2DateTime(v, 0, calendar);
        var d = new Date(dateStr);
        var year = d.getUTCFullYear();
        var month = d.getUTCMonth();
        var day = d.getUTCDate();

        var startTime, endTime;
        if(dPeriod) {
            startTime = Date.UTC(year, month, day);
            endTime = startTime + dPeriod * ONEDAY;
        }

        if(mPeriod) {
            var nYears = Math.floor(mPeriod / 12);
            var nMonths = mPeriod % 12;

            if(nMonths) {
                startTime = Date.UTC(year, nYears ? month : roundMonth(month, nMonths));
                endTime = incrementMonth(startTime, mPeriod, calendar);
            } else {
                startTime = Date.UTC(year, 0);
                endTime = Date.UTC(year + nYears, 0);
            }
        }

        var newD = new Date(
            isStart ? startTime :
            isEnd ? endTime :
            (startTime + endTime) / 2
        );

        newVals[i] = newD.getTime() + base;
    }
    return newVals;
};

var monthSteps = [2, 3, 4, 6];

function roundMonth(month, step) {
    return (monthSteps.indexOf(step) === -1) ? month : Math.floor(month / step) * step;
}
