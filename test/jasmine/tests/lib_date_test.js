var isNumeric = require('fast-isnumeric');

var Lib = require('@src/lib');
var calComponent = require('@src/components/calendars');

// use only the parts of world-calendars that we've imported for our tests
var calendars = require('@src/components/calendars/calendars');

describe('dates', function() {
    'use strict';

    var d1c = new Date(2000, 0, 1, 1, 0, 0, 600);
    // first-century years must be set separately as Date constructor maps 2-digit years
    // to near the present, but we accept them as part of 4-digit years
    d1c.setFullYear(13);

    var thisYear = new Date().getFullYear(),
        thisYear_2 = thisYear % 100,
        nowMinus70 = thisYear - 70,
        nowMinus70_2 = nowMinus70 % 100,
        nowPlus29 = thisYear + 29,
        nowPlus29_2 = nowPlus29 % 100;

    describe('dateTime2ms', function() {
        it('should accept valid date strings', function() {
            var tzOffset;

            [
                ['2016', new Date(2016, 0, 1)],
                ['2016-05', new Date(2016, 4, 1)],
                // leap year, and whitespace
                ['\r\n\t 2016-02-29\r\n\t ', new Date(2016, 1, 29)],
                ['9814-08-23', new Date(9814, 7, 23)],
                ['1564-03-14 12', new Date(1564, 2, 14, 12)],
                ['0122-04-08 08:22', new Date(122, 3, 8, 8, 22)],
                ['-0098-11-19 23:59:59', new Date(-98, 10, 19, 23, 59, 59)],
                ['-9730-12-01 12:34:56.789', new Date(-9730, 11, 1, 12, 34, 56, 789)],
                // random whitespace before and after gets stripped
                ['\r\n\t -9730-12-01 12:34:56.789\r\n\t ', new Date(-9730, 11, 1, 12, 34, 56, 789)],
                // first century, also allow month, day, and hour to be 1-digit, and not all
                // three digits of milliseconds
                ['0013-1-1 1:00:00.6', d1c],
                // we support tenths of msec too, though Date objects don't. Smaller than that
                // and we hit the precision limit of js numbers unless we're close to the epoch.
                // It won't break though.
                ['0013-1-1 1:00:00.6001', +d1c + 0.1],
                ['0013-1-1 1:00:00.60011111111', +d1c + 0.11111111],

                // 2-digit years get mapped to now-70 -> now+29
                [thisYear_2 + '-05', new Date(thisYear, 4, 1)],
                [nowMinus70_2 + '-10-18', new Date(nowMinus70, 9, 18)],
                [nowPlus29_2 + '-02-12 14:29:32', new Date(nowPlus29, 1, 12, 14, 29, 32)],

                // including timezone info (that we discard)
                ['2014-03-04 08:15Z', new Date(2014, 2, 4, 8, 15)],
                ['2014-03-04 08:15:00.00z', new Date(2014, 2, 4, 8, 15)],
                ['2014-03-04 08:15:34+1200', new Date(2014, 2, 4, 8, 15, 34)],
                ['2014-03-04 08:15:34.567-05:45', new Date(2014, 2, 4, 8, 15, 34, 567)],
            ].forEach(function(v) {
                // just for sub-millisecond precision tests, use timezoneoffset
                // from the previous date object
                if(v[1].getTimezoneOffset) tzOffset = v[1].getTimezoneOffset();

                var expected = +v[1] - (tzOffset * 60000);
                expect(Lib.dateTime2ms(v[0])).toBe(expected, v[0]);

                // ISO-8601: all the same stuff with t or T as the separator
                expect(Lib.dateTime2ms(v[0].trim().replace(' ', 't'))).toBe(expected, v[0].trim().replace(' ', 't'));
                expect(Lib.dateTime2ms('\r\n\t ' + v[0].trim().replace(' ', 'T') + '\r\n\t ')).toBe(expected, v[0].trim().replace(' ', 'T'));
            });
        });

        it('should accept 4-digit and 2-digit numbers', function() {
            // not sure if we really *want* this behavior, but it's what we have.
            // especially since the number 0 is *not* allowed it seems pretty unlikely
            // to cause problems for people using milliseconds as dates, since the only
            // values to get mistaken are between 1 and 10 seconds before and after
            // the epoch, and between 10 and 99 milliseconds after the epoch
            // (note that millisecond numbers are not handled by dateTime2ms directly,
            // but in ax.d2c if dateTime2ms fails.)
            [
                1000, 9999, -1000, -9999
            ].forEach(function(v) {
                expect(Lib.dateTime2ms(v)).toBe(Date.UTC(v, 0, 1), v);
            });

            [
                [10, 2010],
                [nowPlus29_2, nowPlus29],
                [nowMinus70_2, nowMinus70],
                [99, 1999]
            ].forEach(function(v) {
                expect(Lib.dateTime2ms(v[0])).toBe(Date.UTC(v[1], 0, 1), v[0]);
            });
        });

        it('should accept Date objects within year +/-9999', function() {
            [
                new Date(),
                new Date(-9999, 0, 1),
                new Date(9999, 11, 31, 23, 59, 59, 999),
                new Date(-1, 0, 1),
                new Date(323, 11, 30),
                new Date(-456, 1, 2),
                d1c,
                new Date(2015, 8, 7, 23, 34, 45, 567)
            ].forEach(function(v) {
                expect(Lib.dateTime2ms(v)).toBe(+v - v.getTimezoneOffset() * 60000);
            });
        });

        it('should not accept Date objects beyond our limits', function() {
            [
                new Date(10000, 0, 1),
                new Date(-10000, 11, 31, 23, 59, 59, 999)
            ].forEach(function(v) {
                expect(Lib.dateTime2ms(v)).toBeUndefined(v);
            });
        });

        it('should not accept invalid strings or other objects', function() {
            [
                '', 0, 1, 9, -1, -10, -99, 100, 999, -100, -999, 10000, -10000,
                1.2, -1.2, 2015.1, -1023.4, NaN, null, undefined, Infinity, -Infinity,
                {}, {1: '2014-01-01'}, [], [2016], ['2015-11-23'],
                '123-01-01', '-756-01-01', // 3-digit year
                '10000-01-01', '-10000-01-01', // 5-digit year
                '2015-00-01', '2015-13-01', '2015-001-01', // bad month
                '2015-01-00', '2015-01-32', '2015-02-29', '2015-04-31', '2015-01-001', // bad day (incl non-leap year)
                '2015-01-01 24:00', '2015-01-01 -1:00', '2015-01-01 001:00', // bad hour
                '2015-01-01 12:60', '2015-01-01 12:-1', '2015-01-01 12:001', '2015-01-01 12:1', // bad minute
                '2015-01-01 12:00:60', '2015-01-01 12:00:-1', '2015-01-01 12:00:001', '2015-01-01 12:00:1', // bad second
                '2015-01-01T', '2015-01-01TT12:34', // bad ISO separators
                '2015-01-01Z', '2015-01-01T12Z', '2015-01-01T12:34Z05:00', '2015-01-01 12:34+500', '2015-01-01 12:34-5:00' // bad TZ info
            ].forEach(function(v) {
                expect(Lib.dateTime2ms(v)).toBeUndefined(v);
            });
        });

        var JULY1MS = 181 * 24 * 3600 * 1000;

        it('should use UTC with no timezone offset or daylight saving time', function() {
            expect(Lib.dateTime2ms('1970-01-01')).toBe(0);

            // 181 days (and no DST hours) between jan 1 and july 1 in a non-leap-year
            // 31 + 28 + 31 + 30 + 31 + 30
            expect(Lib.dateTime2ms('1970-07-01')).toBe(JULY1MS);
        });

        it('should interpret JS dates by local time, not by its getTime()', function() {
            // not really part of the test, just to make sure the test is meaningful
            // the test should NOT be run in a UTC environment
            var local0 = Number(new Date(1970, 0, 1)),
                localjuly1 = Number(new Date(1970, 6, 1));
            expect([local0, localjuly1]).not.toEqual([0, JULY1MS],
                'test must not run in UTC');
            // verify that there *is* daylight saving time in the test environment
            expect(localjuly1 - local0).not.toEqual(JULY1MS - 0,
                'test must run in a timezone with DST');

            // now repeat the previous test and show that we throw away
            // timezone info from js dates
            expect(Lib.dateTime2ms(new Date(1970, 0, 1))).toBe(0);
            expect(Lib.dateTime2ms(new Date(1970, 6, 1))).toBe(JULY1MS);
        });
    });

    describe('ms2DateTime', function() {
        it('should report the minimum fields with nonzero values, except minutes', function() {
            [
                '2016-01-01', // we'll never report less than this bcs month and day are never zero
                '2016-01-01 01:00', // we won't report hours without minutes
                '2016-01-01 01:01',
                '2016-01-01 01:01:01',
                '2016-01-01 01:01:01.1',
                '2016-01-01 01:01:01.01',
                '2016-01-01 01:01:01.001',
                '2016-01-01 01:01:01.0001'
            ].forEach(function(v) {
                expect(Lib.ms2DateTime(Lib.dateTime2ms(v))).toBe(v);
            });
        });

        it('should accept Date objects within year +/-9999', function() {
            [
                '-9999-01-01',
                '-9999-01-01 00:00:00.0001',
                '9999-12-31 23:59:59.9999',
                '0123-01-01',
                '0042-01-01',
                '-0016-01-01',
                '-0016-01-01 12:34:56.7891',
                '-0456-07-23 16:22'
            ].forEach(function(v) {
                expect(Lib.ms2DateTime(Lib.dateTime2ms(v))).toBe(v);
            });
        });

        it('should not accept Date objects beyond our limits or other objects', function() {
            [
                Date.UTC(10000, 0, 1),
                Date.UTC(-10000, 11, 31, 23, 59, 59, 999),
                '',
                '2016-01-01',
                '0',
                [], [0], {}, {1: 2}
            ].forEach(function(v) {
                expect(Lib.ms2DateTime(v)).toBeUndefined(v);
            });
        });

        it('should drop the right pieces if rounding is specified', function() {
            [
                ['2016-01-01 00:00:00.0001', 0, '2016-01-01 00:00:00.0001'],
                ['2016-01-01 00:00:00.0001', 299999, '2016-01-01 00:00:00.0001'],
                ['2016-01-01 00:00:00.0001', 300000, '2016-01-01'],
                ['2016-01-01 00:00:00.0001', 7776000000, '2016-01-01'],
                ['2016-01-01 12:34:56.7891', 0, '2016-01-01 12:34:56.7891'],
                ['2016-01-01 12:34:56.7891', 299999, '2016-01-01 12:34:56.7891'],
                ['2016-01-01 12:34:56.7891', 300000, '2016-01-01 12:34:56'],
                ['2016-01-01 12:34:56.7891', 10799999, '2016-01-01 12:34:56'],
                ['2016-01-01 12:34:56.7891', 10800000, '2016-01-01 12:34'],
                ['2016-01-01 12:34:56.7891', 7775999999, '2016-01-01 12:34'],
                ['2016-01-01 12:34:56.7891', 7776000000, '2016-01-01'],
                ['2016-01-01 12:34:56.7891', 1e300, '2016-01-01']
            ].forEach(function(v) {
                expect(Lib.ms2DateTime(Lib.dateTime2ms(v[0]), v[1])).toBe(v[2], v);
            });
        });

        it('should work right with inputs beyond our precision', function() {
            for(var i = -1; i <= 1; i += 0.001) {
                var tenths = Math.round(i * 10),
                    base = i < -0.05 ? '1969-12-31 23:59:59.99' : '1970-01-01 00:00:00.00',
                    expected = (base + String(tenths + 200).substr(1))
                        .replace(/0+$/, '')
                        .replace(/ 00:00:00[\.]$/, '');
                expect(Lib.ms2DateTime(i)).toBe(expected, i);
            }
        });
    });

    describe('world calendar inputs', function() {
        it('should give the right values near epoch zero', function() {
            [
                [undefined, '1970-01-01'],
                ['gregorian', '1970-01-01'],
                ['chinese', '1969-11-24'],
                ['coptic', '1686-04-23'],
                ['discworld', '1798-12-27'],
                ['ethiopian', '1962-04-23'],
                ['hebrew', '5730-10-23'],
                ['islamic', '1389-10-22'],
                ['julian', '1969-12-19'],
                ['mayan', '5156-07-05'],
                ['nanakshahi', '0501-10-19'],
                ['nepali', '2026-09-17'],
                ['persian', '1348-10-11'],
                ['jalali', '1348-10-11'],
                ['taiwan', '0059-01-01'],
                ['thai', '2513-01-01'],
                ['ummalqura', '1389-10-23']
            ].forEach(function(v) {
                var calendar = v[0],
                    dateStr = v[1];
                expect(Lib.ms2DateTime(0, 0, calendar)).toBe(dateStr, calendar);
                expect(Lib.dateTime2ms(dateStr, calendar)).toBe(0, calendar);

                var expected_p1ms = dateStr + ' 00:00:00.0001',
                    expected_1s = dateStr + ' 00:00:01',
                    expected_1m = dateStr + ' 00:01',
                    expected_1h = dateStr + ' 01:00',
                    expected_lastinstant = dateStr + ' 23:59:59.9999';

                var oneSec = 1000,
                    oneMin = 60 * oneSec,
                    oneHour = 60 * oneMin,
                    lastInstant = 24 * oneHour - 0.1;

                expect(Lib.ms2DateTime(0.1, 0, calendar)).toBe(expected_p1ms, calendar);
                expect(Lib.ms2DateTime(oneSec, 0, calendar)).toBe(expected_1s, calendar);
                expect(Lib.ms2DateTime(oneMin, 0, calendar)).toBe(expected_1m, calendar);
                expect(Lib.ms2DateTime(oneHour, 0, calendar)).toBe(expected_1h, calendar);
                expect(Lib.ms2DateTime(lastInstant, 0, calendar)).toBe(expected_lastinstant, calendar);

                expect(Lib.dateTime2ms(expected_p1ms, calendar)).toBe(0.1, calendar);
                expect(Lib.dateTime2ms(expected_1s, calendar)).toBe(oneSec, calendar);
                expect(Lib.dateTime2ms(expected_1m, calendar)).toBe(oneMin, calendar);
                expect(Lib.dateTime2ms(expected_1h, calendar)).toBe(oneHour, calendar);
                expect(Lib.dateTime2ms(expected_lastinstant, calendar)).toBe(lastInstant, calendar);
            });
        });

        it('should contain canonical ticks sundays, ranges for all calendars', function() {
            var calList = Object.keys(calendars.calendars).filter(function(v) {
                return v !== 'gregorian';
            });

            var canonicalTick = calComponent.CANONICAL_TICK,
                canonicalSunday = calComponent.CANONICAL_SUNDAY,
                dfltRange = calComponent.DFLTRANGE;
            expect(Object.keys(canonicalTick).length).toBe(calList.length);
            expect(Object.keys(canonicalSunday).length).toBe(calList.length);
            expect(Object.keys(dfltRange).length).toBe(calList.length);

            calList.forEach(function(calendar) {
                expect(Lib.dateTime2ms(canonicalTick[calendar], calendar)).toBeDefined(calendar);
                var sunday = Lib.dateTime2ms(canonicalSunday[calendar], calendar);
                // convert back implicitly with gregorian calendar
                expect(Lib.formatDate(sunday, '%A')).toBe('Sunday', calendar);

                expect(Lib.dateTime2ms(dfltRange[calendar][0], calendar)).toBeDefined(calendar);
                expect(Lib.dateTime2ms(dfltRange[calendar][1], calendar)).toBeDefined(calendar);
            });
        });

        it('should handle Chinese intercalary months correctly', function() {
            var intercalaryDates = [
                '1995-08i-01',
                '1995-08i-29',
                '1984-10i-15',
                '2023-02i-29'
            ];
            intercalaryDates.forEach(function(v) {
                var ms = Lib.dateTime2ms(v, 'chinese');
                expect(Lib.ms2DateTime(ms, 0, 'chinese')).toBe(v);

                // should also work without leading zeros
                var vShort = v.replace(/-0/g, '-');
                expect(Lib.dateTime2ms(vShort, 'chinese')).toBe(ms, vShort);
            });

            var badIntercalaryDates = [
                '1995-07i-01',
                '1995-08i-30',
                '1995-09i-01'
            ];
            badIntercalaryDates.forEach(function(v) {
                expect(Lib.dateTime2ms(v, 'chinese')).toBeUndefined(v);
            });
        });
    });

    describe('cleanDate', function() {
        it('should convert numbers or js Dates to strings based on local TZ', function() {
            [
                new Date(0),
                new Date(2000),
                new Date(2000, 0, 1),
                new Date(),
                new Date(-9999, 0, 3), // we lose one day of range +/- tzoffset this way
                new Date(9999, 11, 29, 23, 59, 59, 999)
            ].forEach(function(v) {
                var expected = Lib.ms2DateTime(Lib.dateTime2ms(v));
                expect(typeof expected).toBe('string');
                expect(Lib.cleanDate(v)).toBe(expected);
                expect(Lib.cleanDate(+v)).toBe(expected);
                expect(Lib.cleanDate(v, '2000-01-01')).toBe(expected);
            });
        });

        it('should fail numbers & js Dates out of range, and other bad objects', function() {
            [
                new Date(-20000, 0, 1),
                new Date(20000, 0, 1),
                new Date('fail'),
                undefined, null, NaN,
                [], {}, [0], {1: 2}, '',
                '2001-02-29'  // not a leap year
            ].forEach(function(v) {
                expect(Lib.cleanDate(v)).toBeUndefined();
                if(!isNumeric(+v)) expect(Lib.cleanDate(+v)).toBeUndefined();
                expect(Lib.cleanDate(v, '2000-01-01')).toBe('2000-01-01');
            });
        });

        it('should not alter valid date strings, even to truncate them', function() {
            [
                '2000',
                '2000-01',
                '2000-01-01',
                '2000-01-01 00',
                '2000-01-01 00:00',
                '2000-01-01 00:00:00',
                '2000-01-01 00:00:00.0',
                '2000-01-01 00:00:00.00',
                '2000-01-01 00:00:00.000',
                '2000-01-01 00:00:00.0000',
                '9999-12-31 23:59:59.9999',
                '-9999-01-01 00:00:00.0000',
                '99-01-01',
                '00-01-01'
            ].forEach(function(v) {
                expect(Lib.cleanDate(v)).toBe(v);
            });
        });
    });

    describe('incrementMonth', function() {
        it('should include Chinese intercalary months', function() {
            var start = '1995-06-01';
            var expected = [
                '1995-07-01',
                '1995-08-01',
                '1995-08i-01',
                '1995-09-01',
                '1995-10-01',
                '1995-11-01',
                '1995-12-01',
                '1996-01-01'
            ];
            var tick = Lib.dateTime2ms(start, 'chinese');
            expected.forEach(function(v) {
                tick = Lib.incrementMonth(tick, 1, 'chinese');
                expect(tick).toBe(Lib.dateTime2ms(v, 'chinese'), v);
            });
        });

        it('should increment years even over leap years', function() {
            var start = '1995-06-01';
            var expected = [
                '1996-06-01',
                '1997-06-01',
                '1998-06-01',
                '1999-06-01',
                '2000-06-01',
                '2001-06-01',
                '2002-06-01',
                '2003-06-01',
                '2004-06-01',
                '2005-06-01',
                '2006-06-01',
                '2007-06-01',
                '2008-06-01'
            ];
            var tick = Lib.dateTime2ms(start, 'chinese');
            expected.forEach(function(v) {
                tick = Lib.incrementMonth(tick, 12, 'chinese');
                expect(tick).toBe(Lib.dateTime2ms(v, 'chinese'), v);
            });
        });
    });

    describe('isJSDate', function() {
        it('should return true for any Date object but not the equivalent numbers', function() {
            [
                new Date(),
                new Date(0),
                new Date(-9900, 1, 2, 3, 4, 5, 6),
                new Date(9900, 1, 2, 3, 4, 5, 6),
                new Date(-20000, 0, 1), new Date(20000, 0, 1), // outside our range, still true
                new Date('fail') // `Invalid Date` is still a Date
            ].forEach(function(v) {
                expect(Lib.isJSDate(v)).toBe(true);
                expect(Lib.isJSDate(+v)).toBe(false);
            });
        });

        it('should return false for anything thats not explicitly a JS Date', function() {
            [
                0, NaN, null, undefined, '', {}, [], [0], [2016, 0, 1],
                '2016-01-01', '2016-01-01 12:34:56', '2016-01-01 12:34:56.789',
                'Thu Oct 20 2016 15:35:14 GMT-0400 (EDT)',
                // getting really close to a hack of our test... we look for getTime to be a function
                {getTime: 4}
            ].forEach(function(v) {
                expect(Lib.isJSDate(v)).toBe(false);
            });
        });
    });

    describe('formatDate', function() {
        function assertFormatRounds(ms, calendar, results) {
            ['y', 'm', 'd', 'M', 'S', 1, 2, 3, 4].forEach(function(tr, i) {
                expect(Lib.formatDate(ms, '', tr, calendar))
                    .toBe(results[i], calendar);
            });
        }

        it('should pick a format based on tickround if no format is provided', function() {
            var ms = Lib.dateTime2ms('2012-08-13 06:19:34.5678');
            assertFormatRounds(ms, 'gregorian', [
                '2012',
                'Aug 2012',
                'Aug 13\n2012',
                '06:19\nAug 13, 2012',
                '06:19:35\nAug 13, 2012',
                '06:19:34.6\nAug 13, 2012',
                '06:19:34.57\nAug 13, 2012',
                '06:19:34.568\nAug 13, 2012',
                '06:19:34.5678\nAug 13, 2012'
            ]);

            // and for world calendars - in coptic this is 1728-12-07 (month=Meso)
            assertFormatRounds(ms, 'coptic', [
                '1728',
                'Meso 1728',
                'Meso 7\n1728',
                '06:19\nMeso 7, 1728',
                '06:19:35\nMeso 7, 1728',
                '06:19:34.6\nMeso 7, 1728',
                '06:19:34.57\nMeso 7, 1728',
                '06:19:34.568\nMeso 7, 1728',
                '06:19:34.5678\nMeso 7, 1728'
            ]);
        });

        it('should accept custom formats using d3 specs even for world cals', function() {
            var ms = Lib.dateTime2ms('2012-08-13 06:19:34.5678');
            [
                // some common formats (plotly workspace options)
                ['%Y-%m-%d', '2012-08-13', '1728-12-07'],
                ['%H:%M:%S', '06:19:34', '06:19:34'],
                ['%Y-%m-%e %H:%M:%S', '2012-08-13 06:19:34', '1728-12-7 06:19:34'],
                ['%A, %b %e', 'Monday, Aug 13', 'Pesnau, Meso 7'],

                // test padding behavior
                // world doesn't support space-padded (yet?)
                ['%Y-%_m-%_d', '2012- 8-13', '1728-12-7'],
                ['%Y-%-m-%-d', '2012-8-13', '1728-12-7'],

                // and some strange ones to cover all fields
                ['%a%j!%-j', 'Mon226!226', 'Pes337!337'],
                [
                    '%W or un or space padded-> %-W,%_W',
                    '33 or un or space padded-> 33,33',
                    '48 or un or space padded-> 48,48'
                ],
                [
                    '%B \'%y WOY:%U DOW:%w',
                    'August \'12 WOY:32 DOW:1',
                    'Mesori \'28 WOY:## DOW:##' // world-cals doesn't support U or w
                ],
                [
                    '%c && %x && .%2f .%f', // %<n>f is our addition
                    'Mon Aug 13 06:19:34 2012 && 08/13/2012 && .57 .5678',
                    'Pes Meso 7 06:19:34 1728 && 12/07/1728 && .57 .5678'
                ]

            ].forEach(function(v) {
                var fmt = v[0],
                    expectedGregorian = v[1],
                    expectedCoptic = v[2];

                // tickround is irrelevant here...
                expect(Lib.formatDate(ms, fmt, 'y'))
                    .toBe(expectedGregorian, fmt);
                expect(Lib.formatDate(ms, fmt, 4, 'gregorian'))
                    .toBe(expectedGregorian, fmt);
                expect(Lib.formatDate(ms, fmt, 'y', 'coptic'))
                    .toBe(expectedCoptic, fmt);
            });
        });

        it('should not round up to 60 seconds', function() {
            // see note in dates.js -> formatTime about this rounding
            assertFormatRounds(-0.1, 'gregorian', [
                '1969',
                'Dec 1969',
                'Dec 31\n1969',
                '23:59\nDec 31, 1969',
                '23:59:59\nDec 31, 1969',
                '23:59:59.9\nDec 31, 1969',
                '23:59:59.99\nDec 31, 1969',
                '23:59:59.999\nDec 31, 1969',
                '23:59:59.9999\nDec 31, 1969'
            ]);

            // in coptic this is Koi 22, 1686
            assertFormatRounds(-0.1, 'coptic', [
                '1686',
                'Koi 1686',
                'Koi 22\n1686',
                '23:59\nKoi 22, 1686',
                '23:59:59\nKoi 22, 1686',
                '23:59:59.9\nKoi 22, 1686',
                '23:59:59.99\nKoi 22, 1686',
                '23:59:59.999\nKoi 22, 1686',
                '23:59:59.9999\nKoi 22, 1686'
            ]);

            // and using the custom format machinery
            expect(Lib.formatDate(-0.1, '%Y-%m-%d %H:%M:%S.%f'))
                .toBe('1969-12-31 23:59:59.9999');
            expect(Lib.formatDate(-0.1, '%Y-%m-%d %H:%M:%S.%f', null, 'coptic'))
                .toBe('1686-04-22 23:59:59.9999');

        });

        it('should remove extra fractional second zeros', function() {
            expect(Lib.formatDate(0.1, '', 4)).toBe('00:00:00.0001\nJan 1, 1970');
            expect(Lib.formatDate(0.1, '', 3)).toBe('00:00:00\nJan 1, 1970');
            expect(Lib.formatDate(0.1, '', 0)).toBe('00:00:00\nJan 1, 1970');
            expect(Lib.formatDate(0.1, '', 'S')).toBe('00:00:00\nJan 1, 1970');
            expect(Lib.formatDate(0.1, '', 3, 'coptic'))
                .toBe('00:00:00\nKoi 23, 1686');

            // because the decimal point is explicitly part of the format
            // string here, we can't remove it OR the very first zero after it.
            expect(Lib.formatDate(0.1, '%S.%f')).toBe('00.0001');
            expect(Lib.formatDate(0.1, '%S.%3f')).toBe('00.0');
        });

    });
});
