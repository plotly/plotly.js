/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var logError = require('./loggers').error;

var constants = require('../constants/numerical');
var BADNUM = constants.BADNUM;
var ONEDAY = constants.ONEDAY;
var ONEHOUR = constants.ONEHOUR;
var ONEMIN = constants.ONEMIN;
var ONESEC = constants.ONESEC;

var DATETIME_REGEXP = /^\s*(-?\d\d\d\d|\d\d)(-(0?[1-9]|1[012])(-([0-3]?\d)([ Tt]([01]?\d|2[0-3])(:([0-5]\d)(:([0-5]\d(\.\d+)?))?(Z|z|[+\-]\d\d:?\d\d)?)?)?)?)?\s*$/m;

// for 2-digit years, the first year we map them onto
var YFIRST = new Date().getFullYear() - 70;

// is an object a javascript date?
exports.isJSDate = function(v) {
    return typeof v === 'object' && v !== null && typeof v.getTime === 'function';
};

// The absolute limits of our date-time system
// This is a little weird: we use MIN_MS and MAX_MS in dateTime2ms
// but we use dateTime2ms to calculate them (after defining it!)
var MIN_MS, MAX_MS;

/**
 * dateTime2ms - turn a date object or string s into milliseconds
 * (relative to 1970-01-01, per javascript standard)
 *
 * Returns BADNUM if it doesn't find a date
 *
 * strings should have the form:
 *
 *    -?YYYY-mm-dd<sep>HH:MM:SS.sss<tzInfo>?
 *
 * <sep>: space (our normal standard) or T or t (ISO-8601)
 * <tzInfo>: Z, z, or [+\-]HH:?MM and we THROW IT AWAY
 * this format comes from https://tools.ietf.org/html/rfc3339#section-5.6
 * but we allow it even with a space as the separator
 *
 * May truncate after any full field, and sss can be any length
 * even >3 digits, though javascript dates truncate to milliseconds,
 * we keep as much as javascript numeric precision can hold, but we only
 * report back up to 100 microsecond precision, because most dates support
 * this precision (close to 1970 support more, very far away support less)
 *
 * Expanded to support negative years to -9999 but you must always
 * give 4 digits, except for 2-digit positive years which we assume are
 * near the present time.
 * Note that we follow ISO 8601:2004: there *is* a year 0, which
 * is 1BC/BCE, and -1===2BC etc.
 *
 * Where to cut off 2-digit years between 1900s and 2000s?
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
        // Convert to the UTC milliseconds that give the same
        // hours as this date has in the local timezone
        s = Number(s) - s.getTimezoneOffset() * ONEMIN;
        if(s >= MIN_MS && s <= MAX_MS) return s;
        return BADNUM;
    }
    // otherwise only accept strings and numbers
    if(typeof s !== 'string' && typeof s !== 'number') return BADNUM;

    var match = String(s).match(DATETIME_REGEXP);
    if(!match) return BADNUM;
    var y = match[1],
        m = Number(match[3] || 1),
        d = Number(match[5] || 1),
        H = Number(match[7] || 0),
        M = Number(match[9] || 0),
        S = Number(match[11] || 0);
    if(y.length === 2) {
        y = (Number(y) + 2000 - YFIRST) % 100 + YFIRST;
    }
    else y = Number(y);

    // javascript takes new Date(0..99,m,d) to mean 1900-1999, so
    // to support years 0-99 we need to use setFullYear explicitly
    var date = new Date(Date.UTC(2000, m - 1, d, H, M));
    date.setUTCFullYear(y);

    if(date.getUTCDate() !== d) return BADNUM;

    return date.getTime() + S * ONESEC;
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

    var msecTenths = Math.round(((ms % 1) + 1) * 10) % 10,
        d = new Date(Math.round(ms - msecTenths / 10)),
        dateStr = d3.time.format.utc('%Y-%m-%d')(d),
        // <90 days: add hours and minutes - never *only* add hours
        h = (r < NINETYDAYS) ? d.getUTCHours() : 0,
        m = (r < NINETYDAYS) ? d.getUTCMinutes() : 0,
        // <3 hours: add seconds
        s = (r < THREEHOURS) ? d.getUTCSeconds() : 0,
        // <5 minutes: add ms (plus one extra digit, this is msec*10)
        msec10 = (r < FIVEMIN) ? d.getUTCMilliseconds() * 10 + msecTenths : 0;

    return includeTime(dateStr, h, m, s, msec10);
};

// For converting old-style milliseconds to date strings,
// we use the local timezone rather than UTC like we use
// everywhere else, both for backward compatibility and
// because that's how people mostly use javasript date objects.
// Clip one extra day off our date range though so we can't get
// thrown beyond the range by the timezone shift.
exports.ms2DateTimeLocal = function(ms) {
    if(!(ms >= MIN_MS + ONEDAY && ms <= MAX_MS - ONEDAY)) return BADNUM;

    var msecTenths = Math.round(((ms % 1) + 1) * 10) % 10,
        d = new Date(Math.round(ms - msecTenths / 10)),
        dateStr = d3.time.format('%Y-%m-%d')(d),
        h = d.getHours(),
        m = d.getMinutes(),
        s = d.getSeconds(),
        msec10 = d.getUTCMilliseconds() * 10 + msecTenths;

    return includeTime(dateStr, h, m, s, msec10);
};

function includeTime(dateStr, h, m, s, msec10) {
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
}

// normalize date format to date string, in case it starts as
// a Date object or milliseconds
// optional dflt is the return value if cleaning fails
exports.cleanDate = function(v, dflt) {
    if(exports.isJSDate(v) || typeof v === 'number') {
        // NOTE: if someone puts in a year as a number rather than a string,
        // this will mistakenly convert it thinking it's milliseconds from 1970
        // that is: '2012' -> Jan. 1, 2012, but 2012 -> 2012 epoch milliseconds
        v = exports.ms2DateTimeLocal(+v);
        if(!v && dflt !== undefined) return dflt;
    }
    else if(!exports.isDateTime(v)) {
        logError('unrecognized date', v);
        return dflt;
    }
    return v;
};
