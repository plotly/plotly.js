var d3 = require('d3');
var Scatter = require('@src/traces/scatter');
var makeBubbleSizeFn = require('@src/traces/scatter/make_bubble_size_func');
var linePoints = require('@src/traces/scatter/line_points');
var Lib = require('@src/lib');

var Plotly = require('@lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customAssertions = require('../assets/custom_assertions');
var fail = require('../assets/fail_test');

var assertClip = customAssertions.assertClip;
var assertNodeDisplay = customAssertions.assertNodeDisplay;

describe('Test scatter', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn,
            traceOut;

        var defaultColor = '#444',
            layout = {};

        var supplyDefaults = Scatter.supplyDefaults;

        beforeEach(function() {
            traceOut = {};
        });

        it('should set visible to false when x and y are empty', function() {
            traceIn = {};
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                x: [],
                y: []
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should set visible to false when x or y is empty', function() {
            traceIn = {
                x: []
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                x: [],
                y: [1, 2, 3]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                y: []
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                x: [1, 2, 3],
                y: []
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should correctly assign \'hoveron\' default', function() {
            traceIn = {
                x: [1, 2, 3],
                y: [1, 2, 3],
                mode: 'lines+markers',
                fill: 'tonext'
            };

            // fills and markers, you get both hover types
            // you need visible: true here, as that normally gets set
            // outside of the module supplyDefaults
            traceOut = {visible: true};
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.hoveron).toBe('points+fills');

            // but with only lines (or just fill) and fill tonext or toself
            // you get fills
            traceIn.mode = 'lines';
            traceOut = {visible: true};
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.hoveron).toBe('fills');

            // with the wrong fill you always get points
            // only area fills default to hoveron points. Vertical or
            // horizontal fills don't have the same physical meaning,
            // they're generally just filling their own slice, so they
            // default to hoveron points.
            traceIn.fill = 'tonexty';
            traceOut = {visible: true};
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.hoveron).toBe('points');
        });

        it('should inherit layout.calendar', function() {
            traceIn = {
                x: [1, 2, 3],
                y: [1, 2, 3]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, {calendar: 'islamic'});

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
            supplyDefaults(traceIn, traceOut, defaultColor, {calendar: 'islamic'});

            expect(traceOut.xcalendar).toBe('coptic');
            expect(traceOut.ycalendar).toBe('ethiopian');
        });

        describe('selected / unselected attribute containers', function() {
            function _supply(patch) { traceIn = Lib.extendFlat({
                mode: 'markers',
                x: [1, 2, 3],
                y: [2, 1, 2]
            }, patch);
                traceOut = {visible: true};
                supplyDefaults(traceIn, traceOut, defaultColor, layout);
            }

            it('should fill in [un]selected.marker.opacity default when no other [un]selected is set', function() {
                _supply({});
                expect(traceOut.selected.marker.opacity).toBe(1);
                expect(traceOut.unselected.marker.opacity).toBe(0.2);

                _supply({ marker: {opacity: 0.6} });
                expect(traceOut.selected.marker.opacity).toBe(0.6);
                expect(traceOut.unselected.marker.opacity).toBe(0.12);
            });

            it('should not fill in [un]selected.marker.opacity default when some other [un]selected is set', function() {
                _supply({
                    selected: {marker: {size: 20}}
                });
                expect(traceOut.selected.marker.opacity).toBeUndefined();
                expect(traceOut.selected.marker.size).toBe(20);
                expect(traceOut.unselected).toBeUndefined();

                _supply({
                    unselected: {marker: {color: 'red'}}
                });
                expect(traceOut.selected).toBeUndefined();
                expect(traceOut.unselected.marker.opacity).toBeUndefined();
                expect(traceOut.unselected.marker.color).toBe('red');

                _supply({
                    mode: 'markers+text',
                    selected: {textfont: {color: 'blue'}}
                });
                expect(traceOut.selected.marker).toBeUndefined();
                expect(traceOut.selected.textfont.color).toBe('blue');
                expect(traceOut.unselected).toBeUndefined();
            });
        });

    });

    describe('isBubble', function() {
        it('should return true when marker.size is an Array', function() {
            var trace = {
                    marker: {
                        size: [1, 4, 2, 10]
                    }
                },
                isBubble = Scatter.isBubble(trace);

            expect(isBubble).toBe(true);
        });

        it('should return false when marker.size is an number', function() {
            var trace = {
                    marker: {
                        size: 10
                    }
                },
                isBubble = Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });

        it('should return false when marker.size is not defined', function() {
            var trace = {
                    marker: {
                        color: 'red'
                    }
                },
                isBubble = Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });

        it('should return false when marker is not defined', function() {
            var trace = {
                    line: {
                        color: 'red'
                    }
                },
                isBubble = Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });

    });

    describe('makeBubbleSizeFn', function() {
        var markerSizes = [
                0, '1', 2.21321321, 'not-a-number',
                100, 1000.213213, 1e7, undefined, null, -100
            ],
            trace = { marker: {} };

        var sizeFn, expected;

        it('should scale w.r.t. bubble diameter when sizemode=diameter', function() {
            trace.marker.sizemode = 'diameter';
            sizeFn = makeBubbleSizeFn(trace);

            expected = [
                0, 0.5, 1.106606605, 0, 50, 500.1066065, 5000000, 0, 0, 0
            ];
            expect(markerSizes.map(sizeFn)).toEqual(expected);
        });

        it('should scale w.r.t. bubble area when sizemode=area', function() {
            trace.marker.sizemode = 'area';
            sizeFn = makeBubbleSizeFn(trace);

            expected = [
                0, 0.7071067811865476, 1.051953708582274, 0, 7.0710678118654755,
                22.363063441755916, 2236.06797749979, 0, 0, 0
            ];
            expect(markerSizes.map(sizeFn)).toEqual(expected);
        });

        it('should adjust scaling according to sizeref', function() {
            trace.marker.sizemode = 'diameter';
            trace.marker.sizeref = 0.1;
            sizeFn = makeBubbleSizeFn(trace);

            expected = [
                0, 5, 11.06606605, 0, 500, 5001.066065, 50000000, 0, 0, 0
            ];
            expect(markerSizes.map(sizeFn)).toEqual(expected);
        });

        it('should adjust the small sizes according to sizemin', function() {
            trace.marker.sizemode = 'diameter';
            trace.marker.sizeref = 10;
            trace.marker.sizemin = 5;
            sizeFn = makeBubbleSizeFn(trace);

            expected = [
                0, 5, 5, 0, 5, 50.01066065, 500000, 0, 0, 0
            ];
            expect(markerSizes.map(sizeFn)).toEqual(expected);
        });
    });

    describe('linePoints', function() {
        // test axes are unit-scaled and 100 units long
        var ax = {_length: 100, c2p: Lib.identity},
            baseOpts = {
                xaxis: ax,
                yaxis: ax,
                connectGaps: false,
                baseTolerance: 1,
                shape: 'linear',
                simplify: true
            };

        function makeCalcData(ptsIn) {
            return ptsIn.map(function(pt) {
                return {x: pt[0], y: pt[1]};
            });
        }

        function callLinePoints(ptsIn, opts) {
            var thisOpts = {};
            if(!opts) opts = {};
            Object.keys(baseOpts).forEach(function(key) {
                if(opts[key] !== undefined) thisOpts[key] = opts[key];
                else thisOpts[key] = baseOpts[key];
            });
            return linePoints(makeCalcData(ptsIn), thisOpts);
        }

        it('should pass along well-separated non-linear points', function() {
            var ptsIn = [[0, 0], [10, 20], [20, 10], [30, 40], [40, 60], [50, 30]];
            var ptsOut = callLinePoints(ptsIn);

            expect(ptsOut).toEqual([ptsIn]);
        });

        it('should collapse straight lines to just their endpoints', function() {
            var ptsIn = [[0, 0], [5, 10], [13, 26], [15, 30], [22, 16], [28, 4], [30, 0]];
            var ptsOut = callLinePoints(ptsIn);
            // TODO: [22,16] should not appear here. This is ok but not optimal.
            expect(ptsOut).toEqual([[[0, 0], [15, 30], [22, 16], [30, 0]]]);
        });

        it('should not collapse straight lines if simplify is false', function() {
            var ptsIn = [[0, 0], [5, 10], [13, 26], [15, 30], [22, 16], [28, 4], [30, 0]];
            var ptsOut = callLinePoints(ptsIn, {simplify: false});
            expect(ptsOut).toEqual([ptsIn]);
        });

        it('should separate out blanks, unless connectgaps is true', function() {
            var ptsIn = [
                [0, 0], [10, 20], [20, 10], [undefined, undefined],
                [30, 40], [undefined, undefined],
                [40, 60], [50, 30]];
            var ptsDisjoint = callLinePoints(ptsIn);
            var ptsConnected = callLinePoints(ptsIn, {connectGaps: true});

            expect(ptsDisjoint).toEqual([[[0, 0], [10, 20], [20, 10]], [[30, 40]], [[40, 60], [50, 30]]]);
            expect(ptsConnected).toEqual([[[0, 0], [10, 20], [20, 10], [30, 40], [40, 60], [50, 30]]]);
        });

        it('should collapse a vertical cluster into 4 points', function() {
            // the four being initial, high, low, and final if the high is before the low
            var ptsIn = [[-10, 0], [0, 0], [0, 10], [0, 20], [0, -10], [0, 15], [0, -25], [0, 10], [0, 5], [10, 10]];
            var ptsOut = callLinePoints(ptsIn);

            // TODO: [0, 10] should not appear in either of these results - this is OK but not optimal.
            expect(ptsOut).toEqual([[[-10, 0], [0, 0], [0, 10], [0, 20], [0, -25], [0, 5], [10, 10]]]);

            // or initial, low, high, final if the low is before the high
            ptsIn = [[-10, 0], [0, 0], [0, 10], [0, -25], [0, -10], [0, 15], [0, 20], [0, 10], [0, 5], [10, 10]];
            ptsOut = callLinePoints(ptsIn);

            expect(ptsOut).toEqual([[[-10, 0], [0, 0], [0, 10], [0, -25], [0, 20], [0, 5], [10, 10]]]);
        });

        it('should collapse a horizontal cluster into 4 points', function() {
            // same deal
            var ptsIn = [[0, -10], [0, 0], [10, 0], [20, 0], [-10, 0], [15, 0], [-25, 0], [10, 0], [5, 0], [10, 10]];
            var ptsOut = callLinePoints(ptsIn);

            // TODO: [10, 0] should not appear in either of these results - this is OK but not optimal.
            // same problem as the test above
            expect(ptsOut).toEqual([[[0, -10], [0, 0], [10, 0], [20, 0], [-25, 0], [5, 0], [10, 10]]]);

            ptsIn = [[0, -10], [0, 0], [10, 0], [-25, 0], [-10, 0], [15, 0], [20, 0], [10, 0], [5, 0], [10, 10]];
            ptsOut = callLinePoints(ptsIn);

            expect(ptsOut).toEqual([[[0, -10], [0, 0], [10, 0], [-25, 0], [20, 0], [5, 0], [10, 10]]]);
        });

        it('should use lineWidth to determine whether a cluster counts', function() {
            var ptsIn = [[0, 0], [20, 0], [21, 10], [22, 20], [23, -10], [24, 15], [25, -25], [26, 10], [27, 5], [100, 10]];
            var ptsThin = callLinePoints(ptsIn);
            var ptsThick = callLinePoints(ptsIn, {baseTolerance: 8});

            // thin line, no decimation. thick line yes.
            expect(ptsThin).toEqual([ptsIn]);
            // TODO: [21,10] should not appear in this result (same issue again)
            expect(ptsThick).toEqual([[[0, 0], [20, 0], [21, 10], [22, 20], [25, -25], [27, 5], [100, 10]]]);
        });

        // TODO: test coarser decimation outside plot, and removing very near duplicates from the four of a cluster

        it('should clip extreme points without changing on-screen paths', function() {
            var ptsIn = [
                // first bunch: rays going in/out in many directions
                // and a few random moves within faraway sectors, that should get dropped
                // for simplicity of calculation all are 45 degree multiples, but not exactly on corners
                [[40, 70], [40, 1000000], [-100, 2000000], [200, 2000000], [60, 3000000], [60, 70]],
                // back and forth across the diagonal
                [[60, 70], [1000060, 1000070], [-2000070, -2000060], [-3000060, -3000070], [10000070, 10000060], [70, 60]],
                [[70, 60], [1000000, 60], [100000, 50], [60, 50]],
                [[60, 50], [1000110, -1000000], [10000100, -10000010], [50, 40]],
                // back and forth across the vertical
                [[50, 40], [50, -3000000], [49, -3000000], [49, 4000000], [48, 3000000], [48, -4000000], [40, -1000000], [40, 30]],
                [[40, 30], [-1000000, -1000010], [-2000010, -2000000], [30, 40]],
                // back and forth across the horizontal
                [[30, 40], [-5000000, 40], [-900000, -500], [-1000000, 50], [1000000, 50], [-2000000, 50], [40, 50]],
                [[40, 50], [-1000010, 1000100], [-2000000, 2000100], [50, 60]],

                // some paths crossing the nearby region in various ways
                [[0, 3100], [-20000, -36900], [20000, -36900], [0, 3100]],
                [[0, -3000], [-20000, 37000], [20000, 37000], [0, -3000]],

                // loops around the outside
                [[55, 1000000], [2000000, 23], [444, -3000000], [-4000000, 432], [-22, 5000000]],
                [[12, 1000000], [2000000, 1000000], [3000000, -4000000], [-5000000, -6000000], [-7000000, 8000000], [-13, 9000000]],

                // wound-unwound loop
                [[55, -100000], [100000, 0], [0, 100000], [-100000, 0], [0, -100000], [-1000000, 100000], [1000000, 100000], [66, -100000]],

                // outside kitty-corner
                [[1e5, 1e6], [-1e6, -1e5], [-1e6, 1e5], [1e5, -1e6], [-1e5, -1e6], [1e6, 1e5]]
            ];

            var ptsExpected = [
                [[40, 70], [40, 2100], [60, 2100], [60, 70]],
                [[60, 70], [2090, 2100], [-2000, -1990], [-2000, -2000], [-1990, -2000], [2100, 2090], [70, 60]],
                [[70, 60], [2100, 60], [2100, 50], [60, 50]],
                [[60, 50], [2100, -1990], [2100, -2000], [2090, -2000], [50, 40]],
                [[50, 40], [50, -2000], [49, -2000], [49, 2100], [48, 2100], [48, -2000], [40, -2000], [40, 30]],
                [[40, 30], [-1990, -2000], [-2000, -2000], [-2000, -1990], [30, 40]],
                [[30, 40], [-2000, 40], [-2000, 50], [2100, 50], [-2000, 50], [40, 50]],
                [[40, 50], [-2000, 2090], [-2000, 2100], [-1990, 2100], [50, 60]],

                [[0, 2100], [-500, 2100], [-2000, -900], [-2000, -2000], [2100, -2000], [2100, -1100], [500, 2100], [0, 2100]],
                [[0, -2000], [-500, -2000], [-2000, 1000], [-2000, 2100], [2100, 2100], [2100, 1200], [500, -2000], [0, -2000]],

                [[55, 2100], [2100, 2100], [2100, -2000], [-2000, -2000], [-2000, 2100], [-22, 2100]],
                [[12, 2100], [2100, 2100], [2100, -2000], [-2000, -2000], [-2000, 2100], [-13, 2100]],

                [[55, -2000], [66, -2000]],

                [[2100, 2100], [-2000, 2100], [-2000, -2000], [2100, -2000], [2100, 2100]]
            ];

            function reverseXY(v) { return [v[1], v[0]]; }

            ptsIn.forEach(function(ptsIni, i) {
                // disable clustering for these tests
                var ptsOut = callLinePoints(ptsIni, {simplify: false});
                expect(ptsOut.length).toBe(1, i);
                expect(ptsOut[0]).toBeCloseTo2DArray(ptsExpected[i], 1, i);

                // swap X and Y and all should work identically
                var ptsOut2 = callLinePoints(ptsIni.map(reverseXY), {simplify: false});
                expect(ptsOut2.length).toBe(1, i);
                expect(ptsOut2[0]).toBeCloseTo2DArray(ptsExpected[i].map(reverseXY), 1, i);
            });
        });
    });

});

describe('end-to-end scatter tests', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should add a plotly-customdata class to points with custom data', function(done) {
        Plotly.plot(gd, [{
            x: [1, 2, 3, 4, 5, 6, 7],
            y: [2, 3, 4, 5, 6, 7, 8],
            customdata: [null, undefined, 0, false, {foo: 'bar'}, 'a']
        }]).then(function() {
            var points = d3.selectAll('g.scatterlayer').selectAll('.point');

            // Rather than just duplicating the logic, let's be explicit about
            // what's expected. Specifially, only null and undefined (the default)
            // do *not* add the class.
            var expected = [false, false, true, true, true, true, false];

            points.each(function(cd, i) {
                expect(d3.select(this).classed('plotly-customdata')).toBe(expected[i]);
            });

            return Plotly.animate(gd, [{
                data: [{customdata: []}]
            }], {frame: {redraw: false, duration: 0}});
        }).then(function() {
            var points = d3.selectAll('g.scatterlayer').selectAll('.point');

            points.each(function() {
                expect(d3.select(this).classed('plotly-customdata')).toBe(false);
            });

        }).catch(fail).then(done);
    });

    it('adds "textpoint" class to scatter text points', function(done) {
        Plotly.plot(gd, [{
            mode: 'text',
            x: [1, 2, 3],
            y: [2, 3, 4],
            text: ['a', 'b', 'c']
        }]).then(function() {
            expect(Plotly.d3.selectAll('.textpoint').size()).toBe(3);
        }).catch(fail).then(done);
    });

    it('should remove all point and text nodes on blank data', function(done) {
        function assertNodeCnt(ptCnt, txCnt) {
            expect(d3.selectAll('.point').size()).toEqual(ptCnt);
            expect(d3.selectAll('.textpoint').size()).toEqual(txCnt);
        }

        function assertText(content) {
            d3.selectAll('.textpoint').each(function(_, i) {
                var tx = d3.select(this).select('text');
                expect(tx.text()).toEqual(content[i]);
            });
        }

        Plotly.plot(gd, [{
            x: [150, 350, 650],
            y: [100, 300, 600],
            text: ['A', 'B', 'C'],
            mode: 'markers+text',
            marker: {
                size: [100, 200, 300],
                line: { width: [10, 20, 30] },
                color: 'yellow',
                sizeref: 3,
                gradient: {
                    type: 'radial',
                    color: 'white'
                }
            }
        }])
        .then(function() {
            assertNodeCnt(3, 3);
            assertText(['A', 'B', 'C']);

            return Plotly.restyle(gd, {
                x: [[null, undefined, NaN]],
                y: [[NaN, null, undefined]]
            });
        })
        .then(function() {
            assertNodeCnt(0, 0);

            return Plotly.restyle(gd, {
                x: [[150, 350, 650]],
                y: [[100, 300, 600]]
            });
        })
        .then(function() {
            assertNodeCnt(3, 3);
            assertText(['A', 'B', 'C']);
        })
        .catch(fail)
        .then(done);
    });

    function _assertNodes(ptStyle, txContent) {
        var pts = d3.selectAll('.point');
        var txs = d3.selectAll('.textpoint');

        expect(pts.size()).toEqual(ptStyle.length);
        expect(txs.size()).toEqual(txContent.length);

        pts.each(function(_, i) {
            expect(this.style.fill).toEqual(ptStyle[i], 'pt ' + i);
        });

        txs.each(function(_, i) {
            expect(d3.select(this).select('text').text()).toEqual(txContent[i], 'tx ' + i);
        });
    }

    it('should reorder point and text nodes even when linked to ids (shuffle case)', function(done) {
        Plotly.plot(gd, [{
            x: [150, 350, 650],
            y: [100, 300, 600],
            text: ['apple', 'banana', 'clementine'],
            ids: ['A', 'B', 'C'],
            mode: 'markers+text',
            marker: {
                color: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)']
            },
            transforms: [{
                type: 'sort',
                enabled: false,
                target: [0, 1, 0]
            }]
        }])
        .then(function() {
            _assertNodes(
                ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)'],
                ['apple', 'banana', 'clementine']
            );

            return Plotly.restyle(gd, 'transforms[0].enabled', true);
        })
        .then(function() {
            _assertNodes(
                ['rgb(255, 0, 0)', 'rgb(0, 0, 255)', 'rgb(0, 255, 0)'],
                ['apple', 'clementine', 'banana']
            );

            return Plotly.restyle(gd, 'transforms[0].enabled', false);
        })
        .then(function() {
            _assertNodes(
                ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)'],
                ['apple', 'banana', 'clementine']
            );
        })
        .catch(fail)
        .then(done);
    });

    it('should reorder point and text nodes even when linked to ids (add/remove case)', function(done) {
        Plotly.plot(gd, [{
            x: [150, 350, null, 600],
            y: [100, 300, null, 700],
            text: ['apple', 'banana', null, 'clementine'],
            ids: ['A', 'B', null, 'C'],
            mode: 'markers+text',
            marker: {
                color: ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', null, 'rgb(0, 0, 255)']
            },
            transforms: [{
                type: 'filter',
                enabled: false,
                target: [1, 0, 0, 1],
                operation: '=',
                value: 1
            }]
        }])
        .then(function() {
            _assertNodes(
                ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)'],
                ['apple', 'banana', 'clementine']
            );

            return Plotly.restyle(gd, 'transforms[0].enabled', true);
        })
        .then(function() {
            _assertNodes(
                ['rgb(255, 0, 0)', 'rgb(0, 0, 255)'],
                ['apple', 'clementine']
            );

            return Plotly.restyle(gd, 'transforms[0].enabled', false);
        })
        .then(function() {
            _assertNodes(
                ['rgb(255, 0, 0)', 'rgb(0, 255, 0)', 'rgb(0, 0, 255)'],
                ['apple', 'banana', 'clementine']
            );
        })
        .catch(fail)
        .then(done);
    });

    it('should smoothly add/remove nodes tags with *ids* during animations', function(done) {
        Plotly.plot(gd, {
            data: [{
                mode: 'markers+text',
                y: [1, 2, 1],
                text: ['apple', 'banana', 'clementine'],
                ids: ['A', 'B', 'C'],
                marker: { color: ['red', 'green', 'blue'] }
            }],
            frames: [{
                data: [{
                    y: [2, 1, 2],
                    text: ['apple', 'banana', 'dragon fruit'],
                    ids: ['A', 'C', 'D'],
                    marker: { color: ['red', 'blue', 'yellow'] }
                }]
            }]
        })
        .then(function() {
            _assertNodes(
                ['rgb(255, 0, 0)', 'rgb(0, 128, 0)', 'rgb(0, 0, 255)'],
                ['apple', 'banana', 'clementine']
            );

            return Plotly.animate(gd, null, {frame: {redraw: false}});
        })
        .then(function() {
            _assertNodes(
                ['rgb(255, 0, 0)', 'rgb(0, 0, 255)', 'rgb(255, 255, 0)'],
                ['apple', 'banana', 'dragon fruit']
            );
        })
        .catch(fail)
        .then(done);
    });

    it('animates fillcolor', function(done) {
        function fill() {
            return d3.selectAll('.js-fill').node().style.fill;
        }

        Plotly.plot(gd, [{
            x: [1, 2, 3, 4, 5, 6, 7],
            y: [2, 3, 4, 5, 6, 7, 8],
            fill: 'tozeroy',
            fillcolor: 'rgb(255, 0, 0)',
        }]).then(function() {
            expect(fill()).toEqual('rgb(255, 0, 0)');
            return Plotly.animate(gd,
                [{data: [{fillcolor: 'rgb(0, 0, 255)'}]}],
                {frame: {duration: 0, redraw: false}}
            );
        }).then(function() {
            expect(fill()).toEqual('rgb(0, 0, 255)');
        }).catch(fail).then(done);
    });
});

describe('scatter hoverPoints', function() {

    afterEach(destroyGraphDiv);

    function _hover(gd, xval, yval, hovermode) {
        return gd._fullData.map(function(trace, i) {
            var cd = gd.calcdata[i];
            var subplot = gd._fullLayout._plots.xy;

            var out = Scatter.hoverPoints({
                index: false,
                distance: 20,
                cd: cd,
                trace: trace,
                xa: subplot.xaxis,
                ya: subplot.yaxis
            }, xval, yval, hovermode);

            return Array.isArray(out) ? out[0] : null;
        });
    }

    it('should show \'hovertext\' items when present, \'text\' if not', function(done) {
        var gd = createGraphDiv();
        var mock = Lib.extendDeep({}, require('@mocks/text_chart_arrays'));

        Plotly.plot(gd, mock).then(function() {
            var pts = _hover(gd, 0, 1, 'x');

            // as in 'hovertext' arrays
            expect(pts[0].text).toEqual('Hover text\nA', 'hover text');
            expect(pts[1].text).toEqual('Hover text G', 'hover text');
            expect(pts[2].text).toEqual('a (hover)', 'hover text');

            return Plotly.restyle(gd, 'hovertext', null);
        })
        .then(function() {
            var pts = _hover(gd, 0, 1, 'x');

            // as in 'text' arrays
            expect(pts[0].text).toEqual('Text\nA', 'hover text');
            expect(pts[1].text).toEqual('Text G', 'hover text');
            expect(pts[2].text).toEqual('a', 'hover text');

            return Plotly.restyle(gd, 'text', ['APPLE', 'BANANA', 'ORANGE']);
        })
        .then(function() {
            var pts = _hover(gd, 1, 1, 'x');

            // as in 'text' values
            expect(pts[0].text).toEqual('APPLE', 'hover text');
            expect(pts[1].text).toEqual('BANANA', 'hover text');
            expect(pts[2].text).toEqual('ORANGE', 'hover text');

            return Plotly.restyle(gd, 'hovertext', ['apple', 'banana', 'orange']);
        })
        .then(function() {
            var pts = _hover(gd, 1, 1, 'x');

            // as in 'hovertext' values
            expect(pts[0].text).toEqual('apple', 'hover text');
            expect(pts[1].text).toEqual('banana', 'hover text');
            expect(pts[2].text).toEqual('orange', 'hover text');
        })
        .catch(fail)
        .then(done);
    });
});

describe('Test Scatter.style', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function makeCheckFn(attr, getterFn) {
        return function(update, expectation, msg) {
            var msg2 = ' (' + msg + ')';
            var promise = update ? Plotly.restyle(gd, update) : Promise.resolve();
            var selector = attr.indexOf('textfont') === 0 ? '.textpoint > text' : '.point';

            return promise.then(function() {
                d3.selectAll('.trace').each(function(_, i) {
                    var pts = d3.select(this).selectAll(selector);
                    var expi = expectation[i];

                    expect(pts.size())
                        .toBe(expi.length, '# of pts for trace ' + i + msg2);

                    pts.each(function(_, j) {
                        var msg3 = ' for pt ' + j + ' in trace ' + i + msg2;
                        expect(getterFn(this)).toBe(expi[j], attr + msg3);
                    });
                });
            });
        };
    }

    var getOpacity = function(node) { return Number(node.style.opacity); };
    var getFillOpacity = function(node) { return Number(node.style['fill-opacity']); };
    var getColor = function(node) { return node.style.fill; };
    var getMarkerSize = function(node) {
        // find path arc multiply by 2 to get the corresponding marker.size value
        // (works for circles only)
        return d3.select(node).attr('d').split('A')[1].split(',')[0] * 2;
    };

    var r = 'rgb(255, 0, 0)';
    var g = 'rgb(0, 255, 0)';
    var b = 'rgb(0, 0, 255)';
    var y = 'rgb(255, 255, 0)';
    var c = 'rgb(0, 255, 255)';

    it('should style selected point marker opacity correctly', function(done) {
        var check = makeCheckFn('marker.opacity', getOpacity);

        Plotly.plot(gd, [{
            mode: 'markers',
            y: [1, 2, 1],
            marker: {opacity: 0.6}
        }, {
            mode: 'markers',
            y: [2, 1, 2],
            marker: {opacity: [0.5, 0.5, 0.5]}
        }])
        .then(function() {
            return check(
                null,
                [[0.6, 0.6, 0.6], [0.5, 0.5, 0.5]],
                'base case'
            );
        })
        .then(function() {
            return check(
                {selectedpoints: [[1]]},
                [[0.12, 0.6, 0.12], [0.1, 0.5, 0.1]],
                'selected pt 1 w/o [un]selected setting'
            );
        })
        .then(function() {
            return check(
                {'selected.marker.opacity': 1},
                [[0.12, 1, 0.12], [0.1, 1, 0.1]],
                'selected pt 1 w/ set selected.marker.opacity'
            );
        })
        .then(function() {
            return check(
                {selectedpoints: [[1, 2]]},
                [[0.12, 1, 1], [0.1, 1, 1]],
                'selected pt 1-2 w/ set selected.marker.opacity'
            );
        })
        .then(function() {
            return check(
                {selectedpoints: [[2]]},
                [[0.12, 0.12, 1], [0.1, 0.1, 1]],
                'selected pt 2 w/ set selected.marker.opacity'
            );
        })
        .then(function() {
            return check(
                {selectedpoints: null},
                [[0.6, 0.6, 0.6], [0.5, 0.5, 0.5]],
                'no selected pts w/ set selected.marker.opacity'
            );
        })
        .then(function() {
            return check(
                {selectedpoints: [[1]]},
                [[0.12, 1, 0.12], [0.1, 1, 0.1]],
                'selected pt 1 w/o [un]selected setting (take 2)'
            );
        })
        .then(function() {
            return check(
                {'unselected.marker.opacity': 0},
                [[0, 1, 0], [0, 1, 0]],
                'selected pt 1 w/ set [un]selected.marker.opacity'
            );
        })
        .then(function() {
            return check(
                {'selected.marker.opacity': null},
                [[0, 0.6, 0], [0, 0.5, 0]],
                'selected pt 1 w/ set unselected.marker.opacity'
            );
        })
        .catch(fail)
        .then(done);
    });

    it('should style selected point marker color correctly', function(done) {
        var check = makeCheckFn('marker.color', getColor);
        var checkOpacity = makeCheckFn('marker.opacity', getOpacity);

        Plotly.plot(gd, [{
            mode: 'markers',
            y: [1, 2, 1],
            marker: {color: b}
        }, {
            mode: 'markers',
            y: [2, 1, 2],
            marker: {color: [r, g, b]}
        }])
        .then(function() {
            return check(
                null,
                [[b, b, b], [r, g, b]],
                'base case'
            );
        })
        .then(function() {
            return check(
                {selectedpoints: [[0, 2]]},
                [[b, b, b], [r, g, b]],
                'selected pts 0-2 w/o [un]selected setting'
            );
        })
        .then(function() {
            return checkOpacity(
                null,
                [[1, 0.2, 1], [1, 0.2, 1]],
                'selected pts 0-2 w/o [un]selected setting [should just change opacity]'
            );
        })
        .then(function() {
            return check(
                {'selected.marker.color': y},
                [[y, b, y], [y, g, y]],
                'selected pts 0-2 w/ set selected.marker.color'
            );
        })
        .then(function() {
            return checkOpacity(
                null,
                [[1, 1, 1], [1, 1, 1]],
                'selected pts 0-2 w/o [un]selected setting [should NOT change opacity]'
            );
        })
        .then(function() {
            return check(
                {selectedpoints: [[1, 2]]},
                [[b, y, y], [r, y, y]],
                'selected pt 1-2 w/ set selected.marker.color'
            );
        })
        .then(function() {
            return check(
                {selectedpoints: null},
                [[b, b, b], [r, g, b]],
                'no selected pts w/ set selected.marker.color'
            );
        })
        .then(function() {
            return check(
                {selectedpoints: [[0, 2]]},
                [[y, b, y], [y, g, y]],
                'selected pts 0-2 w/ set selected.marker.color (take 2)'
            );
        })
        .then(function() {
            return check(
                {'unselected.marker.color': c},
                [[y, c, y], [y, c, y]],
                'selected pts 0-2 w/ set [un]selected.marker.color'
            );
        })
        .then(function() {
            return check(
                {'selected.marker.color': null},
                [[b, c, b], [r, c, b]],
                'selected pts 0-2 w/ set selected.marker.color'
            );
        })
        .catch(fail)
        .then(done);
    });

    it('should style selected point marker size correctly', function(done) {
        var check = makeCheckFn('marker.size', getMarkerSize);

        Plotly.plot(gd, [{
            mode: 'markers',
            y: [1, 2, 1],
            marker: {size: 20}
        }, {
            mode: 'markers',
            y: [2, 1, 2],
            marker: {size: [15, 25, 35]}
        }])
        .then(function() {
            return check(
                null,
                [[20, 20, 20], [15, 25, 35]],
                'base case'
            );
        })
        .then(function() {
            return check(
                {selectedpoints: [[0]], 'selected.marker.size': 40},
                [[40, 20, 20], [40, 25, 35]],
                'selected pt 0 w/ set selected.marker.size'
            );
        })
        .then(function() {
            return check(
                {'unselected.marker.size': 0},
                [[40, 0, 0], [40, 0, 0]],
                'selected pt 0 w/ set [un]selected.marker.size'
            );
        })
        .then(function() {
            return check(
                {'selected.marker.size': null},
                [[20, 0, 0], [15, 0, 0]],
                'selected pt 0 w/ set unselected.marker.size'
            );
        })
        .catch(fail)
        .then(done);
    });

    it('should style selected point textfont correctly', function(done) {
        var checkFontColor = makeCheckFn('textfont.color', getColor);
        var checkFontOpacity = makeCheckFn('textfont.color (alpha channel)', getFillOpacity);
        var checkPtOpacity = makeCheckFn('marker.opacity', getOpacity);

        Plotly.plot(gd, [{
            mode: 'markers+text',
            y: [1, 2, 1],
            text: 'TEXT',
            textfont: {color: b}
        }, {
            mode: 'markers+text',
            y: [2, 1, 2],
            text: ['A', 'B', 'C'],
            textfont: {color: [r, g, b]}
        }])
        .then(function() {
            return checkFontColor(
                null,
                [[b, b, b], [r, g, b]],
                'base case'
            );
        })
        .then(function() {
            return checkFontColor(
                {selectedpoints: [[0, 2]]},
                [[b, b, b], [r, g, b]],
                'selected pts 0-2 w/o [un]selected setting'
            );
        })
        .then(function() {
            return checkFontOpacity(
                null,
                [[1, 0.2, 1], [1, 0.2, 1]],
                'selected pts 0-2 w/o [un]selected setting [should change font color alpha]'
            );
        })
        .then(function() {
            return checkPtOpacity(
                null,
                [[1, 0.2, 1], [1, 0.2, 1]],
                'selected pts 0-2 w/o [un]selected setting [should change pt opacity]'
            );
        })
        .then(function() {
            return checkFontColor(
                {'selected.textfont.color': y},
                [[y, b, y], [y, g, y]],
                'selected pts 0-2 w/ set selected.textfont.color'
            );
        })
        .then(function() {
            return checkFontOpacity(
                null,
                [[1, 1, 1], [1, 1, 1]],
                'selected pts 0-2 w set selected.textfont.color [should NOT change font color alpha]'
            );
        })
        .then(function() {
            return checkPtOpacity(
                null,
                [[1, 1, 1], [1, 1, 1]],
                'selected pts 0-2 w/o [un]selected setting [should NOT change opacity]'
            );
        })
        .then(function() {
            return checkFontColor(
                {'unselected.textfont.color': c},
                [[y, c, y], [y, c, y]],
                'selected pts 0-2 w/ set [un]selected.textfont.color'
            );
        })
        .then(function() {
            return checkFontColor(
                {'selected.textfont.color': null},
                [[b, c, b], [r, c, b]],
                'selected pts 0-2 w/ set selected.textfont.color'
            );
        })
        .catch(fail)
        .then(done);
    });
});

describe('Test scatter *clipnaxis*:', function() {
    afterEach(destroyGraphDiv);

    it('should show/hide point/text/errorbars in clipped and non-clipped layers', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('@mocks/cliponaxis_false.json'));
        var xRange0 = fig.layout.xaxis.range.slice();
        var yRange0 = fig.layout.yaxis.range.slice();

        // only show 1 *cliponaxis: false* trace
        fig.data = [fig.data[2]];

        // add lines
        fig.data[0].mode = 'markers+lines+text';

        function _assert(layerClips, nodeDisplays, errorBarClips, lineClips) {
            var subplotLayer = d3.select('.plot');
            var scatterLayer = subplotLayer.select('.scatterlayer');

            assertClip(subplotLayer, layerClips[0], 1, 'subplot layer');
            assertClip(subplotLayer.select('.barlayer'), layerClips[1], 1, 'bar layer');
            assertClip(scatterLayer, layerClips[2], 1, 'scatter layer');

            assertNodeDisplay(
                scatterLayer.selectAll('.point'),
                nodeDisplays,
                'scatter points'
            );
            assertNodeDisplay(
                scatterLayer.selectAll('.textpoint'),
                nodeDisplays,
                'scatter text points'
            );

            assertClip(
                scatterLayer.selectAll('.errorbar'),
                errorBarClips[0], errorBarClips[1],
                'error bars'
            );
            assertClip(
                scatterLayer.selectAll('.js-line'),
                lineClips[0], lineClips[1],
                'line clips'
            );
        }

        Plotly.plot(gd, fig)
        .then(function() {
            _assert(
                [false, true, false],
                [null, null, null, null, null, null],
                [true, 6],
                [true, 1]
            );
            return Plotly.restyle(gd, 'visible', false);
        })
        .then(function() {
            _assert(
                [true, false, false],
                [],
                [false, 0],
                [false, 0]
            );
            return Plotly.restyle(gd, {visible: true, cliponaxis: null});
        })
        .then(function() {
            _assert(
                [true, false, false],
                [null, null, null, null, null, null],
                [false, 6],
                [false, 1]
            );
            return Plotly.restyle(gd, 'visible', 'legendonly');
        })
        .then(function() {
            _assert(
                [true, false, false],
                [],
                [false, 0],
                [false, 0]
            );
            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            _assert(
                [true, false, false],
                [null, null, null, null, null, null],
                [false, 6],
                [false, 1]
            );
            return Plotly.restyle(gd, 'cliponaxis', false);
        })
        .then(function() {
            _assert(
                [false, true, false],
                [null, null, null, null, null, null],
                [true, 6],
                [true, 1]
            );
            return Plotly.relayout(gd, 'xaxis.range', [0, 1]);
        })
        .then(function() {
            _assert(
                [false, true, false],
                [null, null, 'none', 'none', 'none', 'none'],
                [true, 6],
                [true, 1]
            );
            return Plotly.relayout(gd, 'yaxis.range', [0, 1]);
        })
        .then(function() {
            _assert(
                [false, true, false],
                ['none', null, 'none', 'none', 'none', 'none'],
                [true, 6],
                [true, 1]
            );
            return Plotly.relayout(gd, {'xaxis.range': xRange0, 'yaxis.range': yRange0});
        })
        .then(function() {
            _assert(
                [false, true, false],
                [null, null, null, null, null, null],
                [true, 6],
                [true, 1]
            );
        })
        .catch(fail)
        .then(done);
    });
});
