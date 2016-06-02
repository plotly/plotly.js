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

var Lib = require('../lib');


/**
 * dateTime2ms - turn a date object or string s of the form
 * YYYY-mm-dd HH:MM:SS.sss into milliseconds (relative to 1970-01-01,
 * per javascript standard)
 * may truncate after any full field, and sss can be any length
 * even >3 digits, though javascript dates truncate to milliseconds
 * returns false if it doesn't find a date
 *
 * 2-digit to 4-digit year conversion, where to cut off?
 * from http://support.microsoft.com/kb/244664:
 *   1930-2029 (the most retro of all...)
 * but in my mac chrome from eg. d=new Date(Date.parse('8/19/50')):
 *   1950-2049
 * by Java, from http://stackoverflow.com/questions/2024273/:
 *   now-80 - now+20
 * or FileMaker Pro, from
 *      http://www.filemaker.com/12help/html/add_view_data.4.21.html:
 *   now-70 - now+30
 * but python strptime etc, via
 *      http://docs.python.org/py3k/library/time.html:
 *   1969-2068 (super forward-looking, but static, not sliding!)
 *
 * lets go with now-70 to now+30, and if anyone runs into this problem
 * they can learn the hard way not to use 2-digit years, as no choice we
 * make now will cover all possibilities. mostly this will all be taken
 * care of in initial parsing, should only be an issue for hand-entered data
 * currently (2012) this range is:
 *   1942-2041
 */

exports.dateTime2ms = function(s) {
    // first check if s is a date object
    try {
        if(s.getTime) return +s;
    }
    catch(e) {
        return false;
    }

    var y, m, d, h;
    // split date and time parts
    var datetime = String(s).split(' ');
    if(datetime.length > 2) return false;

    var p = datetime[0].split('-'); // date part
    if(p.length > 3 || (p.length !== 3 && datetime[1])) return false;

    // year
    if(p[0].length === 4) y = Number(p[0]);
    else if(p[0].length === 2) {
        var yNow = new Date().getFullYear();
        y = ((Number(p[0]) - yNow + 70) % 100 + 200) % 100 + yNow - 70;
    }
    else return false;
    if(!isNumeric(y)) return false;
    if(p.length === 1) return new Date(y, 0, 1).getTime(); // year only

    // month
    m = Number(p[1]) - 1; // new Date() uses zero-based months
    if(p[1].length > 2 || !(m >= 0 && m <= 11)) return false;
    if(p.length === 2) return new Date(y, m, 1).getTime(); // year-month

    // day
    d = Number(p[2]);
    if(p[2].length > 2 || !(d >= 1 && d <= 31)) return false;

    // now save the date part
    d = new Date(y, m, d).getTime();
    if(!datetime[1]) return d; // year-month-day
    p = datetime[1].split(':');
    if(p.length > 3) return false;

    // hour
    h = Number(p[0]);
    if(p[0].length > 2 || !(h >= 0 && h <= 23)) return false;
    d += 3600000 * h;
    if(p.length === 1) return d;

    // minute
    m = Number(p[1]);
    if(p[1].length > 2 || !(m >= 0 && m <= 59)) return false;
    d += 60000 * m;
    if(p.length === 2) return d;

    // second
    s = Number(p[2]);
    if(!(s >= 0 && s < 60)) return false;
    return d + s * 1000;
};

// is string s a date? (see above)
exports.isDateTime = function(s) {
    return (exports.dateTime2ms(s) !== false);
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
    if(typeof(d3) === 'undefined') {
        Lib.error('d3 is not defined.');
        return;
    }

    if(!r) r = 0;
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

/**
 * parseDate: forgiving attempt to turn any date string
 * into a javascript date object
 *
 * first collate all the date formats we want to support, precompiled
 * to d3 format objects see below for the string cleaning that happens
 * before this separate out 2-digit (y) and 4-digit-year (Y) formats,
 * formats with month names (b), and formats with am/pm (I) or no time (D)
 * (also includes hour only, as the test is really for a colon) so we can
 * cut down the number of tests we need to run for any given string
 * (right now all are between 15 and 32 tests)
 */

// TODO: this is way out of date vs. the server-side version
var timeFormats = {
    // 24 hour
    H: ['%H:%M:%S~%L', '%H:%M:%S', '%H:%M'],
    // with am/pm
    I: ['%I:%M:%S~%L%p', '%I:%M:%S%p', '%I:%M%p'],
    // no colon, ie only date or date with hour (could also support eg 12h34m?)
    D: ['%H', '%I%p', '%Hh']
};

var dateFormats = {
    Y: [
        '%Y~%m~%d',
        '%Y%m%d',
        '%y%m%d', // YYMMDD, has 6 digits together so will match Y, not y
        '%m~%d~%Y', // MM/DD/YYYY has first precedence
        '%d~%m~%Y' // then DD/MM/YYYY
    ],
    Yb: [
        '%b~%d~%Y', // eg nov 21 2013
        '%d~%b~%Y', // eg 21 nov 2013
        '%Y~%d~%b', // eg 2013 21 nov (or 2013 q3, after replacement)
        '%Y~%b~%d' // eg 2013 nov 21
    ],
    /**
     * the two-digit year cases have so many potential ambiguities
     * it's not even funny, but we'll try them anyway.
     */
    y: [
        '%m~%d~%y',
        '%d~%m~%y',
        '%y~%m~%d'
    ],
    yb: [
        '%b~%d~%y',
        '%d~%b~%y',
        '%y~%d~%b',
        '%y~%b~%d'
    ]
};

// use utc formatter since we're ignoring timezone info
var formatter = d3.time.format.utc;

/**
 * ISO8601 and YYYYMMDDHHMMSS are the only ones where date and time
 * are not separated by a space, so they get inserted specially here.
 * Also a couple formats with no day (so time makes no sense)
 */
var dateTimeFormats = {
    Y: {
        H: ['%Y~%m~%dT%H:%M:%S', '%Y~%m~%dT%H:%M:%S~%L'].map(formatter),
        I: [],
        D: ['%Y%m%d%H%M%S', '%Y~%m', '%m~%Y'].map(formatter)
    },
    Yb: {H: [], I: [], D: ['%Y~%b', '%b~%Y'].map(formatter)},
    y: {H: [], I: [], D: []},
    yb: {H: [], I: [], D: []}
};
// all others get inserted in all possible combinations from dateFormats and timeFormats
['Y', 'Yb', 'y', 'yb'].forEach(function(dateType) {
    dateFormats[dateType].forEach(function(dateFormat) {
        // just a date (don't do just a time)
        dateTimeFormats[dateType].D.push(formatter(dateFormat));
        ['H', 'I', 'D'].forEach(function(timeType) {
            timeFormats[timeType].forEach(function(timeFormat) {
                var a = dateTimeFormats[dateType][timeType];

                // 'date time', then 'time date'
                a.push(formatter(dateFormat + '~' + timeFormat));
                a.push(formatter(timeFormat + '~' + dateFormat));
            });
        });
    });
});

// precompiled regexps for performance
var matchword = /[a-z]*/g,
    shortenword = function(m) { return m.substr(0, 3); },
    weekdaymatch = /(mon|tue|wed|thu|fri|sat|sun|the|of|st|nd|rd|th)/g,
    separatormatch = /[\s,\/\-\.\(\)]+/g,
    ampmmatch = /~?([ap])~?m(~|$)/,
    replaceampm = function(m, ap) { return ap + 'm '; },
    match4Y = /\d\d\d\d/,
    matchMonthName = /(^|~)[a-z]{3}/,
    matchAMPM = /[ap]m/,
    matchcolon = /:/,
    matchquarter = /q([1-4])/,
    quarters = ['31~mar', '30~jun', '30~sep', '31~dec'],
    replacequarter = function(m, n) { return quarters[n - 1]; },
    matchTZ = / ?([+\-]\d\d:?\d\d|Z)$/;

function getDateType(v) {
    var dateType;
    dateType = (match4Y.test(v) ? 'Y' : 'y');
    dateType = dateType + (matchMonthName.test(v) ? 'b' : '');
    return dateType;
}

function getTimeType(v) {
    var timeType;
    timeType = matchcolon.test(v) ? (matchAMPM.test(v) ? 'I' : 'H') : 'D';
    return timeType;
}

exports.parseDate = function(v) {
    // is it already a date? just return it
    if(v.getTime) return v;
    /**
     * otherwise, if it's not a string, return nothing
     * the case of numbers that just have years will get
     * dealt with elsewhere.
     */
    if(typeof v !== 'string') return false;

    // first clean up the string a bit to reduce the number of formats we have to test
    v = v.toLowerCase()
        /**
         * cut all words down to 3 characters - this will result in
         * some spurious matches, ie whenever the first three characters
         * of a word match a month or weekday but that seems more likely
         * to fix typos than to make dates where they shouldn't be...
         * and then we can omit the long form of months from our testing
         */
        .replace(matchword, shortenword)
        /**
         * remove weekday names, as they get overridden anyway if they're
         * inconsistent also removes a few more words
         * (ie "tuesday the 26th of november")
         * TODO: language support?
         * for months too, but these seem to be built into d3
         */
        .replace(weekdaymatch, '')
        /**
         * collapse all separators one ~ at a time, except : which seems
         * pretty consistent for the time part use ~ instead of space or
         * something since d3 can eat a space as padding on 1-digit numbers
         */
        .replace(separatormatch, '~')
        // in case of a.m. or p.m. (also take off any space before am/pm)
        .replace(ampmmatch, replaceampm)
        // turn quarters Q1-4 into dates (quarter ends)
        .replace(matchquarter, replacequarter)
        .trim()
        // also try to ignore timezone info, at least for now
        .replace(matchTZ, '');

    // now test against the various formats that might match
    var out = null,
        dateType = getDateType(v),
        timeType = getTimeType(v),
        formatList,
        len;

    formatList = dateTimeFormats[dateType][timeType];
    len = formatList.length;

    for(var i = 0; i < len; i++) {
        out = formatList[i].parse(v);
        if(out) break;
    }

    // If not an instance of Date at this point, just return it.
    if(!(out instanceof Date)) return false;
    // parse() method interprets arguments with local time zone.
    var tzoff = out.getTimezoneOffset();
    // In general (default) this is not what we want, so force into UTC:
    out.setTime(out.getTime() + tzoff * 60 * 1000);
    return out;
};
