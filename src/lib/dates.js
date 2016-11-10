/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var logError = require('./loggers').error;

var constants = require('../constants/numerical');
var BADNUM = constants.BADNUM;
var ONEDAY = constants.ONEDAY;
var ONEHOUR = constants.ONEHOUR;
var ONEMIN = constants.ONEMIN;
var ONESEC = constants.ONESEC;

// is an object a javascript date?
exports.isJSDate = function(v) {
    return typeof v === 'object' && v !== null && typeof v.getTime === 'function';
};

// The absolute limits of our date-time system
// This is a little weird: we use MIN_MS and MAX_MS in dateTime2ms
// but we use dateTime2ms to calculate them (after defining it!)
var MIN_MS, MAX_MS;

/**
 * dateTime2ms - turn a date object or string s of the form
 * YYYY-mm-dd HH:MM:SS.sss into milliseconds (relative to 1970-01-01,
 * per javascript standard)
 * may truncate after any full field, and sss can be any length
 * even >3 digits, though javascript dates truncate to milliseconds
 * returns BADNUM if it doesn't find a date
 *
 * Expanded to support negative years to -9999 but you must always
 * give 4 digits, except for 2-digit positive years which we assume are
 * near the present time.
 * Note that we follow ISO 8601:2004: there *is* a year 0, which
 * is 1BC/BCE, and -1===2BC etc.
 *
 * 2-digit to 4-digit year conversion, where to cut off?
 * from http://support.microsoft.com/kb/244664:
 *   1930-2029 (the most retro of all...)
 * but in my mac chrome from eg. d=new Date(Date.parse('8/19/50')):
 *   1950-2049
 * by Java, from http://stackoverflow.com/questions/2024273/:
 *   now-80 - now+19
 * or FileMaker Pro, from
 *      http://www.filemaker.com/12help/html/add_view_data.4.21.html:
 *   now-70 - now+29
 * but python strptime etc, via
 *      http://docs.python.org/py3k/library/time.html:
 *   1969-2068 (super forward-looking, but static, not sliding!)
 *
 * lets go with now-70 to now+29, and if anyone runs into this problem
 * they can learn the hard way not to use 2-digit years, as no choice we
 * make now will cover all possibilities. mostly this will all be taken
 * care of in initial parsing, should only be an issue for hand-entered data
 * currently (2016) this range is:
 *   1946-2045
 */

exports.dateTime2ms = function(s) {
    // first check if s is a date object
    if(exports.isJSDate(s)) {
        s = Number(s);
        if(s >= MIN_MS && s <= MAX_MS) return s;
        return BADNUM;
    }
    // otherwise only accept strings and numbers
    if(typeof s !== 'string' && typeof s !== 'number') return BADNUM;

    var y, m, d, h;
    // split date and time parts
    // TODO: we strip leading/trailing whitespace but not other
    // characters like we do for numbers - do we want to?
    var datetime = String(s).trim().split(' ');
    if(datetime.length > 2) return BADNUM;

    var p = datetime[0].split('-'); // date part

    var CE = true; // common era, ie positive year
    if(p[0] === '') {
        // first part is blank: year starts with a minus sign
        CE = false;
        p.splice(0, 1);
    }

    var plen = p.length;
    if(plen > 3 || (plen !== 3 && datetime[1]) || !plen) return BADNUM;

    // year
    if(p[0].length === 4) y = Number(p[0]);
    else if(p[0].length === 2) {
        if(!CE) return BADNUM;
        var yNow = new Date().getFullYear();
        y = ((Number(p[0]) - yNow + 70) % 100 + 200) % 100 + yNow - 70;
    }
    else return BADNUM;
    if(!isNumeric(y)) return BADNUM;

    // javascript takes new Date(0..99,m,d) to mean 1900-1999, so
    // to support years 0-99 we need to use setFullYear explicitly
    var baseDate = new Date(0, 0, 1);
    baseDate.setFullYear(CE ? y : -y);
    if(p.length > 1) {

        // month - may be 1 or 2 digits
        m = Number(p[1]) - 1; // new Date() uses zero-based months
        if(p[1].length > 2 || !(m >= 0 && m <= 11)) return BADNUM;
        baseDate.setMonth(m);

        if(p.length > 2) {

            // day - may be 1 or 2 digits
            d = Number(p[2]);
            if(p[2].length > 2 || !(d >= 1 && d <= 31)) return BADNUM;
            baseDate.setDate(d);

            // does that date exist in this month?
            if(baseDate.getDate() !== d) return BADNUM;

            if(datetime[1]) {

                p = datetime[1].split(':');
                if(p.length > 3) return BADNUM;

                // hour - may be 1 or 2 digits
                h = Number(p[0]);
                if(p[0].length > 2 || !p[0].length || !(h >= 0 && h <= 23)) return BADNUM;
                baseDate.setHours(h);

                // does that hour exist in this day? (Daylight time!)
                // (TODO: remove this check when we move to UTC)
                if(baseDate.getHours() !== h) return BADNUM;

                if(p.length > 1) {
                    d = baseDate.getTime();

                    // minute - must be 2 digits
                    m = Number(p[1]);
                    if(p[1].length !== 2 || !(m >= 0 && m <= 59)) return BADNUM;
                    d += ONEMIN * m;
                    if(p.length === 2) return d;

                    // second (and milliseconds) - must have 2-digit seconds
                    if(p[2].split('.')[0].length !== 2) return BADNUM;
                    s = Number(p[2]);
                    if(!(s >= 0 && s < 60)) return BADNUM;
                    return d + s * ONESEC;
                }
            }
        }
    }
    return baseDate.getTime();
};

MIN_MS = exports.MIN_MS = exports.dateTime2ms('-9999');
MAX_MS = exports.MAX_MS = exports.dateTime2ms('9999-12-31 23:59:59.9999');

// is string s a date? (see above)
exports.isDateTime = function(s) {
    return (exports.dateTime2ms(s) !== BADNUM);
};

// pad a number with zeroes, to given # of digits before the decimal point
function lpad(val, digits) {
    return String(val + Math.pow(10, digits)).substr(1);
}

/**
 * Turn ms into string of the form YYYY-mm-dd HH:MM:SS.ssss
 * Crop any trailing zeros in time, except never stop right after hours
 * (we could choose to crop '-01' from date too but for now we always
 * show the whole date)
 * Optional range r is the data range that applies, also in ms.
 * If rng is big, the later parts of time will be omitted
 */
var NINETYDAYS = 90 * ONEDAY;
var THREEHOURS = 3 * ONEHOUR;
var FIVEMIN = 5 * ONEMIN;
exports.ms2DateTime = function(ms, r) {
    if(typeof ms !== 'number' || !(ms >= MIN_MS && ms <= MAX_MS)) return BADNUM;

    if(!r) r = 0;

    var d = new Date(Math.floor(ms)),
        dateStr = d3.time.format('%Y-%m-%d')(d),
        // <90 days: add hours and minutes - never *only* add hours
        h = (r < NINETYDAYS) ? d.getHours() : 0,
        m = (r < NINETYDAYS) ? d.getMinutes() : 0,
        // <3 hours: add seconds
        s = (r < THREEHOURS) ? d.getSeconds() : 0,
        // <5 minutes: add ms (plus one extra digit, this is msec*10)
        msec10 = (r < FIVEMIN) ? Math.round((d.getMilliseconds() + (((ms % 1) + 1) % 1)) * 10) : 0;

    // include each part that has nonzero data in or after it
    if(h || m || s || msec10) {
        dateStr += ' ' + lpad(h, 2) + ':' + lpad(m, 2);
        if(s || msec10) {
            dateStr += ':' + lpad(s, 2);
            if(msec10) {
                var digits = 4;
                while(msec10 % 10 === 0) {
                    digits -= 1;
                    msec10 /= 10;
                }
                dateStr += '.' + lpad(msec10, digits);
            }
        }
    }
    return dateStr;
};

// normalize date format to date string, in case it starts as
// a Date object or milliseconds
// optional dflt is the return value if cleaning fails
exports.cleanDate = function(v, dflt) {
    if(exports.isJSDate(v) || typeof v === 'number') {
        // NOTE: if someone puts in a year as a number rather than a string,
        // this will mistakenly convert it thinking it's milliseconds from 1970
        // that is: '2012' -> Jan. 1, 2012, but 2012 -> 2012 epoch milliseconds
        v = exports.ms2DateTime(+v);
        if(!v && dflt !== undefined) return dflt;
    }
    else if(!exports.isDateTime(v)) {
        logError('unrecognized date', v);
        return dflt;
    }
    return v;
};
