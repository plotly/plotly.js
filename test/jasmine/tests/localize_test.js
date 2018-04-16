var Lib = require('@src/lib');
var _ = Lib._;
var Registry = require('@src/registry');

var d3 = require('d3');

var Plotly = require('@lib');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

describe('localization', function() {
    'use strict';

    var gd;
    var preregisteredLocales;

    beforeEach(function() {
        gd = createGraphDiv();

        // empty out any locales we might register by default
        // we always need `en` format as it's the fallback
        preregisteredLocales = Registry.localeRegistry;
        Registry.localeRegistry = {en: {format: preregisteredLocales.en.format}};
    });

    afterEach(function() {
        destroyGraphDiv();
        Registry.localeRegistry = preregisteredLocales;
    });

    function plot(locale, locales) {
        var config = {};
        if(locale) config.locale = locale;
        if(locales) config.locales = locales;

        return Plotly.newPlot(gd, [{x: ['2001-01-01', '2002-01-01'], y: [0.5, 3.5]}], {}, config);
    }

    function firstXLabel() {
        return d3.select(gd).select('.xtick').text();
    }

    function firstYLabel() {
        return d3.select(gd).select('.ytick').text();
    }

    var monthNums = ['!1', '!2', '!3', '!4', '!5', '!6', '!7', '!8', '!9', '!10', '!11', '!12'];
    var monthLetters = ['j', 'f', 'm', 'a', 'm', 'j', 'j', 'a', 's', 'o', 'n', 'd'];
    var dayLetters = ['s', 'm', 't', 'w', 't', 'f', 's'];

    it('uses the input string and standard formats if no locales are provided', function(done) {
        plot()
        .then(function() {
            ['a', 'list of', 'Test strings 234!!!'].forEach(function(s) {
                expect(_(gd, s)).toBe(s);
            });
            expect(firstXLabel()).toBe('Jan 2001');
            expect(firstYLabel()).toBe('0.5');
        })
        .catch(failTest)
        .then(done);
    });

    function getLabels(axLetter) {
        var out = [];
        var s = d3.select(gd).selectAll('.' + axLetter + 'tick');
        s.each(function() { out.push(d3.select(this).text()); });
        return out;
    }

    it('contains all short and long day and month names in the default locale', function(done) {
        Plotly.newPlot(gd, [{
            x: ['2000-01-01', '2000-12-01'],
            y: ['2000-01-02', '2000-01-08'],
            mode: 'markers'
        }], {
            xaxis: {dtick: 'M1', tickformat: '%b'},
            yaxis: {dtick: 1000 * 3600 * 24, tickformat: '%a'}
        })
        .then(function() {
            expect(getLabels('x')).toEqual([
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ]);
            expect(getLabels('y')).toEqual([
                'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
            ]);

            return Plotly.relayout(gd, {
                'xaxis.tickformat': '%B',
                'yaxis.tickformat': '%A'
            });
        })
        .then(function() {
            expect(getLabels('x')).toEqual([
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ]);
            expect(getLabels('y')).toEqual([
                'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
            ]);
        })
        .catch(failTest)
        .then(done);
    });

    it('contains correct periods, dateTime, date, and time fields in the default locale', function(done) {
        Plotly.newPlot(gd, [{
            x: ['2000-01-01 11:00', '2000-01-01 13:00'],
            y: ['2000-01-01 23:00', '2000-01-02 01:00'],
            mode: 'markers'
        }], {
            xaxis: {dtick: 1000 * 3600, tickformat: '%-I %p'},
            yaxis: {dtick: 1000 * 3600, tickformat: '%-I %p'}
        })
        .then(function() {
            expect(getLabels('x')).toEqual(['11 AM', '12 PM', '1 PM']);
            expect(getLabels('y')).toEqual(['11 PM', '12 AM', '1 AM']);

            return Plotly.relayout(gd, {
                'xaxis.tickformat': '%c',
                'yaxis.tickformat': '%x~%X'
            });
        })
        .then(function() {
            expect(getLabels('x')).toEqual([
                'Sat Jan  1 11:00:00 2000', 'Sat Jan  1 12:00:00 2000', 'Sat Jan  1 13:00:00 2000'
            ]);
            expect(getLabels('y')).toEqual([
                // here we're using British English, so day/month/year
                '01/01/2000~23:00:00', '02/01/2000~00:00:00', '02/01/2000~01:00:00'
            ]);

            Plotly.register(require('@src/locale-en-us'));
            return Plotly.redraw(gd);
        })
        .then(function() {
            expect(getLabels('x')).toEqual([
                'Sat Jan  1 11:00:00 2000', 'Sat Jan  1 12:00:00 2000', 'Sat Jan  1 13:00:00 2000'
            ]);
            expect(getLabels('y')).toEqual([
                // now with the US version
                '01/01/2000~23:00:00', '01/02/2000~00:00:00', '01/02/2000~01:00:00'
            ]);
        })
        .catch(failTest)
        .then(done);
    });

    it('uses the region first, then language (registered case)', function(done) {
        plot('eg-AU')
        .then(function() {
            expect(_(gd, 'dollar')).toBe('dollar');

            // "en-GB" is registered first, so it gets copied into the base "en"
            Plotly.register({
                moduleType: 'locale',
                name: 'eg-GB',
                dictionary: {dollar: 'pound'},
                format: {decimal: 'D'}
            });
            Plotly.register({
                moduleType: 'locale',
                name: 'eg-US',
                dictionary: {dollar: 'greenback', cent: 'penny'},
                format: {decimal: 'P', shortMonths: monthNums}
            });

            expect(_(gd, 'dollar')).toBe('pound');
            // copying to the base happens at the dictionary level, so items missing
            // from the first dictionary will not be picked up from later ones
            expect(_(gd, 'cent')).toBe('cent');

            // formatting changes need a redraw
            expect(firstXLabel()).toBe('Jan 2001');
            expect(firstYLabel()).toBe('0.5');
            Plotly.redraw(gd);
            expect(firstXLabel()).toBe('Jan 2001');
            expect(firstYLabel()).toBe('0D5');

            // "eg-AU" is exactly what we're looking for.
            Plotly.register({
                moduleType: 'locale',
                name: 'eg-AU',
                dictionary: {dollar: 'dollah'},
                format: {decimal: '~', shortMonths: monthNums}
            });

            expect(_(gd, 'dollar')).toBe('dollah');
            expect(_(gd, 'cent')).toBe('cent');

            Plotly.redraw(gd);
            expect(firstXLabel()).toBe('!1 2001');
            expect(firstYLabel()).toBe('0~5');
        })
        .catch(failTest)
        .then(done);
    });

    it('gives higher precedence to region than context vs registered', function(done) {
        // four locales, highest to lowest priority
        // hopefully nobody will supply this many conflicting locales, but
        // if they do, this is what should happen!
        var ctx_fr_QC = {
            dictionary: {a: 'a-ctx-QC'},
            format: {decimal: '~'}
        };
        Plotly.register({
            moduleType: 'locale',
            name: 'fr-QC',
            dictionary: {a: 'a-reg-QC', b: 'b-reg-QC'},
            format: {decimal: 'X', thousands: '@'}
        });
        var ctx_fr = {
            dictionary: {a: 'a-ctx', b: 'b-ctx', c: 'c-ctx'},
            format: {decimal: 'X', thousands: 'X', shortMonths: monthNums}
        };
        Plotly.register({
            moduleType: 'locale',
            name: 'fr',
            dictionary: {a: 'a-reg', b: 'b-reg', c: 'c-reg', d: 'd-reg'},
            format: {decimal: 'X', thousands: 'X', shortMonths: monthLetters, shortDays: dayLetters}
        });

        plot('fr-QC', {fr: ctx_fr, 'fr-QC': ctx_fr_QC})
        .then(function() {
            expect(_(gd, 'a')).toBe('a-ctx-QC');
            expect(_(gd, 'b')).toBe('b-reg-QC');
            expect(_(gd, 'c')).toBe('c-ctx');
            expect(_(gd, 'd')).toBe('d-reg');
            expect(_(gd, 'e')).toBe('e');

            expect(gd._fullLayout.separators).toBe('~@');
            expect(firstXLabel()).toBe('!1 2001');
            expect(firstYLabel()).toBe('0~5');
            var d0 = new Date(0); // thursday, Jan 1 1970 (UTC)
            // sanity check that d0 is what we think...
            expect(d3.time.format.utc('%a %b %A %B')(d0)).toBe('Thu Jan Thursday January');
            // full names were not overridden, so fall back on english
            expect(gd._fullLayout.xaxis._dateFormat('%a %b %A %B')(d0)).toBe('t !1 Thursday January');
        })
        .catch(failTest)
        .then(done);
    });

    it('does not generate an automatic base locale in context', function(done) {
        plot('fr', {'fr-QC': {
            dictionary: {fries: 'poutine'},
            format: {decimal: '^', shortMonths: monthNums}
        }})
        .then(function() {
            expect(_(gd, 'fries')).toBe('fries');
            expect(firstXLabel()).toBe('Jan 2001');
            expect(firstYLabel()).toBe('0.5');
        })
        .catch(failTest)
        .then(done);
    });

    it('allows registering dictionary and format separately without overwriting the other', function() {
        expect(Registry.localeRegistry.es).toBeUndefined();

        var d1 = {I: 'Yo'};
        var f1 = {decimal: 'ñ'};
        var d2 = {You: 'Tú'};
        var f2 = {thousands: '¿'};

        Plotly.register({
            moduleType: 'locale',
            name: 'es',
            dictionary: d1,
            format: f1
        });

        expect(Registry.localeRegistry.es.dictionary).toBe(d1);
        expect(Registry.localeRegistry.es.format).toBe(f1);

        Plotly.register({
            moduleType: 'locale',
            name: 'es',
            dictionary: d2
        });

        expect(Registry.localeRegistry.es.dictionary).toBe(d2);
        expect(Registry.localeRegistry.es.format).toBe(f1);

        Plotly.register({
            moduleType: 'locale',
            name: 'es',
            format: f2
        });

        expect(Registry.localeRegistry.es.dictionary).toBe(d2);
        expect(Registry.localeRegistry.es.format).toBe(f2);
    });

    it('uses number format for default but still supports explicit layout.separators', function(done) {
        plot('da', {da: {format: {decimal: 'D', thousands: 'T'}}})
        .then(function() {
            expect(firstYLabel()).toBe('0D5');
            expect(gd._fullLayout.separators).toBe('DT');

            return Plotly.relayout(gd, {separators: 'p#'});
        })
        .then(function() {
            expect(firstYLabel()).toBe('0p5');

            return Plotly.relayout(gd, {'yaxis.tickformat': '.3f'});
        })
        .then(function() {
            expect(firstYLabel()).toBe('0p500');

            return Plotly.relayout(gd, {separators: null});
        })
        .then(function() {
            expect(firstYLabel()).toBe('0D500');
        })
        .catch(failTest)
        .then(done);
    });

    it('uses extraFormat to localize the autoFormatted x-axis date tick', function(done) {
        plot('test')
            .then(function() {
                // test format.month
                expect(firstXLabel()).toBe('Jan 2001');
                return Plotly.update(gd, {x: [['2001-01-01', '2001-02-01']]});
            })
            .then(function() {
                // test format.dayMonth & format.year
                expect(firstXLabel()).toBe('Dec 312000');

                return Plotly.update(gd, {x: [['2001-01-01', '2001-01-02']]});
            })
            .then(function() {
                // test format.dayMonthYear
                expect(firstXLabel()).toBe('00:00Jan 1, 2001');

                Plotly.register({
                    moduleType: 'locale',
                    name: 'test',
                    format: {
                        year: 'Y%Y',
                        month: '%Y %b',
                        dayMonth: '%-d %b',
                        dayMonthYear: '%-d %b %Y'
                    }
                });

                return Plotly.update(gd, {x: [['2001-01-01', '2002-01-01']]});
            })
            .then(function() {
                // test format.month
                expect(firstXLabel()).toBe('2001 Jan');

                return Plotly.update(gd, {x: [['2001-01-01', '2001-02-01']]});
            })
            .then(function() {
                // test format.dayMonth & format.year
                expect(firstXLabel()).toBe('31 DecY2000');

                return Plotly.update(gd, {x: [['2001-01-01', '2001-01-02']]});
            })
            .then(function() {
                // test format.dayMonthYear
                expect(firstXLabel()).toBe('00:001 Jan 2001');
            })
            .catch(failTest)
            .then(done);
    });
});
