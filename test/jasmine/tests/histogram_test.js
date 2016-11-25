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
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                y: []
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.visible).toBe(false);
        });

        it('should set visible to false when type is histogram2d and x or y are empty', function() {
            traceIn = {
                type: 'histogram2d',
                x: [],
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                type: 'histogram2d',
                x: [1, 2, 2],
                y: []
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                type: 'histogram2d',
                x: [],
                y: []
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                type: 'histogram2dcontour',
                x: [],
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.visible).toBe(false);
        });

        it('should set orientation to v by default', function() {
            traceIn = {
                x: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.orientation).toBe('v');

            traceIn = {
                x: [1, 2, 2],
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.orientation).toBe('v');
        });

        it('should set orientation to h when only y is supplied', function() {
            traceIn = {
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut);
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
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.autobinx).toBeUndefined();

            traceIn = {
                x: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut);
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
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.autobiny).toBeUndefined();

            traceIn = {
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.autobiny).toBeUndefined();
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
            var out = _calc({
                x: ['1970-01-01', '1970-01-01', '1971-01-01', '1973-01-01'],
                nbinsx: 4
            });

            // TODO: https://github.com/plotly/plotly.js/issues/1151
            // these bins should shift when we implement that

            // note that x1-x0 = 365 days, but the others are 365.5 days

            // ALSO: this gives half-day gaps between all but the first two
            // bars. Now that we have explicit per-bar positioning, perhaps
            // we should fill the space, rather than insisting on equal-width
            // bars?
            var x0 = 15768000000,
                x1 = x0 + oneDay * 365,
                x2 = x1 + oneDay * 365.5,
                x3 = x2 + oneDay * 365.5;

            expect(out).toEqual([
                // full calcdata has x and y too (and t in the first one),
                // but those come later from setPositions.
                {b: 0, p: x0, s: 2},
                {b: 0, p: x1, s: 1},
                {b: 0, p: x2, s: 0},
                {b: 0, p: x3, s: 1}
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

    });
});
