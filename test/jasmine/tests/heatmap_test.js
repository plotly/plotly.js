var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var setConvert = require('@src/plots/cartesian/set_convert');

var convertColumnXYZ = require('@src/traces/heatmap/convert_column_xyz');
var Heatmap = require('@src/traces/heatmap');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customMatchers = require('../assets/custom_matchers');


describe('heatmap supplyDefaults', function() {
    'use strict';

    var traceIn,
        traceOut;

    var defaultColor = '#444',
        layout = {
            font: Plots.layoutAttributes.font
        };

    var supplyDefaults = Heatmap.supplyDefaults;

    beforeEach(function() {
        traceOut = {};
    });

    it('should set visible to false when z is empty', function() {
        traceIn = {
            z: []
        };
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            z: [[]]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            z: [[], [], []]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            type: 'heatmap',
            z: [[1, 2], []]
        };
        traceOut = Plots.supplyTraceDefaults(traceIn, 0, layout);

        traceIn = {
            type: 'heatmap',
            z: [[], [1, 2], [1, 2, 3]]
        };
        traceOut = Plots.supplyTraceDefaults(traceIn, 0, layout);
        expect(traceOut.visible).toBe(true);
        expect(traceOut.visible).toBe(true);
    });

    it('should set visible to false when z is non-numeric', function() {
        traceIn = {
            type: 'heatmap',
            z: [['a', 'b'], ['c', 'd']]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).toBe(false);
    });

    it('should set visible to false when z isn\'t column not a 2d array', function() {
        traceIn = {
            x: [1, 1, 1, 2, 2],
            y: [1, 2, 3, 1, 2],
            z: [1, ['this is considered a column'], 1, 2, 3]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).not.toBe(false);

        traceIn = {
            x: [1, 1, 1, 2, 2],
            y: [1, 2, 3, 1, 2],
            z: [[0], ['this is not considered a column'], 1, ['nor 2d']]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).toBe(false);
    });

    it('should set paddings to 0 when not defined', function() {
        traceIn = {
            type: 'heatmap',
            z: [[1, 2], [3, 4]]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.xgap).toBe(0);
        expect(traceOut.ygap).toBe(0);
    });

    it('should not step on defined paddings', function() {
        traceIn = {
            xgap: 10,
            type: 'heatmap',
            z: [[1, 2], [3, 4]]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.xgap).toBe(10);
        expect(traceOut.ygap).toBe(0);
    });

    it('should not coerce gap if zsmooth is set', function() {
        traceIn = {
            xgap: 10,
            zsmooth: 'best',
            type: 'heatmap',
            z: [[1, 2], [3, 4]]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.xgap).toBe(undefined);
        expect(traceOut.ygap).toBe(undefined);
    });

    it('should inherit layout.calendar', function() {
        traceIn = {
            x: [1, 2],
            y: [1, 2],
            z: [[1, 2], [3, 4]]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, {calendar: 'islamic'});

        // we always fill calendar attributes, because it's hard to tell if
        // we're on a date axis at this point.
        expect(traceOut.xcalendar).toBe('islamic');
        expect(traceOut.ycalendar).toBe('islamic');
    });

    it('should take its own calendars', function() {
        traceIn = {
            x: [1, 2],
            y: [1, 2],
            z: [[1, 2], [3, 4]],
            xcalendar: 'coptic',
            ycalendar: 'ethiopian'
        };
        supplyDefaults(traceIn, traceOut, defaultColor, {calendar: 'islamic'});

        // we always fill calendar attributes, because it's hard to tell if
        // we're on a date axis at this point.
        expect(traceOut.xcalendar).toBe('coptic');
        expect(traceOut.ycalendar).toBe('ethiopian');
    });
});

describe('heatmap convertColumnXYZ', function() {
    'use strict';

    var trace;

    function makeMockAxis() {
        return {
            d2c: function(v) { return v; }
        };
    }

    var xa = makeMockAxis(),
        ya = makeMockAxis();

    it('should convert x/y/z columns to z(x,y)', function() {
        trace = {
            x: [1, 1, 1, 2, 2, 2],
            y: [1, 2, 3, 1, 2, 3],
            z: [1, 2, 3, 4, 5, 6]
        };

        convertColumnXYZ(trace, xa, ya);
        expect(trace.x).toEqual([1, 2]);
        expect(trace.y).toEqual([1, 2, 3]);
        expect(trace.z).toEqual([[1, 4], [2, 5], [3, 6]]);
    });

    it('should convert x/y/z columns to z(x,y) with uneven dimensions', function() {
        trace = {
            x: [1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3],
            y: [1, 2, 1, 2, 3],
            z: [1, 2, 4, 5, 6]
        };

        convertColumnXYZ(trace, xa, ya);
        expect(trace.x).toEqual([1, 2]);
        expect(trace.y).toEqual([1, 2, 3]);
        expect(trace.z).toEqual([[1, 4], [2, 5], [, 6]]);
    });

    it('should convert x/y/z columns to z(x,y) with missing values', function() {
        trace = {
            x: [1, 1, 2, 2, 2],
            y: [1, 2, 1, 2, 3],
            z: [1, null, 4, 5, 6]
        };

        convertColumnXYZ(trace, xa, ya);
        expect(trace.x).toEqual([1, 2]);
        expect(trace.y).toEqual([1, 2, 3]);
        expect(trace.z).toEqual([[1, 4], [null, 5], [, 6]]);
    });

    it('should convert x/y/z/text columns to z(x,y) and text(x,y)', function() {
        trace = {
            x: [1, 1, 1, 2, 2, 2],
            y: [1, 2, 3, 1, 2, 3],
            z: [1, 2, 3, 4, 5, 6],
            text: ['a', 'b', 'c', 'd', 'e', 'f', 'g']
        };

        convertColumnXYZ(trace, xa, ya);
        expect(trace.text).toEqual([['a', 'd'], ['b', 'e'], ['c', 'f']]);
    });

    it('should convert x/y/z columns to z(x,y) with out-of-order data', function() {
        /* eslint no-sparse-arrays: 0*/

        trace = {
            x: [
                50076, -42372, -19260, 3852, 26964, -65484, -42372, -19260,
                3852, 26964, -88596, -65484, -42372, -19260, 3852, 26964, 50076, 73188,
                -65484, -42372, -19260, 3852, 26964, 50076, -42372, -19260, 3852, 26964,
                -88596, -65484, -42372, -19260, 3852, 26964, 50076, 73188, -88596, -65484,
                -42372, -19260, 3852, 26964, 50076, 73188
            ],
            y: [
                51851.8, 77841.4, 77841.4, 77841.4, 77841.4, 51851.8, 51851.8, 51851.8,
                51851.8, 51851.8, -26117, -26117, -26117, -26117, -26117, -26117, -26117, -26117,
                -52106.6, -52106.6, -52106.6, -52106.6, -52106.6, -52106.6, -78096.2, -78096.2,
                -78096.2, -78096.2, -127.4, -127.4, -127.4, -127.4, -127.4, -127.4, -127.4, -127.4,
                25862.2, 25862.2, 25862.2, 25862.2, 25862.2, 25862.2, 25862.2, 25862.2
            ],
            z: [
                4.361856, 4.234497, 4.321701, 4.450315, 4.416136, 4.210373,
                4.32009, 4.246728, 4.293992, 4.316364, 3.908434, 4.433257, 4.364234, 4.308714, 4.275516,
                4.126979, 4.296483, 4.320471, 4.339848, 4.39907, 4.345006, 4.315032, 4.295618, 4.262052,
                4.154291, 4.404264, 4.33847, 4.270931, 4.032226, 4.381492, 4.328922, 4.24046, 4.349151,
                4.202861, 4.256402, 4.28972, 3.956225, 4.337909, 4.31226, 4.259435, 4.146854, 4.235799,
                4.238752, 4.299876
            ]
        };

        convertColumnXYZ(trace, xa, ya);
        expect(trace.x).toEqual(
            [-88596, -65484, -42372, -19260, 3852, 26964, 50076, 73188]);
        expect(trace.y).toEqual(
            [-78096.2, -52106.6, -26117, -127.4, 25862.2, 51851.8, 77841.4]);
        expect(trace.z).toEqual([
            [,, 4.154291, 4.404264, 4.33847, 4.270931,,, ],
            [, 4.339848, 4.39907, 4.345006, 4.315032, 4.295618, 4.262052,, ],
            [3.908434, 4.433257, 4.364234, 4.308714, 4.275516, 4.126979, 4.296483, 4.320471],
            [4.032226, 4.381492, 4.328922, 4.24046, 4.349151, 4.202861, 4.256402, 4.28972],
            [3.956225, 4.337909, 4.31226, 4.259435, 4.146854, 4.235799, 4.238752, 4.299876],
            [, 4.210373, 4.32009, 4.246728, 4.293992, 4.316364, 4.361856,, ],
            [,, 4.234497, 4.321701, 4.450315, 4.416136,,, ]
        ]);
    });

    it('should convert x/y/z columns with nulls to z(x,y)', function() {
        xa = { type: 'linear' };
        ya = { type: 'linear' };

        setConvert(xa);
        setConvert(ya);

        trace = {
            x: [0, 0, 0, 5, null, 5, 10, 10, 10],
            y: [0, 5, 10, 0, null, 10, 0, 5, 10],
            z: [0, 50, 100, 50, null, 255, 100, 510, 1010]
        };

        convertColumnXYZ(trace, xa, ya);

        expect(trace.x).toEqual([0, 5, 10]);
        expect(trace.y).toEqual([0, 5, 10]);
        expect(trace.z).toEqual([
            [0, 50, 100],
            [50, undefined, 510],
            [100, 255, 1010]
        ]);
    });
});

describe('heatmap calc', function() {
    'use strict';

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    function _calc(opts) {
        var base = { type: 'heatmap' },
            trace = Lib.extendFlat({}, base, opts),
            gd = { data: [trace] };

        Plots.supplyDefaults(gd);
        var fullTrace = gd._fullData[0];

        return Heatmap.calc(gd, fullTrace)[0];
    }

    it('should fill in bricks if x/y not given', function() {
        var out = _calc({
            z: [[1, 2, 3], [3, 1, 2]]
        });

        expect(out.x).toBeCloseToArray([-0.5, 0.5, 1.5, 2.5]);
        expect(out.y).toBeCloseToArray([-0.5, 0.5, 1.5]);
        expect(out.z).toBeCloseTo2DArray([[1, 2, 3], [3, 1, 2]]);
    });

    it('should fill in bricks with x0/dx + y0/dy', function() {
        var out = _calc({
            z: [[1, 2, 3], [3, 1, 2]],
            x0: 10,
            dx: 0.5,
            y0: -2,
            dy: -2
        });

        expect(out.x).toBeCloseToArray([9.75, 10.25, 10.75, 11.25]);
        expect(out.y).toBeCloseToArray([-1, -3, -5]);
        expect(out.z).toBeCloseTo2DArray([[1, 2, 3], [3, 1, 2]]);
    });

    it('should convert x/y coordinates into bricks', function() {
        var out = _calc({
            x: [1, 2, 3],
            y: [2, 6],
            z: [[1, 2, 3], [3, 1, 2]]
        });

        expect(out.x).toBeCloseToArray([0.5, 1.5, 2.5, 3.5]);
        expect(out.y).toBeCloseToArray([0, 4, 8]);
        expect(out.z).toBeCloseTo2DArray([[1, 2, 3], [3, 1, 2]]);
    });

    it('should respect brick-link /y coordinates', function() {
        var out = _calc({
            x: [1, 2, 3, 4],
            y: [2, 6, 10],
            z: [[1, 2, 3], [3, 1, 2]]
        });

        expect(out.x).toBeCloseToArray([1, 2, 3, 4]);
        expect(out.y).toBeCloseToArray([2, 6, 10]);
        expect(out.z).toBeCloseTo2DArray([[1, 2, 3], [3, 1, 2]]);
    });

    it('should handle 1-xy + 1-brick case', function() {
        var out = _calc({
            x: [2],
            y: [3],
            z: [[1]]
        });

        expect(out.x).toBeCloseToArray([1.5, 2.5]);
        expect(out.y).toBeCloseToArray([2.5, 3.5]);
        expect(out.z).toBeCloseTo2DArray([[1]]);
    });

    it('should handle 1-xy + multi-brick case', function() {
        var out = _calc({
            x: [2],
            y: [3],
            z: [[1, 2, 3], [3, 1, 2]]
        });

        expect(out.x).toBeCloseToArray([1.5, 2.5, 3.5, 4.5]);
        expect(out.y).toBeCloseToArray([2.5, 3.5, 4.5]);
        expect(out.z).toBeCloseTo2DArray([[1, 2, 3], [3, 1, 2]]);
    });

    it('should handle 0-xy + multi-brick case', function() {
        var out = _calc({
            x: [],
            y: [],
            z: [[1, 2, 3], [3, 1, 2]]
        });

        expect(out.x).toBeCloseToArray([-0.5, 0.5, 1.5, 2.5]);
        expect(out.y).toBeCloseToArray([-0.5, 0.5, 1.5]);
        expect(out.z).toBeCloseTo2DArray([[1, 2, 3], [3, 1, 2]]);
    });

    it('should handle the category case', function() {
        var out = _calc({
            x: ['a', 'b', 'c'],
            y: ['z'],
            z: [[17, 18, 19]]
        });

        expect(out.x).toBeCloseToArray([-0.5, 0.5, 1.5, 2.5]);
        expect(out.y).toBeCloseToArray([-0.5, 0.5]);
        expect(out.z).toBeCloseTo2DArray([[17, 18, 19]]);
    });
});

describe('heatmap plot', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    it('should not draw traces that are off-screen', function(done) {
        var mock = require('@mocks/heatmap_multi-trace.json'),
            mockCopy = Lib.extendDeep({}, mock),
            gd = createGraphDiv();

        function assertImageCnt(cnt) {
            var images = d3.selectAll('.hm').select('image');

            expect(images.size()).toEqual(cnt);
        }

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            assertImageCnt(5);

            return Plotly.relayout(gd, 'xaxis.range', [2, 3]);
        }).then(function() {
            assertImageCnt(2);

            return Plotly.relayout(gd, 'xaxis.autorange', true);
        }).then(function() {
            assertImageCnt(5);

            done();
        });
    });

    it('should be able to restyle', function(done) {
        var mock = require('@mocks/13.json'),
            mockCopy = Lib.extendDeep({}, mock),
            gd = createGraphDiv();

        function getImageURL() {
            return d3.select('.hm > image').attr('href');
        }

        var imageURLs = [];

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            imageURLs.push(getImageURL());

            return Plotly.restyle(gd, 'colorscale', 'Greens');
        }).then(function() {
            imageURLs.push(getImageURL());

            expect(imageURLs[0]).not.toEqual(imageURLs[1]);

            return Plotly.restyle(gd, 'colorscale', 'Reds');
        }).then(function() {
            imageURLs.push(getImageURL());

            expect(imageURLs[1]).not.toEqual(imageURLs[2]);

            return Plotly.restyle(gd, 'colorscale', 'Greens');
        }).then(function() {
            imageURLs.push(getImageURL());

            expect(imageURLs[1]).toEqual(imageURLs[3]);

            done();
        });
    });

    it('draws canvas with correct margins', function(done) {
        var mockWithPadding = require('@mocks/heatmap_brick_padding.json'),
            mockWithoutPadding = Lib.extendDeep({}, mockWithPadding),
            gd = createGraphDiv(),
            getContextStub = {
                fillRect: jasmine.createSpy()
            },
            originalCreateElement = document.createElement;

        mockWithoutPadding.data[0].xgap = 0;
        mockWithoutPadding.data[0].ygap = 0;

        spyOn(document, 'createElement').and.callFake(function(elementType) {
            var element = originalCreateElement.call(document, elementType);
            if(elementType === 'canvas') {
                spyOn(element, 'getContext').and.returnValue(getContextStub);
            }
            return element;
        });

        var argumentsWithoutPadding = [],
            argumentsWithPadding = [];
        Plotly.plot(gd, mockWithoutPadding.data, mockWithoutPadding.layout).then(function() {
            argumentsWithoutPadding = getContextStub.fillRect.calls.allArgs().slice(0);
            return Plotly.plot(gd, mockWithPadding.data, mockWithPadding.layout);
        }).then(function() {
            var centerXGap = mockWithPadding.data[0].xgap / 3;
            var centerYGap = mockWithPadding.data[0].ygap / 3;
            var edgeXGap = mockWithPadding.data[0].xgap * 2 / 3;
            var edgeYGap = mockWithPadding.data[0].ygap * 2 / 3;

            argumentsWithPadding = getContextStub.fillRect.calls.allArgs().slice(getContextStub.fillRect.calls.allArgs().length - 9);
            expect(argumentsWithPadding).toEqual([
                [argumentsWithoutPadding[0][0],
                    argumentsWithoutPadding[0][1] + edgeYGap,
                    argumentsWithoutPadding[0][2] - edgeXGap,
                    argumentsWithoutPadding[0][3] - edgeYGap],
                [argumentsWithoutPadding[1][0] + centerXGap,
                    argumentsWithoutPadding[1][1] + edgeYGap,
                    argumentsWithoutPadding[1][2] - edgeXGap,
                    argumentsWithoutPadding[1][3] - edgeYGap],
                [argumentsWithoutPadding[2][0] + edgeXGap,
                    argumentsWithoutPadding[2][1] + edgeYGap,
                    argumentsWithoutPadding[2][2] - edgeXGap,
                    argumentsWithoutPadding[2][3] - edgeYGap],
                [argumentsWithoutPadding[3][0],
                    argumentsWithoutPadding[3][1] + centerYGap,
                    argumentsWithoutPadding[3][2] - edgeXGap,
                    argumentsWithoutPadding[3][3] - edgeYGap],
                [argumentsWithoutPadding[4][0] + centerXGap,
                    argumentsWithoutPadding[4][1] + centerYGap,
                    argumentsWithoutPadding[4][2] - edgeXGap,
                    argumentsWithoutPadding[4][3] - edgeYGap],
                [argumentsWithoutPadding[5][0] + edgeXGap,
                    argumentsWithoutPadding[5][1] + centerYGap,
                    argumentsWithoutPadding[5][2] - edgeXGap,
                    argumentsWithoutPadding[5][3] - edgeYGap],
                [argumentsWithoutPadding[6][0],
                    argumentsWithoutPadding[6][1],
                    argumentsWithoutPadding[6][2] - edgeXGap,
                    argumentsWithoutPadding[6][3] - edgeYGap],
                [argumentsWithoutPadding[7][0] + centerXGap,
                    argumentsWithoutPadding[7][1],
                    argumentsWithoutPadding[7][2] - edgeXGap,
                    argumentsWithoutPadding[7][3] - edgeYGap],
                [argumentsWithoutPadding[8][0] + edgeXGap,
                    argumentsWithoutPadding[8][1],
                    argumentsWithoutPadding[8][2] - edgeXGap,
                    argumentsWithoutPadding[8][3] - edgeYGap
                ]]);
            done();
        });
    });
});

describe('heatmap hover', function() {
    'use strict';

    var gd;

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    function _hover(gd, xval, yval) {
        var fullLayout = gd._fullLayout,
            calcData = gd.calcdata,
            hoverData = [];

        for(var i = 0; i < calcData.length; i++) {
            var pointData = {
                index: false,
                distance: 20,
                cd: calcData[i],
                trace: calcData[i][0].trace,
                xa: fullLayout.xaxis,
                ya: fullLayout.yaxis
            };

            var hoverPoint = Heatmap.hoverPoints(pointData, xval, yval);
            if(hoverPoint) hoverData.push(hoverPoint[0]);
        }

        return hoverData;
    }

    function assertLabels(hoverPoint, xLabel, yLabel, zLabel, text) {
        expect(hoverPoint.xLabelVal).toEqual(xLabel, 'have correct x label');
        expect(hoverPoint.yLabelVal).toEqual(yLabel, 'have correct y label');
        expect(hoverPoint.zLabelVal).toEqual(zLabel, 'have correct z label');
        expect(hoverPoint.text).toEqual(text, 'have correct text label');
    }

    describe('for `heatmap_multi-trace`', function() {

        beforeAll(function(done) {
            gd = createGraphDiv();

            var mock = require('@mocks/heatmap_multi-trace.json'),
                mockCopy = Lib.extendDeep({}, mock);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        afterAll(destroyGraphDiv);

        it('should find closest point (case 1) and should', function() {
            var pt = _hover(gd, 0.5, 0.5)[0];

            expect(pt.index).toEqual([1, 0], 'have correct index');
            assertLabels(pt, 1, 1, 4);
        });

        it('should find closest point (case 2) and should', function() {
            var pt = _hover(gd, 1.5, 0.5)[0];

            expect(pt.index).toEqual([0, 0], 'have correct index');
            assertLabels(pt, 2, 0.2, 6);
        });
    });

    describe('for xyz-column traces', function() {

        beforeAll(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, [{
                type: 'heatmap',
                x: [1, 2, 3],
                y: [1, 1, 1],
                z: [10, 4, 20],
                text: ['a', 'b', 'c'],
                hoverinfo: 'text'
            }])
            .then(done);
        });

        afterAll(destroyGraphDiv);

        it('should find closest point and should', function(done) {
            var pt = _hover(gd, 0.5, 0.5)[0];

            expect(pt.index).toEqual([0, 0], 'have correct index');
            assertLabels(pt, 1, 1, 10, 'a');

            Plotly.relayout(gd, 'xaxis.range', [1, 2]).then(function() {
                var pt2 = _hover(gd, 1.5, 0.5)[0];

                expect(pt2.index).toEqual([0, 1], 'have correct index');
                assertLabels(pt2, 2, 1, 4, 'b');
            })
            .then(done);
        });

    });
});
