/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var ms2DateTime = require('../../lib').ms2DateTime;
var ONEDAY = require('../../constants/numerical').ONEDAY;

module.exports = function alignPeriod(trace, ax, axLetter, vals) {
    var alignment = trace[axLetter + 'periodalignment'];
    if(!alignment || alignment === 'start') return vals;

    var dynamic = false;
    var period = trace[axLetter + 'period'];
    if(isNumeric(period)) {
        period = +period; // milliseconds
        if(period <= 0) return vals;
    } else if(typeof period === 'string' && period.charAt(0) === 'M') {
        var v = +(period.substring(1));
        if(v > 0 && Math.round(v) === v) period = v; // positive integer months
        else return vals;

        dynamic = true;
    }

    if(period > 0) {
        var ratio = (alignment === 'end') ? 1 : 0.5;

        var len = vals.length;
        for(var i = 0; i < len; i++) {
            var delta;

            if(dynamic) {
                var dateStr = ms2DateTime(vals[i], 0, ax.calendar);
                var d = new Date(dateStr);
                var year = d.getFullYear();
                var month = d.getMonth();

                var totalDaysInMonths = 0;
                for(var k = 0; k < period; k++) {
                    month += 1;
                    if(month > 12) {
                        month = 1;
                        year++;
                    }

                    var monthDays = (
                        new Date(year, month, 0)
                    ).getDate();

                    totalDaysInMonths += monthDays;
                }

                delta = ONEDAY * totalDaysInMonths; // convert to ms
            } else {
                delta = period;
            }

            vals[i] += ratio * delta;
        }
    }
    return vals;
};
