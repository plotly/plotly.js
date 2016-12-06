/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var calendars = require('world-calendars');

var Lib = require('../../lib');
var constants = require('../../constants/numerical');

var EPOCHJD = constants.EPOCHJD;
var ONEDAY = constants.ONEDAY;

// each calendar needs its own default canonical tick. I would love to use
// 2000-01-01 (or even 0000-01-01) for them all but they don't necessarily
// all support either of those dates. Instead I'll use the most significant
// number they *do* support, biased toward the present day.
var CANONICAL_TICK = {
    coptic: '2000-01-01',
    discworld: '2000-01-01',
    ethiopian: '2000-01-01',
    hebrew: '5000-01-01',
    islamic: '1000-01-01',
    julian: '2000-01-01',
    mayan: '5000-01-01',
    nanakshahi: '1000-01-01',
    nepali: '2000-01-01',
    persian: '1000-01-01',
    jalali: '1000-01-01',
    taiwan: '1000-01-01',
    thai: '2000-01-01',
    ummalqura: '1400-01-01'
};

// Start on a Sunday - for week ticks
// Discworld and Mayan calendars don't have 7-day weeks anyway so don't change them.
// If anyone really cares we can customize the auto tick spacings for these calendars.
var CANONICAL_SUNDAY = {
    coptic: '2000-01-03',
    discworld: '2000-01-01',
    ethiopian: '2000-01-05',
    hebrew: '5000-01-01',
    islamic: '1000-01-02',
    julian: '2000-01-03',
    mayan: '5000-01-01',
    nanakshahi: '1000-01-05',
    nepali: '2000-01-05',
    persian: '1000-01-01',
    jalali: '1000-01-01',
    taiwan: '1000-01-04',
    thai: '2000-01-04',
    ummalqura: '1400-01-06'
};

var DFLTRANGE = {
    coptic: ['1700-01-01', '1701-01-01'],
    discworld: ['1800-01-01', '1801-01-01'],
    ethiopian: ['2000-01-01', '2001-01-01'],
    hebrew: ['5700-01-01', '5701-01-01'],
    islamic: ['1400-01-01', '1401-01-01'],
    julian: ['2000-01-01', '2001-01-01'],
    mayan: ['5200-01-01', '5201-01-01'],
    nanakshahi: ['0500-01-01', '0501-01-01'],
    nepali: ['2000-01-01', '2001-01-01'],
    persian: ['1400-01-01', '1401-01-01'],
    jalali: ['1400-01-01', '1401-01-01'],
    taiwan: ['0100-01-01', '0101-01-01'],
    thai: ['2500-01-01', '2501-01-01'],
    ummalqura: ['1400-01-01', '1401-01-01']
};

/*
 * convert d3 templates to world-calendars templates, so our users only need
 * to know d3's specifiers. Map space padding to no padding, and unknown fields
 * to an ugly placeholder
 */
var UNKNOWN = '##';
var d3ToWorldCalendars = {
    'd': {'0': 'dd', '-': 'd'}, // 2-digit or unpadded day of month
    'a': {'0': 'D', '-': 'D'}, // short weekday name
    'A': {'0': 'DD', '-': 'DD'}, // full weekday name
    'j': {'0': 'oo', '-': 'o'}, // 3-digit or unpadded day of the year
    'W': {'0': 'ww', '-': 'w'}, // 2-digit or unpadded week of the year (Monday first)
    'm': {'0': 'mm', '-': 'm'}, // 2-digit or unpadded month number
    'b': {'0': 'M', '-': 'M'}, // short month name
    'B': {'0': 'MM', '-': 'MM'}, // full month name
    'y': {'0': 'yy', '-': 'yy'}, // 2-digit year (map unpadded to zero-padded)
    'Y': {'0': 'yyyy', '-': 'yyyy'}, // 4-digit year (map unpadded to zero-padded)
    'U': UNKNOWN, // Sunday-first week of the year
    'w': UNKNOWN, // day of the week [0(sunday),6]
    // combined format, we replace the date part with the world-calendar version
    // and the %X stays there for d3 to handle with time parts
    '%c': {'0': 'D M m %X yyyy', '-': 'D M m %X yyyy'},
    '%x': {'0': 'mm/dd/yyyy', '-': 'mm/dd/yyyy'}
};

function worldCalFmt(fmt, x, calendar) {
    var dateJD = Math.floor(x + 0.05 / ONEDAY) + EPOCHJD,
        cDate = getCal(calendar).fromJD(dateJD),
        i = 0,
        modifier, directive, directiveLen, directiveObj, replacementPart;
    while((i = fmt.indexOf('%', i)) !== -1) {
        modifier = fmt.charAt(i + 1);
        if(modifier === '0' || modifier === '-' || modifier === '_') {
            directiveLen = 3;
            directive = fmt.charAt(i + 1);
            if(modifier === '_') modifier = '-';
        }
        else {
            directive = modifier;
            modifier = '0';
            directiveLen = 2;
        }
        directiveObj = d3ToWorldCalendars[directive];
        if(!directiveObj) {
            i += directiveLen;
        }
        else {
            // code is recognized as a date part but world-calendars doesn't support it
            if(directiveObj === UNKNOWN) replacementPart = UNKNOWN;

            // format the cDate according to the translated directive
            else replacementPart = cDate.formatDate(directiveObj[modifier]);

            fmt = fmt.substr(0, i) + replacementPart + fmt.substr(i + directiveLen);
            i += replacementPart.length;
        }
    }
    return fmt;
}

// cache world calendars, so we don't have to reinstantiate
// during each date-time conversion
var allCals = {};
function getCal(calendar) {
    var calendarObj = allCals[calendar];
    if(calendarObj) return calendarObj;

    calendarObj = allCals[calendar] = calendars.instance(calendar);
    return calendarObj;
}

module.exports = {
    moduleType: 'component',
    name: 'calendars',

    CANONICAL_SUNDAY: CANONICAL_SUNDAY,
    CANONICAL_TICK: CANONICAL_TICK,
    DFLTRANGE: DFLTRANGE,

    getCal: getCal,
    worldCalFmt: worldCalFmt
};
