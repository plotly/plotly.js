var isNumeric = require('fast-isnumeric');
var Lib = require('@src/lib');

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
                // first century, also allow month, day, and hour to be 1-digit, and not all
                // three digits of milliseconds
                ['0013-1-1 1:00:00.6', d1c],
                // we support more than 4 digits too, though Date objects don't. More than that
                // and we hit the precision limit of js numbers unless we're close to the epoch.
                // It won't break though.
                ['0013-1-1 1:00:00.6001', +d1c + 0.1],

                // 2-digit years get mapped to now-70 -> now+29
                [thisYear_2 + '-05', new Date(thisYear, 4, 1)],
                [nowMinus70_2 + '-10-18', new Date(nowMinus70, 9, 18)],
                [nowPlus29_2 + '-02-12 14:29:32', new Date(nowPlus29, 1, 12, 14, 29, 32)]
            ].forEach(function(v) {
                expect(Lib.dateTime2ms(v[0])).toBe(+v[1], v[0]);
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
                expect(Lib.dateTime2ms(v)).toBe(+(new Date(v, 0, 1)), v);
            });

            [
                [10, 2010],
                [nowPlus29_2, nowPlus29],
                [nowMinus70_2, nowMinus70],
                [99, 1999]
            ].forEach(function(v) {
                expect(Lib.dateTime2ms(v[0])).toBe(+(new Date(v[1], 0, 1)), v[0]);
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
                expect(Lib.dateTime2ms(v)).toBe(+v);
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
                '2015-01-01 12:00:60', '2015-01-01 12:00:-1', '2015-01-01 12:00:001', '2015-01-01 12:00:1' // bad second
            ].forEach(function(v) {
                expect(Lib.dateTime2ms(v)).toBeUndefined(v);
            });
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
                +(new Date(10000, 0, 1)),
                +(new Date(-10000, 11, 31, 23, 59, 59, 999)),
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
    });

    describe('cleanDate', function() {
        it('should convert any number or js Date within range to a date string', function() {
            [
                new Date(0),
                new Date(2000),
                new Date(2000, 0, 1),
                new Date(),
                new Date(-9999, 0, 1),
                new Date(9999, 11, 31, 23, 59, 59, 999)
            ].forEach(function(v) {
                expect(typeof Lib.ms2DateTime(+v)).toBe('string');
                expect(Lib.cleanDate(v)).toBe(Lib.ms2DateTime(+v));
                expect(Lib.cleanDate(+v)).toBe(Lib.ms2DateTime(+v));
                expect(Lib.cleanDate(v, '2000-01-01')).toBe(Lib.ms2DateTime(+v));
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
});
