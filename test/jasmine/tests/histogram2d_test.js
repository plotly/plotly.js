var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var supplyDefaultsRaw = require('@src/traces/histogram2d/defaults');
var calc = require('@src/traces/histogram2d/calc');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');

var supplyAllDefaults = require('../assets/supply_defaults');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

describe('Test histogram2d', function() {
    'use strict';

    function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
        layout._dfltTitle = {colorbar: 'cb'};

        return supplyDefaultsRaw(traceIn, traceOut, defaultColor, layout);
    }

    describe('supplyDefaults', function() {
        var traceIn;
        var traceOut;

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
        function _calc(opts, layout) {
            var base = { type: 'histogram2d' };
            var trace = Lib.extendFlat({}, base, opts);
            var gd = { data: [trace] };
            if(layout) gd.layout = layout;

            supplyAllDefaults(gd);
            var fullTrace = gd._fullData[0];
            var fullLayout = gd._fullLayout;

            fullTrace._extremes = {};

            // we used to call ax.setScale during supplyDefaults, and this had a
            // fallback to provide _categories and _categoriesMap. Now neither of
            // those is true... anyway the right way to do this though is
            // ax.clearCalc.
            fullLayout.xaxis.clearCalc();
            fullLayout.yaxis.clearCalc();

            var out = calc(gd, fullTrace);
            out._xcategories = fullLayout.xaxis._categories;
            out._ycategories = fullLayout.yaxis._categories;

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

        ['histogram2d', 'histogram2dcontour'].forEach(function(traceType) {
            it('should sort z data based on axis categoryorder for ' + traceType, function() {
                var mock = require('@mocks/heatmap_categoryorder');
                var mockCopy = Lib.extendDeep({}, mock);
                var data = mockCopy.data[0];
                data.type = traceType;
                var layout = mockCopy.layout;

                // sort x axis categories
                var mockLayout = Lib.extendDeep({}, layout);
                var out = _calc(data, mockLayout);
                mockLayout.xaxis.categoryorder = 'category ascending';
                var out1 = _calc(data, mockLayout);

                expect(out._xcategories).toEqual(out1._xcategories.slice().reverse());
                // Check z data is also sorted
                for(var i = 0; i < out.z.length; i++) {
                    expect(out1.z[i]).toEqual(out.z[i].slice().reverse());
                }

                // sort y axis categories
                mockLayout = Lib.extendDeep({}, layout);
                out = _calc(data, mockLayout);
                mockLayout.yaxis.categoryorder = 'category ascending';
                out1 = _calc(data, mockLayout);

                expect(out._ycategories).toEqual(out1._ycategories.slice().reverse());
                // Check z data is also sorted
                expect(out1.z).toEqual(out.z.slice().reverse());
            });

            it('should sort z data based on axis categoryarray ' + traceType, function() {
                var mock = require('@mocks/heatmap_categoryorder');
                var mockCopy = Lib.extendDeep({}, mock);
                var data = mockCopy.data[0];
                data.type = traceType;
                var layout = mockCopy.layout;

                layout.xaxis.categoryorder = 'array';
                layout.xaxis.categoryarray = ['x', 'z', 'y', 'w'];
                layout.yaxis.categoryorder = 'array';
                layout.yaxis.categoryarray = ['a', 'd', 'b', 'c'];

                var out = _calc(data, layout);

                expect(out._xcategories).toEqual(layout.xaxis.categoryarray, 'xaxis should reorder');
                expect(out._ycategories).toEqual(layout.yaxis.categoryarray, 'yaxis should reorder');
                var offset = 0;
                if(traceType === 'histogram2dcontour') offset = 1;
                expect(out.z[0 + offset][0 + offset]).toEqual(0);
                expect(out.z[0 + offset][3 + offset]).toEqual(1);
            });
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
            .then(done, done.fail);
        });

        function _assert(xBinsFull, yBinsFull, xBins, yBins) {
            expect(gd._fullData[0].xbins).toEqual(xBinsFull);
            expect(gd._fullData[0].ybins).toEqual(yBinsFull);
            expect(gd._fullData[0].autobinx).toBeUndefined();
            expect(gd._fullData[0].autobiny).toBeUndefined();
            expect(gd.data[0].xbins).toEqual(xBins);
            expect(gd.data[0].ybins).toEqual(yBins);
            expect(gd.data[0].autobinx).toBeUndefined();
            expect(gd.data[0].autobiny).toBeUndefined();
        }

        it('handles autobin correctly on restyles', function(done) {
            var x1 = [
                1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4,
                1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];
            var y1 = [
                1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4,
                1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4];
            Plotly.newPlot(gd, [{type: 'histogram2d', x: x1, y: y1}])
            .then(function() {
                _assert(
                    {start: 0.5, end: 4.5, size: 1},
                    {start: 0.5, end: 4.5, size: 1},
                    undefined, undefined);

                // same range but fewer samples increases sizes
                return Plotly.restyle(gd, {x: [[1, 3, 4]], y: [[1, 2, 4]]});
            })
            .then(function() {
                _assert(
                    {start: -0.5, end: 5.5, size: 2},
                    {start: -0.5, end: 5.5, size: 2},
                    undefined, undefined);

                // larger range
                return Plotly.restyle(gd, {x: [[10, 30, 40]], y: [[10, 20, 40]]});
            })
            .then(function() {
                _assert(
                    {start: -0.5, end: 59.5, size: 20},
                    {start: -0.5, end: 59.5, size: 20},
                    undefined, undefined);

                // explicit changes to bin settings
                return Plotly.restyle(gd, 'xbins.start', 12);
            })
            .then(function() {
                _assert(
                    {start: 12, end: 59.5, size: 20},
                    {start: -0.5, end: 59.5, size: 20},
                    {start: 12}, undefined);

                return Plotly.restyle(gd, {'ybins.end': 12, 'ybins.size': 3});
            })
            .then(function() {
                _assert(
                    {start: 12, end: 59.5, size: 20},
                    // with the new autobin algo, start responds to autobin
                    {start: 8.5, end: 12, size: 3},
                    {start: 12},
                    {end: 12, size: 3});

                // restart autobin
                return Plotly.restyle(gd, {autobinx: true, autobiny: true});
            })
            .then(function() {
                _assert(
                    {start: -0.5, end: 59.5, size: 20},
                    {start: -0.5, end: 59.5, size: 20},
                    undefined, undefined);
            })
            .then(done, done.fail);
        });

        it('respects explicit autobin: false as a one-time autobin', function(done) {
            // patched in for backward compat, but there aren't really
            // autobinx/autobiny attributes anymore
            var x1 = [
                1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4,
                1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];
            var y1 = [
                1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4,
                1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4];
            var binSpec = {start: 0.5, end: 4.5, size: 1};
            Plotly.newPlot(gd, [{type: 'histogram2d', x: x1, y: y1, autobinx: false, autobiny: false}])
            .then(function() {
                _assert(binSpec, binSpec, binSpec, binSpec);

                // with autobin false this will no longer update the bins.
                return Plotly.restyle(gd, {x: [[1, 3, 4]], y: [[1, 2, 4]]});
            })
            .then(function() {
                _assert(binSpec, binSpec, binSpec, binSpec);
            })
            .then(done, done.fail);
        });
    });
});

describe('Test histogram2d hover:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function _hover(xpx, ypx) {
        Lib.clearThrottle();
        mouseEvent('mousemove', xpx, ypx);
    }

    it('should display correct label content with specified format', function(done) {
        Plotly.newPlot(gd, [{
            type: 'histogram2d',
            x: [0, 1, 2, 0, 1, 2, 1],
            y: [0, 0, 0, 1, 1, 1, 1],
            z: [1.11111, 2.2222, 3.3333, 4.4444, 4.4444, 6.6666, 1.1111],
            histfunc: 'sum',
            name: 'one',
            zhoverformat: '.2f',
            showscale: false
        }, {
            type: 'histogram2d',
            x: [0, 1, 2, 0, 1, 2, 1, 2, 0, 1, 2],
            y: [2, 2, 2, 3, 3, 3, 2, 2, 3, 3, 2],
            name: 'two',
            showscale: false
        }], {
            width: 500,
            height: 400,
            margin: {l: 0, t: 0, r: 0, b: 0}
        })
        .then(function() {
            _hover(250, 100);
            assertHoverLabelContent({
                nums: 'x: 1\ny: 3\nz: 2',
                name: 'two'
            });

            _hover(250, 300);
            assertHoverLabelContent({
                nums: 'x: 1\ny: 1\nz: 5.56',
                name: 'one'
            });
        })
        .then(function() {
            return Plotly.restyle(gd, 'hovertemplate', 'f(%{x:.3f},%{y:.3f})=%{z}');
        })
        .then(function() {
            _hover(250, 100);
            assertHoverLabelContent({
                nums: 'f(1.000,3.000)=2',
                name: 'two'
            });

            _hover(250, 300);
            assertHoverLabelContent({
                nums: 'f(1.000,1.000)=5.56',
                name: 'one'
            });
        })
        .then(function() {
            return Plotly.restyle(gd, 'hoverlabel.namelength', 0);
        })
        .then(function() {
            _hover(250, 100);
            assertHoverLabelContent({
                nums: 'f(1.000,3.000)=2',
                name: ''
            });

            _hover(250, 300);
            assertHoverLabelContent({
                nums: 'f(1.000,1.000)=5.56',
                name: ''
            });
        })
        .then(done, done.fail);
    });

    describe('hover info', function() {
        it('shows the data range when bins have multiple values', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 2, 3, 4, 5, 6, 7],
                y: [1, 3, 4, 5, 6, 7, 8],
                xbins: {start: -0.5, end: 8.5, size: 3},
                ybins: {start: 0.5, end: 9.5, size: 3},
                type: 'histogram2d'
            }], {
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                _hover(250, 200);
                assertHoverLabelContent({
                    nums: 'x: 3 - 5\ny: 4 - 6\nz: 3'
                });
            })
            .then(done, done.fail);
        });

        it('shows the data range when bins have multiple values (case 2)', function(done) {
            Plotly.newPlot(gd, [{
                type: 'histogram2d',
                x: ['a', 'b', 'c', 'a'],
                y: [7, 2, 3, 7],
                nbinsy: 3
            }], {
                width: 600,
                height: 600
            })
            .then(function() {
                _hover(250, 250);
                assertHoverLabelContent({nums: ['x: b', 'y: 4 - 5', 'z: 0'].join('\n')});
            })
            .then(done, done.fail);
        });

        it('shows the exact data when bins have single values', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 0, 3.3, 3.3, 3.3, 7, 7],
                y: [2, 2, 4.2, 4.2, 4.2, 8.8, 8.8],
                xbins: {start: -0.5, end: 8.5, size: 3},
                ybins: {start: 0.5, end: 9.5, size: 3},
                type: 'histogram2d'
            }], {
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                _hover(250, 200);
                assertHoverLabelContent({
                    nums: 'x: 3.3\ny: 4.2\nz: 3'
                });
            })
            .then(done, done.fail);
        });

        it('shows the data range when bins have no value in it', function(done) {
            function _check(msg, xpx, ypx, lines) {
                _hover(xpx, ypx);
                assertHoverLabelContent({nums: lines.join('\n')}, msg);
            }

            Plotly.newPlot('graph', [{
                type: 'histogram2d',
                x: [18.78],
                y: [3],
                xbins: {
                    start: 0,
                    end: 55,
                    size: 5
                },
                ybins: {
                    start: 0,
                    end: 11,
                    size: 1
                }
            }], {
                width: 400,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                expect(gd.calcdata[0][0].xRanges).toBeCloseTo2DArray([
                    [0, 4], [5, 9], [10, 14],
                    [18.78, 18.78],
                    [20, 24], [25, 29], [30, 34],
                    [35, 39], [40, 44], [45, 49], [50, 54]
                ], 2, 'x-bins with some spread');
                expect(gd.calcdata[0][0].yRanges).toBeCloseTo2DArray([
                    [0, 0], [1, 1], [2, 2], [3, 3], [4, 4], [5, 5],
                    [6, 6], [7, 7], [8, 8], [9, 9], [10, 10]
                ], 2, 'y-bins with single values');

                _check('on pt (!)', 100, 275, ['x: 18.78', 'y: 3', 'z: 1']);
                _check('on x of pt, above it', 100, 200, ['x: 18.78', 'y: 5', 'z: 0']);
                _check('off left/top of pt', 50, 100, ['x: 5 - 9', 'y: 8', 'z: 0']);
                _check('off right/top of pt', 300, 100, ['x: 50 - 54', 'y: 8', 'z: 0']);
                _check('off left/bottom of pt', 50, 325, ['x: 5 - 9', 'y: 2', 'z: 0']);
                _check('off right/bottom of pt', 300, 325, ['x: 50 - 54', 'y: 2', 'z: 0']);
            })
            .then(done, done.fail);
        });
    });
});
