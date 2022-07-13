'use strict';

var isNumeric = require('fast-isnumeric');
var Lib = require('../../lib');
var dateTime2ms = Lib.dateTime2ms;
var incrementMonth = Lib.incrementMonth;
var constants = require('../../constants/numerical');
var ONEAVGMONTH = constants.ONEAVGMONTH;

module.exports = function alignPeriod(trace, ax, axLetter, vals) {
    if(ax.type !== 'date') return {vals: vals};

    var alignment = trace[axLetter + 'periodalignment'];
    if(!alignment) return {vals: vals};

    var period = trace[axLetter + 'period'];
    var mPeriod;
    if(isNumeric(period)) {
        period = +period;
        if(period <= 0) return {vals: vals};
    } else if(typeof period === 'string' && period.charAt(0) === 'M') {
        var n = +(period.substring(1));
        if(n > 0 && Math.round(n) === n) {
            mPeriod = n;
        } else return {vals: vals};
    }

    var calendar = ax.calendar;

    var isStart = 'start' === alignment;
    // var isMiddle = 'middle' === alignment;
    var isEnd = 'end' === alignment;

    var period0 = trace[axLetter + 'period0'];
    var base = dateTime2ms(period0, calendar) || 0;

    var newVals = [];
    var starts = [];
    var ends = [];

    var len = vals.length;
    for(var i = 0; i < len; i++) {
        var v = vals[i];

        var nEstimated, startTime, endTime;
        if(mPeriod) {
            // guess at how many periods away from base we are
            nEstimated = Math.round((v - base) / (mPeriod * ONEAVGMONTH));
            endTime = incrementMonth(base, mPeriod * nEstimated, calendar);

            // iterate to get the exact bounds before and after v
            // there may be ways to make this faster, but most of the time
            // we'll only execute each loop zero or one time.
            while(endTime > v) {
                endTime = incrementMonth(endTime, -mPeriod, calendar);
            }
            while(endTime <= v) {
                endTime = incrementMonth(endTime, mPeriod, calendar);
            }

            // now we know endTime is the boundary immediately after v
            // so startTime is obtained by incrementing backward one period.
            startTime = incrementMonth(endTime, -mPeriod, calendar);
        } else { // case of ms
            nEstimated = Math.round((v - base) / period);
            endTime = base + nEstimated * period;

            while(endTime > v) {
                endTime -= period;
            }
            while(endTime <= v) {
                endTime += period;
            }

            startTime = endTime - period;
        }

        newVals[i] = (
            isStart ? startTime :
            isEnd ? endTime :
            (startTime + endTime) / 2
        );

        starts[i] = startTime;
        ends[i] = endTime;
    }

    return {
        vals: newVals,
        starts: starts,
        ends: ends
    };
};
