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
var BADNUM = require('./constants').BADNUM;

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
 * lets go with now-70 to now+30, and if anyone runs into this problem
 * they can learn the hard way not to use 2-digit years, as no choice we
 * make now will cover all possibilities. mostly this will all be taken
 * care of in initial parsing, should only be an issue for hand-entered data
 * currently (2016) this range is:
 *   1946-2045
 */

exports.dateTime2ms = function(s) {
    // first check if s is a date object
    try {
        if(s.getTime) return +s;
    }
    catch(e) {
        return BADNUM;
    }

    var y, m, d, h;
    // split date and time parts
    var datetime = String(s).split(' ');
    if(datetime.length > 2) return BADNUM;

    var p = datetime[0].split('-'); // date part

    var CE = true; // common era, ie positive year
    if(p[0] === '') {
        // first part is blank: year starts with a minus sign
        CE = false;
        p.splice(0, 1);
    }

    if(p.length > 3 || (p.length !== 3 && datetime[1])) return BADNUM;

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

        // month
        m = Number(p[1]) - 1; // new Date() uses zero-based months
        if(p[1].length > 2 || !(m >= 0 && m <= 11)) return BADNUM;
        baseDate.setMonth(m);

        if(p.length > 2) {

            // day
            d = Number(p[2]);
            if(p[2].length > 2 || !(d >= 1 && d <= 31)) return BADNUM;
            baseDate.setDate(d);

            // does that date exist in this month?
            if(baseDate.getDate() !== d) return BADNUM;

            if(datetime[1]) {

                p = datetime[1].split(':');
                if(p.length > 3) return BADNUM;

                // hour
                h = Number(p[0]);
                if(p[0].length > 2 || !(h >= 0 && h <= 23)) return BADNUM;
                baseDate.setHours(h);

                // does that hour exist in this day? (Daylight time!)
                // (TODO: remove this check when we move to UTC)
                if(baseDate.getHours() !== h) return BADNUM;

                if(p.length > 1) {
                    d = baseDate.getTime();

                    // minute
                    m = Number(p[1]);
                    if(p[1].length > 2 || !(m >= 0 && m <= 59)) return BADNUM;
                    d += 60000 * m;
                    if(p.length === 2) return d;

                    // second (and milliseconds)
                    s = Number(p[2]);
                    if(!(s >= 0 && s < 60)) return BADNUM;
                    return d + s * 1000;
                }
            }
        }
    }
    return baseDate.getTime();
};

exports.MIN_MS = exports.dateTime2ms('-9999');
exports.MAX_MS = exports.dateTime2ms('9999');

// is string s a date? (see above)
exports.isDateTime = function(s) {
    return (exports.dateTime2ms(s) !== BADNUM);
};

// pad a number with zeroes, to given # of digits before the decimal point
function lpad(val, digits) {
    return String(val + Math.pow(10, digits)).substr(1);
}

/**
 * Turn ms into string of the form YYYY-mm-dd HH:MM:SS.sss
 * Crop any trailing zeros in time, but always leave full date
 * (we could choose to crop '-01' from date too)...
 * Optional range r is the data range that applies, also in ms.
 * If rng is big, the later parts of time will be omitted
 */
exports.ms2DateTime = function(ms, r) {
    if(!r) r = 0;

    if(ms < exports.MIN_MS || ms > exports.MAX_MS) return BADNUM;

    var d = new Date(ms),
        s = d3.time.format('%Y-%m-%d')(d);

    if(r < 7776000000) {
        // <90 days: add hours
        s += ' ' + lpad(d.getHours(), 2);
        if(r < 432000000) {
            // <5 days: add minutes
            s += ':' + lpad(d.getMinutes(), 2);
            if(r < 10800000) {
                // <3 hours: add seconds
                s += ':' + lpad(d.getSeconds(), 2);
                if(r < 300000) {
                    // <5 minutes: add ms
                    s += '.' + lpad(d.getMilliseconds(), 3);
                }
            }
        }
        // strip trailing zeros
        return s.replace(/([:\s]00)*\.?[0]*$/, '');
    }
    return s;
};
