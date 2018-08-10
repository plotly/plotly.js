var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var supplyDefaultsRaw = require('@src/traces/histogram2d/defaults');
var calc = require('@src/traces/histogram2d/calc');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
var supplyAllDefaults = require('../assets/supply_defaults');

describe('Test histogram2d', function() {
    'use strict';

    function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
        layout._dfltTitle = {colorbar: 'cb'};

        return supplyDefaultsRaw(traceIn, traceOut, defaultColor, layout);
    }

    describe('supplyDefaults', function() {
        var traceIn,
            traceOut;

        beforeEach(function() {
            traceOut = {};
        });

        it('should quit early if there is no data', function() {
            traceIn = {};
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.visible).toBe(false);
            ['zsmooth', 'xgap', 'ygap', 'calendar'].forEach(function(v) {
                expect(traceOut[v]).toBeUndefined(v);
            });
        });

        it('should set zsmooth to false when zsmooth is empty', function() {
            traceIn = {x: [1, 2], y: [1, 2]};
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.visible).not.toBe(false);
            expect(traceOut.zsmooth).toBe(false);
        });

        it('doesnt step on zsmooth when zsmooth is set', function() {
            traceIn = {
                x: [1, 2],
                y: [1, 2],
                zsmooth: 'fast'
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.zsmooth).toBe('fast');
        });

        it('should set xgap and ygap to 0 when xgap and ygap are empty', function() {
            traceIn = {x: [1, 2], y: [1, 2]};
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.xgap).toBe(0);
            expect(traceOut.ygap).toBe(0);
        });

        it('shouldnt step on xgap and ygap when xgap and ygap are set', function() {
            traceIn = {
                x: [1, 2],
                y: [1, 2],
                xgap: 10,
                ygap: 5
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.xgap).toBe(10);
            expect(traceOut.ygap).toBe(5);
        });

        it('shouldnt coerce gap when zsmooth is set', function() {
            traceIn = {
                x: [1, 2],
                y: [1, 2],
                xgap: 10,
                ygap: 5,
                zsmooth: 'best'
            };
            supplyDefaults(traceIn, traceOut, '', {});
            expect(traceOut.xgap).toBe(undefined);
            expect(traceOut.ygap).toBe(undefined);
        });


        it('should inherit layout.calendar', function() {
            traceIn = {
                x: [1, 2, 3],
                y: [1, 2, 3]
            };
            supplyDefaults(traceIn, traceOut, '', {calendar: 'islamic'});

            // we always fill calendar attributes, because it's hard to tell if
            // we're on a date axis at this point.
            expect(traceOut.xcalendar).toBe('islamic');
            expect(traceOut.ycalendar).toBe('islamic');
        });

        it('should take its own calendars', function() {
            traceIn = {
                x: [1, 2, 3],
                y: [1, 2, 3],
                xcalendar: 'coptic',
                ycalendar: 'ethiopian'
            };
            supplyDefaults(traceIn, traceOut, '', {calendar: 'islamic'});

            // we always fill calendar attributes, because it's hard to tell if
            // we're on a date axis at this point.
            expect(traceOut.xcalendar).toBe('coptic');
            expect(traceOut.ycalendar).toBe('ethiopian');
        });
    });


    describe('calc', function() {
        function _calc(opts) {
            var base = { type: 'histogram2d' },
                trace = Lib.extendFlat({}, base, opts),
                gd = { data: [trace] };

            supplyAllDefaults(gd);
            var fullTrace = gd._fullData[0];

            var out = calc(gd, fullTrace);
            delete out.trace;
            return out;
        }

        // remove tzJan/tzJuly when we move to UTC
        var oneDay = 24 * 3600000;

        it('should handle both uniform and nonuniform date bins', function() {
            var out = _calc({
                x: ['1970-01-01', '1970-01-01', '1970-01-02', '1970-01-04'],
                nbinsx: 4,
                y: ['1970-01-01', '1970-01-01', '1971-01-01', '1973-01-01'],
                nbinsy: 4
            });

            expect(out.x0).toBe('1970-01-01');
            expect(out.dx).toBe(oneDay);

            // TODO: even though the binning is done on non-uniform bins,
            // the display makes them linear (using only y0 and dy)
            // Can we also make it display the bins with nonuniform size?
            // see https://github.com/plotly/plotly.js/issues/360
            expect(out.y0).toBe('1970-01-01 03:00');
            expect(out.dy).toBe(365.25 * oneDay);

            expect(out.z).toEqual([
                [2, 0, 0, 0],
                [0, 1, 0, 0],
                [0, 0, 0, 0],
                [0, 0, 0, 1]
            ]);
        });
    });

    describe('restyle / relayout interaction', function() {

        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should update paths on zooms', function(done) {
            Plotly.newPlot(gd, [{
                type: 'histogram2dcontour',
                x: [1, 1, 2, 2, 3],
                y: [0, 1, 1, 1, 3]
            }])
            .then(function() {
                return Plotly.relayout(gd, 'xaxis.range', [0, 2]);
            })
            .catch(fail)
            .then(done);
        });


        it('handles autobin correctly on restyles', function() {
            var x1 = [
                1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4,
                1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];
            var y1 = [
                1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4,
                1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4];
            Plotly.newPlot(gd, [{type: 'histogram2d', x: x1, y: y1}]);
            expect(gd._fullData[0].xbins).toEqual({start: 0.5, end: 4.5, size: 1, _dataSpan: 3});
            expect(gd._fullData[0].ybins).toEqual({start: 0.5, end: 4.5, size: 1, _dataSpan: 3});
            expect(gd._fullData[0].autobinx).toBe(true);
            expect(gd._fullData[0].autobiny).toBe(true);

            // same range but fewer samples increases sizes
            Plotly.restyle(gd, {x: [[1, 3, 4]], y: [[1, 2, 4]]});
            expect(gd._fullData[0].xbins).toEqual({start: -0.5, end: 5.5, size: 2, _dataSpan: 3});
            expect(gd._fullData[0].ybins).toEqual({start: -0.5, end: 5.5, size: 2, _dataSpan: 3});
            expect(gd._fullData[0].autobinx).toBe(true);
            expect(gd._fullData[0].autobiny).toBe(true);

            // larger range
            Plotly.restyle(gd, {x: [[10, 30, 40]], y: [[10, 20, 40]]});
            expect(gd._fullData[0].xbins).toEqual({start: -0.5, end: 59.5, size: 20, _dataSpan: 30});
            expect(gd._fullData[0].ybins).toEqual({start: -0.5, end: 59.5, size: 20, _dataSpan: 30});
            expect(gd._fullData[0].autobinx).toBe(true);
            expect(gd._fullData[0].autobiny).toBe(true);

            // explicit changes to bin settings
            Plotly.restyle(gd, 'xbins.start', 12);
            expect(gd._fullData[0].xbins).toEqual({start: 12, end: 59.5, size: 20, _dataSpan: 30});
            expect(gd._fullData[0].ybins).toEqual({start: -0.5, end: 59.5, size: 20, _dataSpan: 30});
            expect(gd._fullData[0].autobinx).toBe(false);
            expect(gd._fullData[0].autobiny).toBe(true);

            Plotly.restyle(gd, {'ybins.end': 12, 'ybins.size': 3});
            expect(gd._fullData[0].xbins).toEqual({start: 12, end: 59.5, size: 20, _dataSpan: 30});
            expect(gd._fullData[0].ybins).toEqual({start: -0.5, end: 12, size: 3, _dataSpan: 30});
            expect(gd._fullData[0].autobinx).toBe(false);
            expect(gd._fullData[0].autobiny).toBe(false);

            // restart autobin
            Plotly.restyle(gd, {autobinx: true, autobiny: true});
            expect(gd._fullData[0].xbins).toEqual({start: -0.5, end: 59.5, size: 20, _dataSpan: 30});
            expect(gd._fullData[0].ybins).toEqual({start: -0.5, end: 59.5, size: 20, _dataSpan: 30});
            expect(gd._fullData[0].autobinx).toBe(true);
            expect(gd._fullData[0].autobiny).toBe(true);
        });

        it('respects explicit autobin: false as a one-time autobin', function() {
            var x1 = [
                1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4,
                1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];
            var y1 = [
                1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4,
                1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4];
            Plotly.newPlot(gd, [{type: 'histogram2d', x: x1, y: y1, autobinx: false, autobiny: false}]);
            expect(gd._fullData[0].xbins).toEqual({start: 0.5, end: 4.5, size: 1, _dataSpan: 3});
            expect(gd._fullData[0].ybins).toEqual({start: 0.5, end: 4.5, size: 1, _dataSpan: 3});
            expect(gd._fullData[0].autobinx).toBe(false);
            expect(gd._fullData[0].autobiny).toBe(false);

            // with autobin false this will no longer update the bins.
            Plotly.restyle(gd, {x: [[1, 3, 4]], y: [[1, 2, 4]]});
            expect(gd._fullData[0].xbins).toEqual({start: 0.5, end: 4.5, size: 1, _dataSpan: 3});
            expect(gd._fullData[0].ybins).toEqual({start: 0.5, end: 4.5, size: 1, _dataSpan: 3});
            expect(gd._fullData[0].autobinx).toBe(false);
            expect(gd._fullData[0].autobiny).toBe(false);
        });
    });

});
