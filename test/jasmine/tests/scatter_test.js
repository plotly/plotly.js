var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var Scatter = require('../../../src/traces/scatter');
var makeBubbleSizeFn = require('../../../src/traces/scatter/make_bubble_size_func');
var linePoints = require('../../../src/traces/scatter/line_points');
var Lib = require('../../../src/lib');
var Plots = require('../../../src/plots/plots');

var Plotly = require('../../../lib/index');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customAssertions = require('../assets/custom_assertions');
var negateIf = require('../assets/negate_if');

var transitions = require('../assets/transitions');

var assertClip = customAssertions.assertClip;
var assertNodeDisplay = customAssertions.assertNodeDisplay;
var assertMultiNodeOrder = customAssertions.assertMultiNodeOrder;
var checkEventData = require('../assets/check_event_data');
var checkTextTemplate = require('../assets/check_texttemplate');
var constants = require('../../../src/traces/scatter/constants');

var supplyAllDefaults = require('../assets/supply_defaults');

var getOpacity = function(node) { return Number(node.style.opacity); };
var getFillOpacity = function(node) { return Number(node.style['fill-opacity']); };
var getColor = function(node) { return node.style.fill; };
var getMarkerSize = function(node) {
    // find path arc multiply by 2 to get the corresponding marker.size value
    // (works for circles only)
    return d3Select(node).attr('d').split('A')[1].split(',')[0] * 2;
};

describe('Test scatter', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn;
        var traceOut;

        var defaultColor = '#444';
        var layout = {};

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

        [{letter: 'y', counter: 'x'}, {letter: 'x', counter: 'y'}].forEach(function(spec) {
            var l = spec.letter;
            var c = spec.counter;
            var c0 = c + '0';
            var dc = 'd' + c;
            it('should be visible using ' + c0 + '/' + dc + ' if ' + c + ' is missing completely but ' + l + ' is present', function() {
                traceIn = {};
                traceIn[spec.letter] = [1, 2];
                supplyDefaults(traceIn, traceOut, defaultColor, layout);
                expect(traceOut.visible).toBe(undefined, l); // visible: true gets set above the module level
                expect(traceOut._length).toBe(2, l);
                expect(traceOut[c0]).toBe(0, c0);
                expect(traceOut[dc]).toBe(1, dc);
            });
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
            function _supply(patch) {
                traceIn = Lib.extendFlat({
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

        describe('should find correct coordinate length', function() {
            function _supply() {
                supplyDefaults(traceIn, traceOut, defaultColor, layout);
            }

            it('- x 2d', function() {
                traceIn = {
                    x: [
                        ['1', '2', '1', '2', '1', '2'],
                        ['a', 'a', 'b', 'b']
                    ],
                };
                _supply();
                expect(traceOut._length).toBe(4);
            });

            it('- y 2d', function() {
                traceIn = {
                    y: [
                        ['1', '2', '1', '2', '1', '2'],
                        ['a', 'a', 'b', 'b']
                    ],
                };
                _supply();
                expect(traceOut._length).toBe(4);
            });

            it('- x 2d / y 1d', function() {
                traceIn = {
                    x: [
                        ['1', '2', '1', '2', '1', '2'],
                        ['a', 'a', 'b', 'b']
                    ],
                    y: [1, 2, 3, 4, 5, 6]
                };
                _supply();
                expect(traceOut._length).toBe(4);
            });

            it('- x 1d / y 2d', function() {
                traceIn = {
                    y: [
                        ['1', '2', '1', '2', '1', '2'],
                        ['a', 'a', 'b', 'b']
                    ],
                    x: [1, 2, 3, 4, 5, 6]
                };
                _supply();
                expect(traceOut._length).toBe(4);
            });

            it('- x 2d / y 2d', function() {
                traceIn = {
                    x: [
                        ['1', '2', '1', '2', '1', '2'],
                        ['a', 'a', 'b', 'b', 'c', 'c']
                    ],
                    y: [
                        ['1', '2', '1', '2', '1', '2'],
                        ['a', 'a', 'b', 'b', 'c', 'c', 'd', 'd']
                    ]
                };
                _supply();
                expect(traceOut._length).toBe(6);
            });
        });
    });

    describe('calc', function() {
        function assertPointField(calcData, prop, expectation) {
            var values = [];

            calcData.forEach(function(calcTrace) {
                var vals = calcTrace.map(function(pt) {
                    return Lib.nestedProperty(pt, prop).get();
                });

                values.push(vals);
            });

            expect(values).toBeCloseTo2DArray(expectation, undefined, '(field ' + prop + ')');
        }

        it('should guard against negative size values', function() {
            var gd = {
                data: [{
                    type: 'scatter',
                    mode: 'markers+text',
                    marker: {
                        line: {
                            width: [2, 1, 0, -1, false, true, null, [], -Infinity, Infinity, NaN, {}, '12+1', '1e1']
                        },
                        opacity: [2, 1, 0, -1, false, true, null, [], -Infinity, Infinity, NaN, {}, '12+1', '1e1'],
                        size: [2, 1, 0, -1, false, true, null, [], -Infinity, Infinity, NaN, {}, '12+1', '1e1']
                    },
                    textfont: {
                        size: [2, 1, 0, -1, false, true, null, [], -Infinity, Infinity, NaN, {}, '12+1', '1e1']
                    },
                    text: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
                    y: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
                }],
                layout: {},
                calcdata: [],
                _context: {locale: 'en', locales: {}}
            };

            supplyAllDefaults(gd);
            Plots.doCalcdata(gd);

            var cd = gd.calcdata;
            assertPointField(cd, 'mlw', [[2, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 10]]);
            assertPointField(cd, 'mo', [[2, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 10]]);
            assertPointField(cd, 'ms', [[2, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 10]]);
            assertPointField(cd, 'ts', [[2, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 10]]);
        });
    });

    describe('isBubble', function() {
        it('should return true when marker.size is an Array', function() {
            var trace = {
                marker: {
                    size: [1, 4, 2, 10]
                }
            };
            var isBubble = Scatter.isBubble(trace);

            expect(isBubble).toBe(true);
        });

        it('should return false when marker.size is an number', function() {
            var trace = {
                marker: {
                    size: 10
                }
            };
            var isBubble = Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });

        it('should return false when marker.size is not defined', function() {
            var trace = {
                marker: {
                    color: 'red'
                }
            };
            var isBubble = Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });

        it('should return false when marker is not defined', function() {
            var trace = {
                line: {
                    color: 'red'
                }
            };
            var isBubble = Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });
    });

    describe('makeBubbleSizeFn', function() {
        var markerSizes = [
            0, '1', 2.21321321, 'not-a-number',
            100, 1000.213213, 1e7, undefined, null, -100
        ];
        var trace = { marker: {} };

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
        var ax = {_length: 100, c2p: Lib.identity};
        var baseOpts = {
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
            var ptsIn = [[0, 0], [5, 10], [13, 26], [15, 30], [15, 30], [15, 30], [15, 30]];
            var ptsOut = callLinePoints(ptsIn, {simplify: false});
            expect(ptsOut).toEqual([ptsIn]);
        });

        it('should not collapse duplicate end points if simplify is false', function() {
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

        function reverseXY(v) { return [v[1], v[0]]; }

        function reverseXY2(v) { return v.map(reverseXY); }

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

        it('works when far off-screen points cross the viewport', function() {
            function _check(ptsIn, ptsExpected) {
                var ptsOut = callLinePoints(ptsIn);
                expect(JSON.stringify(ptsOut)).toEqual(JSON.stringify([ptsExpected]));

                var ptsOut2 = callLinePoints(ptsIn.map(reverseXY)).map(reverseXY2);
                expect(JSON.stringify(ptsOut2)).toEqual(JSON.stringify([ptsExpected]));
            }

            // first cross the viewport horizontally/vertically
            _check([
                [-822, 20], [-802, 2], [-801.5, 1.1], [-800, 0],
                [900, 0], [901.5, 1.1], [902, 2], [922, 20]
            ], [
                // all that's really important here (and the next check) is that
                // the points [-800, 0] and [900, 0] are connected. What we do
                // with other points beyond those doesn't matter too much.
                [-822, 20], [-800, 0],
                [900, 0], [922, 20]
            ]);

            _check([
                [-804, 4], [-802, 2], [-801.5, 1.1], [-800, 0],
                [900, 0], [901.5, 1.1], [902, 2], [904, 4]
            ], [
                [-804, 4], [-800, 0],
                [900, 0]
            ]);

            // now cross the viewport diagonally
            _check([
                [-801, 925], [-800, 902], [-800.5, 901.1], [-800, 900],
                [900, -800], [900.5, -801.1], [900, -802], [901, -825]
            ], [
                // similarly here, we just care that
                // [-800, 900] connects to [900, -800]
                [-801, 925], [-800, 900],
                [900, -800], [901, -825]
            ]);
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
        Plotly.newPlot(gd, [{
            x: [1, 2, 3, 4, 5, 6, 7],
            y: [2, 3, 4, 5, 6, 7, 8],
            customdata: [null, undefined, 0, false, {foo: 'bar'}, 'a']
        }]).then(function() {
            var points = d3SelectAll('g.scatterlayer').selectAll('.point');

            // Rather than just duplicating the logic, let's be explicit about
            // what's expected. Specifially, only null and undefined (the default)
            // do *not* add the class.
            var expected = [false, false, true, true, true, true, false];

            points.each(function(cd, i) {
                expect(d3Select(this).classed('plotly-customdata')).toBe(expected[i]);
            });

            return Plotly.animate(gd, [{
                data: [{customdata: []}]
            }], {frame: {redraw: false, duration: 0}});
        }).then(function() {
            var points = d3SelectAll('g.scatterlayer').selectAll('.point');

            points.each(function() {
                expect(d3Select(this).classed('plotly-customdata')).toBe(false);
            });
        }).then(done, done.fail);
    });

    it('adds "textpoint" class to scatter text points', function(done) {
        Plotly.newPlot(gd, [{
            mode: 'text',
            x: [1, 2, 3],
            y: [2, 3, 4],
            text: ['a', 'b', 'c']
        }]).then(function() {
            expect(d3SelectAll('.textpoint').size()).toBe(3);
        }).then(done, done.fail);
    });

    it('should remove all point and text nodes on blank data', function(done) {
        function assertNodeCnt(ptCnt, txCnt) {
            expect(d3SelectAll('.point').size()).toEqual(ptCnt);
            expect(d3SelectAll('.textpoint').size()).toEqual(txCnt);
        }

        function assertText(content) {
            d3SelectAll('.textpoint').each(function(_, i) {
                var tx = d3Select(this).select('text');
                expect(tx.text()).toEqual(content[i]);
            });
        }

        Plotly.newPlot(gd, [{
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
        .then(done, done.fail);
    });

    it('should keep layering correct as mode & fill change', function(done) {
        var fillCase = {name: 'fill', edit: {mode: 'none', fill: 'tonexty'}};
        var i, j;

        var cases = [fillCase];
        var modeParts = ['lines', 'markers', 'text'];
        for(i = 0; i < modeParts.length; i++) {
            var modePart = modeParts[i];
            var prevCasesLength = cases.length;

            cases.push({name: modePart, edit: {mode: modePart, fill: 'none'}});
            for(j = 0; j < prevCasesLength; j++) {
                var prevCase = cases[j];
                cases.push({
                    name: prevCase.name + '_' + modePart,
                    edit: {
                        mode: (prevCase.edit.mode === 'none' ? '' : (prevCase.edit.mode + '+')) + modePart,
                        fill: prevCase.edit.fill
                    }
                });
            }
        }

        // visit each case N times, in an order that covers each *transition*
        // from any case to any other case.
        var indices = transitions(cases.length);

        var p = Plotly.newPlot(gd, [
            {y: [1, 2], text: 'a'},
            {y: [2, 3], text: 'b'},
            {y: [3, 4], text: 'c'}
        ]);

        function setMode(i) {
            return function() {
                return Plotly.restyle(gd, cases[indices[i]].edit);
            };
        }

        function testOrdering(i) {
            return function() {
                var name = cases[indices[i]].name;
                var hasFills = name.indexOf('fill') !== -1;
                var hasLines = name.indexOf('lines') !== -1;
                var hasMarkers = name.indexOf('markers') !== -1;
                var tracei, prefix;

            // construct the expected ordering based on case name
                var selectorArray = [];
                for(tracei = 0; tracei < 3; tracei++) {
                    prefix = '.xy .trace:nth-child(' + (tracei + 1) + ') ';

                // two fills are attached to the first trace, one to the second
                    if(hasFills) {
                        if(tracei === 0) {
                            selectorArray.push(
                            prefix + 'g:first-child>.js-fill',
                            prefix + 'g:last-child>.js-fill');
                        } else if(tracei === 1) selectorArray.push(prefix + 'g:last-child>.js-fill');
                    }
                    if(hasLines) selectorArray.push(prefix + '.js-line');
                    if(hasMarkers) selectorArray.push(prefix + '.point');
                }

            // ordering in the legend
                for(tracei = 0; tracei < 3; tracei++) {
                    prefix = '.legend .traces:nth-child(' + (tracei + 1) + ') ';
                    if(hasFills) selectorArray.push(prefix + '.js-fill');
                    if(hasLines) selectorArray.push(prefix + '.js-line');
                    if(hasMarkers) selectorArray.push(prefix + '.scatterpts');
                }

                var msg = i ? ('from ' + cases[indices[i - 1]].name + ' to ') : 'from default to ';
                msg += name;
                assertMultiNodeOrder(selectorArray, msg);
            };
        }

        for(i = 0; i < indices.length; i++) {
            p = p.then(setMode(i)).then(testOrdering(i));
        }

        p.then(done, done.fail);
    });

    function _assertNodes(ptStyle, txContent) {
        var pts = d3SelectAll('.point');
        var txs = d3SelectAll('.textpoint');

        expect(pts.size()).toEqual(ptStyle.length);
        expect(txs.size()).toEqual(txContent.length);

        pts.each(function(_, i) {
            expect(this.style.fill).toEqual(ptStyle[i], 'pt ' + i);
        });

        txs.each(function(_, i) {
            expect(d3Select(this).select('text').text()).toEqual(txContent[i], 'tx ' + i);
        });
    }

    it('should smoothly add/remove nodes tags with *ids* during animations', function(done) {
        Plotly.newPlot(gd, {
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
        .then(done, done.fail);
    });

    it('animates fillcolor', function(done) {
        function fill() {
            return d3SelectAll('.js-fill').node().style.fill;
        }

        Plotly.newPlot(gd, [{
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
        }).then(done, done.fail);
    });

    it('clears fills tonext when either trace is emptied out', function(done) {
        var trace0 = {y: [1, 3, 5, 7]};
        var trace1 = {y: [1, 2, 3, 4], line: {width: 0}, mode: 'lines'};
        var trace2 = {y: [3, 4, 5, 6], fill: 'tonexty', mode: 'none'};

        function checkFill(visible, msg) {
            var fillSelection = d3Select(gd).selectAll('.scatterlayer .js-fill');
            expect(fillSelection.size()).toBe(1, msg);
            negateIf(visible, expect(fillSelection.attr('d'))).toBe('M0,0Z', msg);
        }

        Plotly.newPlot(gd, [trace0, trace1, trace2], {}, {scrollZoom: true})
        .then(function() {
            checkFill(true, 'initial');

            return Plotly.restyle(gd, {y: [[null, null, null, null]]}, [1]);
        })
        .then(function() {
            checkFill(false, 'null out trace 1');

            return Plotly.restyle(gd, {y: [[1, 2, 3, 4]]}, [1]);
        })
        .then(function() {
            checkFill(true, 'restore trace 1');

            return Plotly.restyle(gd, {y: [[null, null, null, null]]}, [2]);
        })
        .then(function() {
            checkFill(false, 'null out trace 2');

            return Plotly.restyle(gd, {y: [[1, 2, 3, 4]]}, [2]);
        })
        .then(function() {
            checkFill(true, 'restore trace 2');

            return Plotly.restyle(gd, {y: [[null, null, null, null], [null, null, null, null]]}, [1, 2]);
        })
        .then(function() {
            checkFill(false, 'null out both traces');
        })
        .then(done, done.fail);
    });

    it('updates line segments on redraw when having null values', function(done) {
        function checkSegments(exp, msg) {
            var lineSelection = d3Select(gd).selectAll('.scatterlayer .js-line');
            expect(lineSelection.size()).toBe(exp, msg);
        }

        Plotly.newPlot(gd, [{
            y: [1, null, 2, 3],
            mode: 'lines+markers'
        }])
        .then(function() {
            checkSegments(2, 'inital');

            return Plotly.relayout(gd, 'xaxis.range', [0, 10]);
        })
        .then(function() {
            checkSegments(2, 'after redraw');
        })
        .then(done, done.fail);
    });

    it('correctly autoranges fill tonext traces across multiple subplots', function(done) {
        Plotly.newPlot(gd, [
            {y: [3, 4, 5], fill: 'tonexty'},
            {y: [4, 5, 6], fill: 'tonexty'},
            {y: [3, 4, 5], fill: 'tonexty', yaxis: 'y2'},
            {y: [4, 5, 6], fill: 'tonexty', yaxis: 'y2'}
        ], {})
        .then(function() {
            expect(gd._fullLayout.yaxis.range[0]).toBe(0);
            // when we had a single `gd.firstscatter` this one was ~2.73
            // even though the fill was correctly drawn down to zero
            expect(gd._fullLayout.yaxis2.range[0]).toBe(0);
        })
        .then(done, done.fail);
    });

    it('correctly autoranges fill tonext traces with only one point', function(done) {
        Plotly.newPlot(gd, [{y: [3], fill: 'tonexty'}])
        .then(function() {
            expect(gd._fullLayout.yaxis.range[0]).toBe(0);
        })
        .then(done, done.fail);
    });

    it('should work with typed arrays', function(done) {
        function _assert(colors, sizes) {
            var pts = d3SelectAll('.point');
            expect(pts.size()).toBe(3, '# of pts');

            pts.each(function(_, i) {
                expect(getColor(this)).toBe(colors[i], 'color ' + i);
                expect(getMarkerSize(this)).toBe(sizes[i], 'size ' + i);
            });
        }

        Plotly.newPlot(gd, [{
            x: new Float32Array([1, 2, 3]),
            y: new Float32Array([1, 2, 1]),
            marker: {
                size: new Float32Array([20, 30, 10]),
                color: new Float32Array([10, 30, 20]),
                cmin: 10,
                cmax: 30,
                colorscale: [
                    [0, 'rgb(255, 0, 0)'],
                    [0.5, 'rgb(0, 255, 0)'],
                    [1, 'rgb(0, 0, 255)']
                ]
            }
        }])
        .then(function() {
            _assert(
                ['rgb(255, 0, 0)', 'rgb(0, 0, 255)', 'rgb(0, 255, 0)'],
                [20, 30, 10]
            );

            return Plotly.restyle(gd, {
                'marker.size': [new Float32Array([40, 30, 20])],
                'marker.color': [new Float32Array([20, 30, 10])]
            });
        })
        .then(function() {
            _assert(
                ['rgb(0, 255, 0)', 'rgb(0, 0, 255)', 'rgb(255, 0, 0)'],
                [40, 30, 20]
            );

            return Plotly.relayout(gd, 'showlegend', true);
        })
        .then(function() {
            _assert(
                ['rgb(0, 255, 0)', 'rgb(0, 0, 255)', 'rgb(255, 0, 0)'],
                [40, 30, 20]
            );

            var legendPts = d3Select('.legend').selectAll('.scatterpts');
            expect(legendPts.size()).toBe(1, '# legend items');
            expect(getColor(legendPts.node())).toBe('rgb(0, 255, 0)', 'legend pt color');
            expect(getMarkerSize(legendPts.node())).toBe(16, 'legend pt size');
        })
        .then(done, done.fail);
    });

    function assertAxisRanges(msg, xrng, yrng) {
        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.range).toBeCloseToArray(xrng, 2, msg + ' xrng');
        expect(fullLayout.yaxis.range).toBeCloseToArray(yrng, 2, msg + ' yrng');
    }

    var schema = Plotly.PlotSchema.get();

    it('should update axis range accordingly on marker.size edits', function(done) {
        // edit types are important to this test
        expect(schema.traces.scatter.attributes.marker.size.editType)
            .toBe('calc', 'marker.size editType');
        expect(schema.layout.layoutAttributes.xaxis.autorange.editType)
            .toBe('axrange', 'ax autorange editType');

        Plotly.newPlot(gd, [{ y: [1, 2, 1] }])
        .then(function() {
            assertAxisRanges('auto rng / base marker.size', [-0.13, 2.13], [0.93, 2.07]);
            return Plotly.relayout(gd, {
                'xaxis.range': [0, 2],
                'yaxis.range': [0, 2]
            });
        })
        .then(function() {
            assertAxisRanges('set rng / base marker.size', [0, 2], [0, 2]);
            return Plotly.restyle(gd, 'marker.size', 50);
        })
        .then(function() {
            assertAxisRanges('set rng / big marker.size', [0, 2], [0, 2]);
            return Plotly.relayout(gd, {
                'xaxis.autorange': true,
                'yaxis.autorange': true
            });
        })
        .then(function() {
            assertAxisRanges('auto rng / big marker.size', [-0.28, 2.28], [0.75, 2.25]);
            return Plotly.restyle(gd, 'marker.size', null);
        })
        .then(function() {
            assertAxisRanges('auto rng / base marker.size', [-0.13, 2.13], [0.93, 2.07]);
        })
        .then(done, done.fail);
    });

    it('should update axis range according to visible edits', function(done) {
        Plotly.newPlot(gd, [
            {x: [1, 2, 3], y: [1, 2, 1]},
            {x: [4, 5, 6], y: [-1, -2, -1]}
        ])
        .then(function() {
            assertAxisRanges('both visible', [0.676, 6.323], [-2.29, 2.29]);
            return Plotly.restyle(gd, 'visible', false, [1]);
        })
        .then(function() {
            assertAxisRanges('visible [true,false]', [0.87, 3.128], [0.926, 2.07]);
            return Plotly.restyle(gd, 'visible', false, [0]);
        })
        .then(function() {
            assertAxisRanges('both invisible', [0.87, 3.128], [0.926, 2.07]);
            return Plotly.restyle(gd, 'visible', true, [1]);
        })
        .then(function() {
            assertAxisRanges('visible [false,true]', [3.871, 6.128], [-2.07, -0.926]);
            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            assertAxisRanges('back to both visible', [0.676, 6.323], [-2.29, 2.29]);
        })
        .then(done, done.fail);
    });

    it('should be able to start from visible:false', function(done) {
        function _assert(msg, cnt) {
            var layer = d3Select(gd).select('g.scatterlayer');
            expect(layer.selectAll('.point').size()).toBe(cnt, msg + '- scatter pts cnt');
        }

        Plotly.newPlot(gd, [{
            visible: false,
            y: [1, 2, 1]
        }])
        .then(function() {
            _assert('visible:false', 0);
            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            _assert('visible:true', 3);
            return Plotly.restyle(gd, 'visible', false);
        })
        .then(function() {
            _assert('back to visible:false', 0);
        })
        .then(done, done.fail);
    });

    it('should not error out when segment-less marker-less fill traces', function(done) {
        Plotly.newPlot(gd, [{
            x: [1, 2, 3, 4],
            y: [null, null, null, null],
            fill: 'tonexty'
        }])
        .then(function() {
            expect(d3SelectAll('.js-fill').size()).toBe(1, 'js-fill is there');
            expect(d3Select('.js-fill').attr('d')).toBe('M0,0Z', 'js-fill has an empty path');
        })
        .then(done, done.fail);
    });
});

describe('Text templates on scatter traces:', function() {
    checkTextTemplate([{
        type: 'scatter',
        mode: 'markers+lines+text',
        y: [1, 5, 3, 2],
        textposition: 'top'
    }], '.textpoint', [
      ['%{y}', ['1', '5', '3', '2']],
      [['%{y}', '%{x}-%{y}'], ['1', '1-5', '', '']]
    ]);

    checkTextTemplate({
        data: [{
            type: 'scatter',
            mode: 'text',
            x: [1, 2, 3],
            y: [3, 2, 1],
            texttemplate: '%{x}-%{y}'
        }],
        layout: {
            xaxis: {type: 'log'},
            yaxis: {type: 'log'},
        }
    }, '.textpoint', [
      ['%{x}-%{y}', ['1-3', '2-2', '3-1']]
    ]);

    checkTextTemplate({
        data: [{
            type: 'scatter',
            mode: 'text',
            x: ['a', 'b'],
            y: ['1000', '1200']
        }],
        layout: {
            xaxis: { tickprefix: '*', ticksuffix: '*' },
            yaxis: { tickprefix: '$', ticksuffix: ' !', tickformat: '.2f'}
        }
    }, '.textpoint', [
        ['%{x} is %{y}', ['*a* is $1000.00 !', '*b* is $1200.00 !']]
    ]);
});

describe('stacked area', function() {
    var gd;

    beforeEach(function() { gd = createGraphDiv(); });
    afterEach(destroyGraphDiv);
    var mock = require('../../image/mocks/stacked_area');

    it('updates ranges correctly when traces are toggled', function(done) {
        function checkRanges(ranges, msg) {
            for(var axId in ranges) {
                var axName = axId.charAt(0) + 'axis' + axId.slice(1);
                expect(gd._fullLayout[axName].range)
                    .toBeCloseToArray(ranges[axId], 0.1, msg + ' - ' + axId);
            }
        }

        var bottoms = [0, 3, 6, 9, 12, 15];
        var middles = [1, 4, 7, 10, 13, 16];
        var midsAndBottoms = bottoms.concat(middles);

        Plotly.newPlot(gd, Lib.extendDeep({}, mock))
        .then(function() {
            // initial ranges, as in the baseline image
            var xr = [1, 7];
            checkRanges({
                x: xr, x2: xr, x3: xr, x4: xr, x5: xr, x6: xr,
                y: [0, 8.42], y2: [0, 10.53],
                // TODO: for normalized data, perhaps we want to
                // remove padding from the top (like we do from the zero)
                // when data stay within the normalization limit?
                // (y3&4 are more padded because they have markers)
                y3: [0, 1.08], y4: [0, 1.08], y5: [0, 105.26], y6: [0, 105.26]
            }, 'base case');

            return Plotly.restyle(gd, 'visible', 'legendonly', middles);
        })
        .then(function() {
            var xr = [2, 6];
            checkRanges({
                x: xr, x2: xr, x3: xr, x4: xr, x5: xr, x6: xr,
                y: [0, 4.21], y2: [0, 5.26],
                y3: [0, 1.08], y4: [0, 1.08], y5: [0, 105.26], y6: [0, 105.26]
            }, 'middle trace legendonly');

            return Plotly.restyle(gd, 'visible', false, middles);
        })
        .then(function() {
            var xr = [2, 6];
            checkRanges({
                x: xr, x2: xr, x3: xr, x4: xr, x5: xr, x6: xr,
                // now we lose the explicit config from the bottom trace,
                // which we kept when it was visible: 'legendonly'
                y: [0, 4.21], y2: [0, 4.21],
                y3: [0, 4.32], y4: [0, 1.08], y5: [0, 105.26], y6: [0, 5.26]
            }, 'middle trace visible: false');

            // put the bottom traces back to legendonly so they still contribute
            // config attributes, and hide the middles too
            return Plotly.restyle(gd, 'visible', 'legendonly', midsAndBottoms);
        })
        .then(function() {
            var xr = [3, 5];
            checkRanges({
                x: xr, x2: xr, x3: xr, x4: xr, x5: xr, x6: xr,
                y: [0, 2.11], y2: [0, 2.11],
                y3: [0, 1.08], y4: [0, 1.08], y5: [0, 105.26], y6: [0, 105.26]
            }, 'only top trace showing');

            return Plotly.restyle(gd, 'visible', true, middles);
        })
        .then(function() {
            var xr = [1, 7];
            checkRanges({
                x: xr, x2: xr, x3: xr, x4: xr, x5: xr, x6: xr,
                y: [0, 7.37], y2: [0, 7.37],
                y3: [0, 1.08], y4: [0, 1.08], y5: [0, 105.26], y6: [0, 105.26]
            }, 'top and middle showing');

            return Plotly.restyle(gd, {x: null, y: null}, middles);
        })
        .then(function() {
            return Plotly.restyle(gd, 'visible', true, bottoms);
        })
        .then(function() {
            var xr = [2, 6];
            // an invalid trace (no data) implicitly has visible: false, and is
            // equivalent to explicit visible: false in removing stack config.
            checkRanges({
                x: xr, x2: xr, x3: xr, x4: xr, x5: xr, x6: xr,
                y: [0, 4.21], y2: [0, 4.21],
                y3: [0, 4.32], y4: [0, 1.08], y5: [0, 105.26], y6: [0, 5.26]
            }, 'middle trace *implicit* visible: false');
        })
        .then(done, done.fail);
    });

    it('can add/delete stack groups', function(done) {
        var data01 = [
            {mode: 'markers', y: [1, 2, -1, 2, 1], stackgroup: 'a'},
            {mode: 'markers', y: [2, 3, 2, 3, 2], stackgroup: 'b'}
        ];
        var data0 = [Lib.extendDeep({}, data01[0])];
        var data1 = [Lib.extendDeep({}, data01[1])];

        function _assert(yRange, nTraces) {
            expect(gd._fullLayout.yaxis.range).toBeCloseToArray(yRange, 2);
            expect(gd.querySelectorAll('g.trace.scatter').length).toBe(nTraces);
        }

        Plotly.newPlot(gd, data01)
        .then(function() {
            _assert([-1.293, 3.293], 2);
            return Plotly.react(gd, data0);
        })
        .then(function() {
            _assert([-1.220, 2.220], 1);
            return Plotly.react(gd, data01);
        })
        .then(function() {
            _assert([-1.293, 3.293], 2);
            return Plotly.react(gd, data1);
        })
        .then(function() {
            _assert([0, 3.205], 1);
        })
        .then(done, done.fail);
    });

    it('does not stack on date axes', function(done) {
        Plotly.newPlot(gd, [
            {y: ['2016-01-01', '2017-01-01'], stackgroup: 'a'},
            {y: ['2016-01-01', '2017-01-01'], stackgroup: 'a'}
        ])
        .then(function() {
            expect(gd.layout.yaxis.range.map(function(v) { return v.slice(0, 4); }))
                // if we had stacked, this would go into the 2060s since we'd be
                // adding milliseconds since 1970
                .toEqual(['2015', '2017']);
        })
        .then(done, done.fail);
    });

    it('does not stack on category axes', function(done) {
        Plotly.newPlot(gd, [
            {y: ['a', 'b'], stackgroup: 'a'},
            {y: ['b', 'c'], stackgroup: 'a'}
        ])
        .then(function() {
            // if we had stacked, we'd calculate a new category 3
            // and autorange to ~[-0.2, 3.2]
            expect(gd.layout.yaxis.range).toBeCloseToArray([-0.1, 2.1], 1);
        })
        .then(done, done.fail);
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
        var mock = Lib.extendDeep({}, require('../../image/mocks/text_chart_arrays'));

        Plotly.newPlot(gd, mock).then(function() {
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
        .then(done, done.fail);
    });
});

describe('scatter hoverFills', function() {
    afterEach(destroyGraphDiv);

    function _hover(gd, xval, yval, hovermode, subplotId) {
        return gd._fullData.map(function(trace, i) {
            var cd = gd.calcdata[i];
            var subplot = gd._fullLayout._plots[subplotId];

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

    it('should correctly detect the fill that is hovered over for self and next fills', function(done) {
        var gd = createGraphDiv();
        var mock = Lib.extendDeep({}, require('../../image/mocks/scatter_fill_self_next'));

        var testPoints = [
            [[2, 2.9], [2, 2], [1.1, 2], [5.99, 3.01], [4.6, 3.5]],
            [[2, 3.1], [-0.2, 1.1], [5, 2.99], [7, 2], [1.2, 5.1]],
            [[6, 5], [7, 6], [8, 5], [7, 5], [6.7, 5.3]]
        ];

        Plotly.newPlot(gd, mock).then(function() {
            return Plotly.restyle(gd, 'hoveron', 'fills');
        })
        .then(function() {
            for(var i = 0; i < testPoints.length; i++) {
                for(var j = 0; j < testPoints[i].length; j++) {
                    var testCoords = testPoints[i][j];
                    var pts = _hover(gd, testCoords[0], testCoords[1], 'x', 'xy');
                    expect(pts[i]).toBeTruthy(
                        'correct trace not detected ' + testCoords.join(',') + ', should be ' + i
                    );
                    for(var k = 0; k < pts.length; k++) {
                        var traceId = (i + 1) % pts.length;
                        expect(pts[traceId]).toBeFalsy(
                            'wrong trace detected ' + testCoords.join(',') + '; got ' +
                            traceId + ' but should be ' + i
                        );
                    }
                }
            }
        })
        .then(done, done.fail);
    });

    it('should correctly detect the fill that is hovered over for tozeroy and tonexty fills', function(done) {
        var gd = createGraphDiv();
        var mock = Lib.extendDeep({}, require('../../image/mocks/scatter_fill_corner_cases'));

        var traceOffset = 0;

        var testPoints = [ // all the following points should be in fill region of corresponding tozeroy traces 0-4
            [], // single point has no "fill" when using SVG element containment tests
            [[0.1, 0.9], [0.1, 0.8], [1.5, 0.9], [1.5, 1.04], [2, 0.8], [2, 1.09], [3, 0.8]],
            [[0.1, 0.75], [0.1, 0.61], [1.01, 0.501], [1.5, 0.8], [1.5, 0.55], [2, 0.74], [2, 0.55], [3, 0.74], [3, 0.51]],
            [[0.1, 0.599], [0.1, 0.5], [0.1, 0.3], [0.99, 0.59], [1, 0.49], [1, 0.36], [1.5, 0.26], [2, 0.49], [2, 0.16], [3, 0.49], [3, 0.26]],
            [[0.1, 0.25], [0.1, 0.1], [1, 0.34], [1.5, 0.24], [2, 0.14], [3, 0.24], [3, 0.1]],
        ];

        var outsidePoints = [ // all these should not result in a hover detection, for any trace
            [1, 1.1], [2, 1.14], [1.5, 1.24], [1.5, 1.06]
        ];

        Plotly.newPlot(gd, mock).then(function() {
            return Plotly.restyle(gd, 'hoveron', 'fills');
        })
        .then(function() {
            var testCoords, pts;
            var i, j, k;
            for(i = 0; i < testPoints.length; i++) {
                for(j = 0; j < testPoints[i].length; j++) {
                    testCoords = testPoints[i][j];
                    pts = _hover(gd, testCoords[0], testCoords[1], 'x', 'xy');
                    expect(pts[traceOffset + i]).toBeTruthy(
                        'correct trace not detected ' + testCoords.join(',') + ', should be ' + (traceOffset + i)
                    );

                    // since all polygons do extend to the zero axis, many points will be detected by the
                    // correct trace and previous ones, but a point should not be detected as hover points
                    // by any trace defined later than the correct trace!
                    // (in actual hover detection, the real _hover takes care of the overlap with previous traces
                    // so that is not an issue in practice)
                    for(k = i + 1; k < testPoints.length; k++) {
                        var traceId = traceOffset + k;
                        expect(pts[traceId]).toBeFalsy(
                            'wrong trace detected ' + testCoords.join(',') + '; got ' +
                            traceId + ' but should be ' + (traceOffset + i)
                        );
                    }
                }
            }

            for(j = 0; j < outsidePoints.length; j++) {
                testCoords = outsidePoints[j];
                pts = _hover(gd, testCoords[0], testCoords[1], 'x', 'xy');
                for(k = 0; k < testPoints.length; k++) {
                    expect(pts[i]).toBeFalsy(
                        'trace detected for outside point ' + testCoords.join(',') + ', got ' + (traceOffset + k)
                    );
                }
            }
        })
        .then(done, done.fail);
    });


    it('should correctly detect the fill that is hovered over for tonexty fills', function(done) {
        var gd = createGraphDiv();
        var mock = Lib.extendDeep({}, require('../../image/mocks/scatter_fill_corner_cases'));

        var traceOffset = 10;

        var testPoints = [ // all the following points should be in fill region of corresponding tonexty traces 10-14
            [],
            [[1, 1.1], [1.5, 1.24], [1.5, 1.06], [2, 1.14]],
            [[0.1, 0.9], [0.1, 0.8], [1.5, 0.9], [1.5, 1.04], [2, 0.8], [2, 1.09], [3, 0.8]],
            [[0.1, 0.75], [0.1, 0.61], [1.01, 0.501], [1.5, 0.8], [1.5, 0.55], [2, 0.74], [2, 0.55], [3, 0.74], [3, 0.51]],
            [[0.1, 0.599], [0.1, 0.5], [0.1, 0.3], [0.99, 0.59], [1, 0.49], [1, 0.36], [1.5, 0.26], [2, 0.49], [2, 0.16], [3, 0.49], [3, 0.26]],
        ];
        var outsidePoints = [ // all these should not result in a hover detection, for any trace
            [0.1, 0.25], [0.1, 0.1], [1, 0.34], [1.5, 0.24], [2, 0.14], [3, 0.24], [3, 0.1], [0.5, 1.15], [2.5, 1.15],
        ];

        Plotly.newPlot(gd, mock).then(function() {
            return Plotly.restyle(gd, 'hoveron', 'fills');
        })
        .then(function() {
            var testCoords, pts;
            var i, j, k;
            for(i = 0; i < testPoints.length; i++) {
                for(j = 0; j < testPoints[i].length; j++) {
                    testCoords = testPoints[i][j];
                    pts = _hover(gd, testCoords[0], testCoords[1], 'x', 'xy2');
                    expect(pts[traceOffset + i]).toBeTruthy(
                        'correct trace not detected ' + testCoords.join(',') + ', should be ' + (traceOffset + i)
                    );

                    for(k = 1; k < testPoints.length; k++) {
                        var traceId = traceOffset + ((i + k) % testPoints.length);
                        expect(pts[traceId]).toBeFalsy(
                            'wrong trace detected ' + testCoords.join(',') + '; got ' +
                            traceId + ' but should be ' + (traceOffset + i)
                        );
                    }
                }
            }
            for(j = 0; j < outsidePoints.length; j++) {
                testCoords = outsidePoints[j];
                pts = _hover(gd, testCoords[0], testCoords[1], 'x', 'xy2');
                for(k = 0; k < testPoints.length; k++) {
                    expect(pts[traceOffset + k]).toBeFalsy(
                        'trace detected for outside point ' + testCoords.join(',') + ', got ' + (traceOffset + k)
                    );
                }
            }
        })
        .then(done, done.fail);
    });
});

describe('Test Scatter.style', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function assertPts(attr, getterFn, expectation, msg2) {
        var selector = attr.indexOf('textfont') === 0 ? '.textpoint > text' : '.point';

        d3Select(gd).selectAll('.trace').each(function(_, i) {
            var pts = d3Select(this).selectAll(selector);
            var expi = expectation[i];

            expect(pts.size())
                .toBe(expi.length, '# of pts for trace ' + i + msg2);

            pts.each(function(_, j) {
                var msg3 = ' for pt ' + j + ' in trace ' + i + msg2;
                expect(getterFn(this)).toBe(expi[j], attr + msg3);
            });
        });
    }

    function makeCheckFn(attr, getterFn) {
        return function(update, expectation, msg) {
            var promise = update ? Plotly.restyle(gd, update) : Promise.resolve();

            return promise.then(function() {
                assertPts(attr, getterFn, expectation, ' (' + msg + ' after restyle)');

                // make sure styleOnSelect (called during selection)
                // gives same results as restyle
                gd.calcdata.forEach(function(cd) {
                    Scatter.styleOnSelect(gd, cd, cd[0].node3);
                });
                assertPts(attr, getterFn, expectation, ' (' + msg + ' via Scatter.styleOnSelect)');
            });
        };
    }

    var r = 'rgb(255, 0, 0)';
    var g = 'rgb(0, 255, 0)';
    var b = 'rgb(0, 0, 255)';
    var y = 'rgb(255, 255, 0)';
    var c = 'rgb(0, 255, 255)';

    it('should style selected point marker opacity correctly', function(done) {
        var check = makeCheckFn('marker.opacity', getOpacity);

        Plotly.newPlot(gd, [{
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
        .then(done, done.fail);
    });

    it('should style selected point marker color correctly', function(done) {
        var check = makeCheckFn('marker.color', getColor);
        var checkOpacity = makeCheckFn('marker.opacity', getOpacity);

        Plotly.newPlot(gd, [{
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
        .then(done, done.fail);
    });

    it('should style selected point marker size correctly', function(done) {
        var check = makeCheckFn('marker.size', getMarkerSize);

        Plotly.newPlot(gd, [{
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
        .then(done, done.fail);
    });

    it('should style selected point textfont correctly', function(done) {
        var checkFontColor = makeCheckFn('textfont.color', getColor);
        var checkFontOpacity = makeCheckFn('textfont.color (alpha channel)', getFillOpacity);
        var checkPtOpacity = makeCheckFn('marker.opacity', getOpacity);

        Plotly.newPlot(gd, [{
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
        .then(done, done.fail);
    });
});

describe('Test scatter *clipnaxis*:', function() {
    afterEach(destroyGraphDiv);

    it('should show/hide point/text/errorbars in clipped and non-clipped layers', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('../../image/mocks/cliponaxis_false.json'));
        var xRange0 = fig.layout.xaxis.range.slice();
        var yRange0 = fig.layout.yaxis.range.slice();

        // only show 1 *cliponaxis: false* trace
        fig.data = [fig.data[2]];

        // add lines
        fig.data[0].mode = 'markers+lines+text';

        // add a non-scatter trace to make sure its module layer gets clipped
        fig.data.push({
            type: 'contour',
            z: [[0, 0.5, 1], [0.5, 1, 3]]
        });

        function _assertClip(sel, exp, size, msg) {
            if(exp === null) {
                expect(sel.size()).toBe(0, msg + 'selection should not exist');
            } else {
                assertClip(sel, exp, size, msg);
            }
        }

        function _assert(layerClips, nodeDisplays, errorBarClips, lineClips) {
            var subplotLayer = d3Select('.overplot').select('.xy');
            var scatterLayer = subplotLayer.select('.scatterlayer');

            _assertClip(subplotLayer, layerClips[0], 1, 'subplot layer');
            _assertClip(subplotLayer.select('.contourlayer'), layerClips[1], 1, 'some other trace layer');
            _assertClip(scatterLayer, layerClips[2], 1, 'scatter layer');

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

        Plotly.newPlot(gd, fig)
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
                [true, null, null],
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
                [true, null, null],
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
        .then(done, done.fail);
    });
});

describe('event data', function() {
    var mock = require('../../image/mocks/scatter-colorscale-colorbar');
    var mockCopy = Lib.extendDeep({}, mock);
    mockCopy.layout.hovermode = 'x';

    var marker = mockCopy.data[0].marker;
    marker.opacity = [];
    marker.symbol = [];
    for(var i = 0; i < mockCopy.data[0].y.length; ++i) {
        marker.opacity.push(0.5);
        marker.symbol.push('square');
    }
    checkEventData(mockCopy, 540, 260, constants.eventDataKeys);
});
