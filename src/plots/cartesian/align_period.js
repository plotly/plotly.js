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
var constants = require('../../constants/numerical');
var ONEDAY = constants.ONEDAY;
var ONEAVGMONTH = constants.ONEAVGMONTH;
var ONEAVGYEAR = constants.ONEAVGYEAR;

module.exports = function alignPeriod(trace, ax, axLetter, vals) {
    if(ax.type !== 'date') return vals;

    var alignment = trace[axLetter + 'periodalignment'];
    if(!alignment) return vals;

    var period = trace[axLetter + 'period'];
    var mPeriod;
    if(isNumeric(period)) {
        period = +period;
        if(period <= 0) return vals;
    } else if(typeof period === 'string' && period.charAt(0) === 'M') {
        var n = +(period.substring(1));
        if(n > 0 && Math.round(n) === n) {
            mPeriod = n;
            period = n * ONEAVGMONTH;
        } else return vals;
    }

    if(period > 0) {
        var calendar = ax.calendar;

        var isStart = 'start' === alignment;
        // var isMiddle = 'middle' === alignment;
        var isEnd = 'end' === alignment;

        var offset = (new Date()).getTimezoneOffset() * 60000;
        var period0 = trace[axLetter + 'period0'];
        var base = (dateTime2ms(period0, calendar) || 0) - offset;

        var newVals = [];
        var len = vals.length;
        for(var i = 0; i < len; i++) {
            var v = vals[i] - base;

            var dateStr = ms2DateTime(v, 0, calendar);
            var d = new Date(dateStr);
            var year = d.getFullYear();
            var month = d.getMonth();
            var day = d.getDate();

            var newD;
            var startTime;
            var endTime;

            var nMonths = Math.floor(period / ONEAVGMONTH) % 12;
            var nYears = Math.floor((period - nMonths * ONEAVGMONTH) / ONEAVGYEAR);
            var nDays = Math.floor((period - nMonths * ONEAVGMONTH - nYears * ONEAVGYEAR) / ONEDAY);
            if(nYears && nMonths) nDays = 0;

            var y1 = year + nYears;
            var m1 = month + nMonths;
            var d1 = day + nDays;
            if(nDays || nMonths || nYears) {
                if(nDays) {
                    startTime = (new Date(year, month, day)).getTime();
                    var monthDays = new Date(y1, m1 + 1, 0).getDate();
                    if(d1 > monthDays) {
                        d1 -= monthDays;
                        m1 += 1;
                        if(m1 > 11) {
                            m1 -= 12;
                            y1 += 1;
                        }
                    }
                    endTime = (new Date(y1, m1, d1)).getTime();
                } else if(nMonths) {
                    startTime = (new Date(year, nYears ? month : roundMonth(month, nMonths))).getTime();
                    endTime = incrementMonth(startTime, mPeriod ? mPeriod : nMonths, calendar);
                } else {
                    startTime = (new Date(year, 0)).getTime();
                    endTime = (new Date(y1, 0)).getTime();
                }

                newD = new Date(
                    isStart ? startTime :
                    isEnd ? endTime :
                    (startTime + endTime) / 2
                );
            }

            newVals[i] = newD ? newD.getTime() + base : vals[i];
        }
        return newVals;
    }
    return vals;
};

var monthSteps = [2, 3, 4, 6];

function roundMonth(month, step) {
    return (monthSteps.indexOf(step) === -1) ? month : Math.floor(month / step) * step;
}
