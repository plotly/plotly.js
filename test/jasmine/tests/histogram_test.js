var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var supplyDefaults = require('@src/traces/histogram/defaults');
var calc = require('@src/traces/histogram/calc');


describe('Test histogram', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn,
            traceOut;

        beforeEach(function() {
            traceOut = {};
        });

        it('should set visible to false when x or y is empty', function() {
            traceIn = {
                x: []
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);

            traceIn = {
                y: []
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);
        });

        it('should set visible to false when type is histogram2d and x or y are empty', function() {
            traceIn = {
                type: 'histogram2d',
                x: [],
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);

            traceIn = {
                type: 'histogram2d',
                x: [1, 2, 2],
                y: []
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);

            traceIn = {
                type: 'histogram2d',
                x: [],
                y: []
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);

            traceIn = {
                type: 'histogram2dcontour',
                x: [],
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);
        });

        it('should set orientation to v by default', function() {
            traceIn = {
                x: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.orientation).toBe('v');

            traceIn = {
                x: [1, 2, 2],
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.orientation).toBe('v');
        });

        it('should set orientation to h when only y is supplied', function() {
            traceIn = {
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.orientation).toBe('h');

        });

        // coercing bin attributes got moved to calc because it needs
        // axis type - so here we just test that it's NOT happening

        it('should not coerce autobinx regardless of xbins', function() {
            traceIn = {
                x: [1, 2, 2],
                xbins: {
                    start: 1,
                    end: 3,
                    size: 1
                }
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.autobinx).toBeUndefined();

            traceIn = {
                x: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.autobinx).toBeUndefined();
        });

        it('should not coerce autobiny regardless of ybins', function() {
            traceIn = {
                y: [1, 2, 2],
                ybins: {
                    start: 1,
                    end: 3,
                    size: 1
                }
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.autobiny).toBeUndefined();

            traceIn = {
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.autobiny).toBeUndefined();
        });

        it('should inherit layout.calendar', function() {
            traceIn = {
                x: [1, 2, 3]
            };
            supplyDefaults(traceIn, traceOut, '', {calendar: 'islamic'});

            // we always fill calendar attributes, because it's hard to tell if
            // we're on a date axis at this point.
            // size axis calendar is weird, but *might* be able to happen if
            // we're using histfunc=min or max (does this work?)
            expect(traceOut.xcalendar).toBe('islamic');
            expect(traceOut.ycalendar).toBe('islamic');
        });

        it('should take its own calendars', function() {
            traceIn = {
                x: [1, 2, 3],
                xcalendar: 'coptic',
                ycalendar: 'nepali'
            };
            supplyDefaults(traceIn, traceOut, '', {calendar: 'islamic'});

            expect(traceOut.xcalendar).toBe('coptic');
            expect(traceOut.ycalendar).toBe('nepali');
        });
    });


    describe('calc', function() {
        function _calc(opts) {
            var base = { type: 'histogram' },
                trace = Lib.extendFlat({}, base, opts),
                gd = { data: [trace] };

            Plots.supplyDefaults(gd);
            var fullTrace = gd._fullData[0];

            var out = calc(gd, fullTrace);
            delete out[0].trace;
            return out;
        }

        var oneDay = 24 * 3600000;

        it('should handle auto dates with nonuniform (month) bins', function() {
            // All data on exact years: shift so bin center is an
            // exact year, except on leap years
            var out = _calc({
                x: ['1970-01-01', '1970-01-01', '1971-01-01', '1973-01-01'],
                nbinsx: 4
            });

            // TODO: this gives half-day gaps between all but the first two
            // bars. Now that we have explicit per-bar positioning, perhaps
            // we should fill the space, rather than insisting on equal-width
            // bars?
            expect(out).toEqual([
                // full calcdata has x and y too (and t in the first one),
                // but those come later from setPositions.
                {b: 0, p: Date.UTC(1970, 0, 1), s: 2},
                {b: 0, p: Date.UTC(1971, 0, 1), s: 1},
                {b: 0, p: Date.UTC(1972, 0, 1, 12), s: 0},
                {b: 0, p: Date.UTC(1973, 0, 1), s: 1}
            ]);

            // All data on exact months: shift so bin center is on (31-day months)
            // or in (shorter months) that month
            out = _calc({
                x: ['1970-01-01', '1970-01-01', '1970-02-01', '1970-04-01'],
                nbinsx: 4
            });

            expect(out).toEqual([
                {b: 0, p: Date.UTC(1970, 0, 1), s: 2},
                {b: 0, p: Date.UTC(1970, 1, 1), s: 1},
                {b: 0, p: Date.UTC(1970, 2, 2, 12), s: 0},
                {b: 0, p: Date.UTC(1970, 3, 1), s: 1}
            ]);

            // data on exact days: shift so each bin goes from noon to noon
            // even though this gives kind of odd bin centers since the bins
            // are months... but the important thing is it's unambiguous which
            // bin any given day is in.
            out = _calc({
                x: ['1970-01-02', '1970-01-31', '1970-02-13', '1970-04-19'],
                nbinsx: 4
            });

            expect(out).toEqual([
                // dec 31 12:00 -> jan 31 12:00, middle is jan 16
                {b: 0, p: Date.UTC(1970, 0, 16), s: 2},
                // jan 31 12:00 -> feb 28 12:00, middle is feb 14 12:00
                {b: 0, p: Date.UTC(1970, 1, 14, 12), s: 1},
                {b: 0, p: Date.UTC(1970, 2, 16), s: 0},
                {b: 0, p: Date.UTC(1970, 3, 15, 12), s: 1}
            ]);
        });

        it('should handle auto dates with uniform (day) bins', function() {
            var out = _calc({
                x: ['1970-01-01', '1970-01-01', '1970-01-02', '1970-01-04'],
                nbinsx: 4
            });

            var x0 = 0,
                x1 = x0 + oneDay,
                x2 = x1 + oneDay,
                x3 = x2 + oneDay;

            expect(out).toEqual([
                {b: 0, p: x0, s: 2},
                {b: 0, p: x1, s: 1},
                {b: 0, p: x2, s: 0},
                {b: 0, p: x3, s: 1}
            ]);
        });

        describe('cumulative distribution functions', function() {
            var base = {
                x: [0, 5, 10, 15, 5, 10, 15, 10, 15, 15],
                y: [2, 2, 2, 14, 6, 6, 6, 10, 10, 2]
            };

            it('makes the right base histogram', function() {
                var baseOut = _calc(base);
                expect(baseOut).toEqual([
                    {b: 0, p: 2, s: 1},
                    {b: 0, p: 7, s: 2},
                    {b: 0, p: 12, s: 3},
                    {b: 0, p: 17, s: 4},
                ]);
            });

            var CDFs = [
                {p: [2, 7, 12, 17], s: [1, 3, 6, 10]},
                {
                    direction: 'decreasing',
                    p: [2, 7, 12, 17], s: [10, 9, 7, 4]
                },
                {
                    currentbin: 'exclude',
                    p: [7, 12, 17, 22], s: [1, 3, 6, 10]
                },
                {
                    direction: 'decreasing', currentbin: 'exclude',
                    p: [-3, 2, 7, 12], s: [10, 9, 7, 4]
                },
                {
                    currentbin: 'half',
                    p: [2, 7, 12, 17, 22], s: [0.5, 2, 4.5, 8, 10]
                },
                {
                    direction: 'decreasing', currentbin: 'half',
                    p: [-3, 2, 7, 12, 17], s: [10, 9.5, 8, 5.5, 2]
                },
                {
                    direction: 'decreasing', currentbin: 'half', histnorm: 'percent',
                    p: [-3, 2, 7, 12, 17], s: [100, 95, 80, 55, 20]
                },
                {
                    currentbin: 'exclude', histnorm: 'probability',
                    p: [7, 12, 17, 22], s: [0.1, 0.3, 0.6, 1]
                },
                {
                    // behaves the same as without *density*
                    direction: 'decreasing', currentbin: 'half', histnorm: 'density',
                    p: [-3, 2, 7, 12, 17], s: [10, 9.5, 8, 5.5, 2]
                },
                {
                    // behaves the same as without *density*, only *probability*
                    direction: 'decreasing', currentbin: 'half', histnorm: 'probability density',
                    p: [-3, 2, 7, 12, 17], s: [1, 0.95, 0.8, 0.55, 0.2]
                },
                {
                    currentbin: 'half', histfunc: 'sum',
                    p: [2, 7, 12, 17, 22], s: [1, 6, 19, 44, 60]
                },
                {
                    currentbin: 'half', histfunc: 'sum', histnorm: 'probability',
                    p: [2, 7, 12, 17, 22], s: [0.5 / 30, 0.1, 9.5 / 30, 22 / 30, 1]
                },
                {
                    direction: 'decreasing', currentbin: 'half', histfunc: 'max', histnorm: 'percent',
                    p: [-3, 2, 7, 12, 17], s: [100, 3100 / 32, 2700 / 32, 1900 / 32, 700 / 32]
                },
                {
                    direction: 'decreasing', currentbin: 'half', histfunc: 'min', histnorm: 'density',
                    p: [-3, 2, 7, 12, 17], s: [8, 7, 5, 3, 1]
                },
                {
                    currentbin: 'exclude', histfunc: 'avg', histnorm: 'probability density',
                    p: [7, 12, 17, 22], s: [0.1, 0.3, 0.6, 1]
                }
            ];

            CDFs.forEach(function(CDF) {
                var p = CDF.p,
                    s = CDF.s;

                it('handles direction=' + CDF.direction + ', currentbin=' + CDF.currentbin +
                        ', histnorm=' + CDF.histnorm + ', histfunc=' + CDF.histfunc, function() {
                    var traceIn = Lib.extendFlat({}, base, {
                        cumulative: {
                            enabled: true,
                            direction: CDF.direction,
                            currentbin: CDF.currentbin
                        },
                        histnorm: CDF.histnorm,
                        histfunc: CDF.histfunc
                    });
                    var out = _calc(traceIn);

                    expect(out.length).toBe(p.length);
                    out.forEach(function(outi, i) {
                        expect(outi.p).toBe(p[i]);
                        expect(outi.s).toBeCloseTo(s[i], 6);
                        expect(outi.b).toBe(0);
                    });
                });
            });
        });

    });
});
