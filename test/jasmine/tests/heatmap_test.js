var Plotly = require('../../../lib/index');
var Plots = require('../../../src/plots/plots');
var Lib = require('../../../src/lib');
var setConvert = require('../../../src/plots/cartesian/set_convert');

var convertColumnXYZ = require('../../../src/traces/heatmap/convert_column_xyz');
var Heatmap = require('../../../src/traces/heatmap');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var supplyAllDefaults = require('../assets/supply_defaults');


describe('heatmap supplyDefaults', function() {
    'use strict';

    var traceIn;
    var traceOut;

    var defaultColor = '#444';
    var layout = {
        font: Plots.layoutAttributes.font,
        _dfltTitle: {colorbar: 'cb'},
        _subplots: {cartesian: ['xy'], xaxis: ['x'], yaxis: ['y']}
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
        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'heatmap'}, 0, layout);

        traceIn = {
            type: 'heatmap',
            z: [[], [1, 2], [1, 2, 3]]
        };
        traceOut = Plots.supplyTraceDefaults(traceIn, {type: 'heatmap'}, 0, layout);
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

    it('should set visible to false when z isn\'t column nor a 2d array', function() {
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

    it('should default connectgaps to false if `z` is not a one dimensional array', function() {
        traceIn = {
            type: 'heatmap',
            z: [[0, null], [1, 2]]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.connectgaps).toBe(false);
    });

    it('should default connectgaps to true if `z` is a one dimensional array and `zsmooth` is not false', function() {
        traceIn = {
            zsmooth: 'fast',
            type: 'heatmap',
            x: [1, 1, 2, 2, 2],
            y: [1, 2, 1, 2, 3],
            z: [1, null, 4, 5, 6]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.connectgaps).toBe(true);
    });

    it('should default connectgaps to false if `zsmooth` is false', function() {
        traceIn = {
            zsmooth: false,
            type: 'heatmap',
            x: [1, 1, 2, 2, 2],
            y: [1, 2, 1, 2, 3],
            z: [1, null, 4, 5, 6]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.connectgaps).toBe(false);
    });

    it('should inherit layout.calendar', function() {
        traceIn = {
            x: [1, 2],
            y: [1, 2],
            z: [[1, 2], [3, 4]]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, Lib.extendDeep({calendar: 'islamic'}, layout));

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
        supplyDefaults(traceIn, traceOut, defaultColor, Lib.extendDeep({calendar: 'islamic'}, layout));

        // we always fill calendar attributes, because it's hard to tell if
        // we're on a date axis at this point.
        expect(traceOut.xcalendar).toBe('coptic');
        expect(traceOut.ycalendar).toBe('ethiopian');
    });
});

describe('heatmap convertColumnXYZ', function() {
    'use strict';

    var trace;
    var xa = {type: 'linear'};
    var ya = {type: 'linear'};
    setConvert(xa);
    setConvert(ya);

    function checkConverted(trace, x, y, z) {
        trace._length = Math.min(trace.x.length, trace.y.length, trace.z.length);
        convertColumnXYZ(trace, xa, ya, 'x', 'y', ['z']);
        expect(trace._x).toEqual(x);
        expect(trace._y).toEqual(y);
        expect(trace._z).toEqual(z);
    }

    it('should convert x/y/z columns to z(x,y)', function() {
        trace = {
            x: [1, 1, 1, 2, 2, 2],
            y: [1, 2, 3, 1, 2, 3],
            z: [1, 2, 3, 4, 5, 6]
        };

        checkConverted(trace, [1, 2], [1, 2, 3], [[1, 4], [2, 5], [3, 6]]);
    });

    it('should convert x/y/z columns to z(x,y) with uneven dimensions', function() {
        trace = {
            x: [1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3],
            y: [1, 2, 1, 2, 3],
            z: [1, 2, 4, 5, 6]
        };

        checkConverted(trace, [1, 2], [1, 2, 3], [[1, 4], [2, 5], [, 6]]);
    });

    it('should convert x/y/z columns to z(x,y) with missing values', function() {
        trace = {
            x: [1, 1, 2, 2, 2],
            y: [1, 2, 1, 2, 3],
            z: [1, null, 4, 5, 6]
        };

        checkConverted(trace, [1, 2], [1, 2, 3], [[1, 4], [null, 5], [, 6]]);
    });

    it('should convert x/y/z/text columns to z(x,y) and text(x,y)', function() {
        trace = {
            x: [1, 1, 1, 2, 2, 2],
            y: [1, 2, 3, 1, 2, 3],
            z: [1, 2, 3, 4, 5, 6],
            text: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
            _length: 6
        };

        convertColumnXYZ(trace, xa, ya, 'x', 'y', ['z']);
        expect(trace._text).toEqual([['a', 'd'], ['b', 'e'], ['c', 'f']]);
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

        checkConverted(trace,
            [-88596, -65484, -42372, -19260, 3852, 26964, 50076, 73188],
            [-78096.2, -52106.6, -26117, -127.4, 25862.2, 51851.8, 77841.4],
            [
                [,, 4.154291, 4.404264, 4.33847, 4.270931,,, ],
                [, 4.339848, 4.39907, 4.345006, 4.315032, 4.295618, 4.262052,, ],
                [3.908434, 4.433257, 4.364234, 4.308714, 4.275516, 4.126979, 4.296483, 4.320471],
                [4.032226, 4.381492, 4.328922, 4.24046, 4.349151, 4.202861, 4.256402, 4.28972],
                [3.956225, 4.337909, 4.31226, 4.259435, 4.146854, 4.235799, 4.238752, 4.299876],
                [, 4.210373, 4.32009, 4.246728, 4.293992, 4.316364, 4.361856,, ],
                [,, 4.234497, 4.321701, 4.450315, 4.416136,,, ]
            ]
        );
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

        checkConverted(trace, [0, 5, 10], [0, 5, 10], [
            [0, 50, 100],
            [50, undefined, 510],
            [100, 255, 1010]
        ]);
    });
});

describe('heatmap calc', function() {
    'use strict';

    function _calc(opts, layout) {
        var base = { type: 'heatmap' };
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

        var out = Heatmap.calc(gd, fullTrace)[0];
        out._xcategories = fullLayout.xaxis._categories;
        out._ycategories = fullLayout.yaxis._categories;

        return out;
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

    it('should handle the category case (edge case with a *0* category)', function() {
        var out = _calc({
            x: ['a', 'b', 0],
            y: ['z', 0, 'y'],
            z: [[17, 18, 19], [10, 20, 30], [40, 30, 20]]
        }, {
            xaxis: {type: 'category'},
            yaxis: {type: 'category'}
        });

        expect(out.x).toBeCloseToArray([-0.5, 0.5, 1.5, 2.5]);
        expect(out.y).toBeCloseToArray([-0.5, 0.5, 1.5, 2.5]);
    });

    it('should handle the category x/y/z/ column case', function() {
        var out = _calc({
            x: ['a', 'a', 'a', 'b', 'b', 'b', 'c', 'c', 'c'],
            y: ['A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C'],
            z: [0, 50, 100, 50, 0, 255, 100, 510, 1010]
        });

        expect(out.x).toBeCloseToArray([-0.5, 0.5, 1.5, 2.5]);
        expect(out.y).toBeCloseToArray([-0.5, 0.5, 1.5, 2.5]);
        expect(out.z).toBeCloseTo2DArray([
            [0, 50, 100],
            [50, 0, 510],
            [100, 255, 1010]
        ]);

        expect(out._xcategories).toEqual(['a', 'b', 'c']);
        expect(out._ycategories).toEqual(['A', 'B', 'C']);
    });

    it('should handle the date x/y/z/ column case', function() {
        var out = _calc({
            x: [
                '2016-01-01', '2016-01-01', '2016-01-01',
                '2017-01-01', '2017-01-01', '2017-01-01',
                '2017-06-01', '2017-06-01', '2017-06-01'
            ],
            y: [0, 1, 2, 0, 1, 2, 0, 1, 2],
            z: [0, 50, 100, 50, 0, 255, 100, 510, 1010]
        });

        expect(out.x).toBeCloseToArray([
            1435795200000, 1467417600000, 1489752000000, 1502798400000
        ]);
        expect(out.y).toBeCloseToArray([-0.5, 0.5, 1.5, 2.5]);
        expect(out.z).toBeCloseTo2DArray([
            [0, 50, 100],
            [50, 0, 510],
            [100, 255, 1010]
        ]);
    });

    it('should fill in bricks if x/y not given (typed array case)', function() {
        var out = _calc({
            z: [
                new Float32Array([1, 2, 3]),
                new Float32Array([3, 1, 2])
            ]
        });

        expect(out.x).toBeCloseToArray([-0.5, 0.5, 1.5, 2.5]);
        expect(out.y).toBeCloseToArray([-0.5, 0.5, 1.5]);
        expect(out.z).toBeCloseTo2DArray([[1, 2, 3], [3, 1, 2]]);
    });

    it('should convert x/y coordinates into bricks (typed array case)', function() {
        var out = _calc({
            x: new Float32Array([1, 2, 3]),
            y: new Float32Array([2, 6]),
            z: [
                new Float32Array([1, 2, 3]),
                new Float32Array([3, 1, 2])
            ]
        });

        expect(out.x).toBeCloseToArray([0.5, 1.5, 2.5, 3.5]);
        expect(out.y).toBeCloseToArray([0, 4, 8]);
        expect(out.z).toBeCloseTo2DArray([[1, 2, 3], [3, 1, 2]]);
    });

    ['heatmap'].forEach(function(traceType) {
        it('should sort z data based on axis categoryorder for ' + traceType, function() {
            var mock = require('../../image/mocks/heatmap_categoryorder');
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
            var mock = require('../../image/mocks/heatmap_categoryorder');
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
            expect(out.z[0][0]).toEqual(0);
        });
    });

    describe('should clean z array linked to category x/y coordinates', function() {
        var z = [
            [1, 20, 30, 50, 1],
            [20, 1, 60, 80, 30],
            [30, 60, 1, -10, 20]
        ];

        it('- base case', function() {
            var out = _calc({
                z: z,
                x: ['a', 'b', 'c', 'd', 'f'],
                y: ['A', 'B', 'C']
            });
            expect(out.z).toBeCloseTo2DArray([
                [1, 20, 30, 50, 1],
                [20, 1, 60, 80, 30],
                [30, 60, 1, -10, 20]
            ]);
        });

        it('- with extra x items', function() {
            var out = _calc({
                z: z,
                x: ['a', 'b', 'c', 'd', 'f', ''],
                y: ['A', 'B', 'C']
            });
            expect(out.z).toBeCloseTo2DArray([
                [1, 20, 30, 50, 1, undefined],
                [20, 1, 60, 80, 30, undefined],
                [30, 60, 1, -10, 20, undefined]
            ]);
        });

        it('- with extra y items', function() {
            var out = _calc({
                z: z,
                x: ['a', 'b', 'c', 'd', 'f'],
                y: ['A', 'B', 'C', '']
            });
            expect(out.z).toBeCloseTo2DArray([
                [1, 20, 30, 50, 1],
                [20, 1, 60, 80, 30],
                [30, 60, 1, -10, 20],
                new Array(5)
            ]);
        });

        it('- with extra x and y items', function() {
            var out = _calc({
                z: z,
                x: ['a', 'b', 'c', 'd', 'f', ''],
                y: ['A', 'B', 'C', '']
            });
            expect(out.z).toBeCloseTo2DArray([
                [1, 20, 30, 50, 1, undefined],
                [20, 1, 60, 80, 30, undefined],
                [30, 60, 1, -10, 20, undefined],
                new Array(6)
            ]);
        });

        it('- transposed, with extra x and y items', function() {
            var out = _calc({
                transpose: true,
                z: z,
                x: ['a', 'b', 'c', 'd', 'f', ''],
                y: ['A', 'B', 'C', '']
            });
            expect(out.z).toBeCloseTo2DArray([
                [1, 20, 30, undefined, undefined, undefined],
                [20, 1, 60, undefined, undefined, undefined],
                [30, 60, 1, undefined, undefined, undefined],
                [50, 80, -10, undefined, undefined, undefined]
            ]);
        });
    });
});

describe('heatmap plot', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should not draw traces that are off-screen', function(done) {
        var mock = require('../../image/mocks/heatmap_multi-trace.json');
        var mockCopy = Lib.extendDeep({}, mock);

        function assertImageCnt(cnt) {
            var images = d3SelectAll('.hm image');

            expect(images.size()).toEqual(cnt);
        }

        Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
            assertImageCnt(5);

            return Plotly.relayout(gd, 'xaxis.range', [2, 3]);
        }).then(function() {
            assertImageCnt(2);

            return Plotly.relayout(gd, 'xaxis.autorange', true);
        }).then(function() {
            assertImageCnt(5);
        })
        .then(done, done.fail);
    });

    it('keeps the correct ordering after hide and show', function(done) {
        function getIndices() {
            var out = [];
            d3SelectAll('.hm image').each(function(d) { out.push(d.trace.index); });
            return out;
        }

        Plotly.newPlot(gd, [{
            type: 'heatmap',
            z: [[1, 2], [3, 4]]
        }, {
            type: 'heatmap',
            z: [[2, 1], [4, 3]],
            contours: {coloring: 'lines'}
        }])
        .then(function() {
            expect(getIndices()).toEqual([0, 1]);
            return Plotly.restyle(gd, 'visible', false, [0]);
        })
        .then(function() {
            expect(getIndices()).toEqual([1]);
            return Plotly.restyle(gd, 'visible', true, [0]);
        })
        .then(function() {
            expect(getIndices()).toEqual([0, 1]);
        })
        .then(done, done.fail);
    });

    it('should be able to restyle', function(done) {
        var mock = require('../../image/mocks/13.json');
        var mockCopy = Lib.extendDeep({}, mock);

        function getImageURL() {
            return d3Select('.hm > image').attr('href');
        }

        var imageURLs = [];

        Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
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
        })
        .then(done, done.fail);
    });

    it('draws canvas with correct margins', function(done) {
        var mockWithPadding = require('../../image/mocks/heatmap_brick_padding.json');
        var mockWithoutPadding = Lib.extendDeep({}, mockWithPadding);
        var getContextStub = {
            fillRect: jasmine.createSpy()
        };
        var originalCreateElement = document.createElement;

        // We actually need to set a non-zero gap to ensure both mockWithPadding
        // and mockWithoutPadding relies on the same drawing method (ie. default
        // method using fillRect)
        var nearZeroGap = 0.1;
        mockWithoutPadding.data[0].xgap = nearZeroGap;
        mockWithoutPadding.data[0].ygap = nearZeroGap;

        spyOn(document, 'createElement').and.callFake(function(elementType) {
            var element = originalCreateElement.call(document, elementType);
            if(elementType === 'canvas') {
                spyOn(element, 'getContext').and.returnValue(getContextStub);
            }
            return element;
        });

        var argumentsWithoutPadding = [];
        var argumentsWithPadding = [];
        Plotly.newPlot(gd, mockWithoutPadding.data, mockWithoutPadding.layout).then(function() {
            argumentsWithoutPadding = getContextStub.fillRect.calls.allArgs().slice(0);
            return Plotly.newPlot(gd, mockWithPadding.data, mockWithPadding.layout);
        }).then(function() {
            var xGap = mockWithPadding.data[0].xgap;
            var yGap = mockWithPadding.data[0].ygap;
            var xGapLeft = Math.floor(xGap / 2);
            var yGapTop = Math.floor(yGap / 2);

            argumentsWithPadding = getContextStub.fillRect.calls.allArgs()
                .slice(getContextStub.fillRect.calls.allArgs().length - 25);

            expect(argumentsWithPadding.length).toBe(25);

            argumentsWithPadding.forEach(function(args, i) {
                expect(args[0]).toBe(argumentsWithoutPadding[i][0] + xGapLeft, i);
                expect(args[1]).toBe(argumentsWithoutPadding[i][1] + yGapTop, i);
                expect(args[2]).toBe(argumentsWithoutPadding[i][2] + nearZeroGap - xGap, i);
                expect(args[3]).toBe(argumentsWithoutPadding[i][3] + nearZeroGap - yGap, i);
            });
        })
        .then(done, done.fail);
    });

    it('can change z values with connected gaps', function(done) {
        Plotly.newPlot(gd, [{
            type: 'heatmap', connectgaps: true,
            z: [[1, 2], [null, 4], [1, 2]]
        }])
        .then(function() {
            expect(gd.calcdata[0][0].z).toEqual([[1, 2], [2, 4], [1, 2]]);

            return Plotly.react(gd, [{
                type: 'heatmap', connectgaps: true,
                z: [[6, 5], [8, 7], [null, 10]]
            }]);
        })
        .then(function() {
            expect(gd.calcdata[0][0].z).toEqual([[6, 5], [8, 7], [9, 10]]);

            return Plotly.react(gd, [{
                type: 'heatmap', connectgaps: true,
                z: [[1, 2], [null, 4], [1, 2]]
            }]);
        })
        .then(function() {
            expect(gd.calcdata[0][0].z).toEqual([[1, 2], [2, 4], [1, 2]]);
        })
        .then(done, done.fail);
    });

    it('should set canvas dimensions according to z data shape when using fast drawing method', function(done) {
        var mock1 = require('../../image/mocks/zsmooth_methods.json');
        var mock2 = require('../../image/mocks/heatmap_small_layout_zsmooth_fast.json');

        var canvasStub;
        var originalCreateElement = document.createElement;

        spyOn(document, 'createElement').and.callFake(function(elementType) {
            var element = originalCreateElement.call(document, elementType);
            if(elementType === 'canvas') {
                canvasStub = {
                    width: spyOnProperty(element, 'width', 'set').and.callThrough(),
                    height: spyOnProperty(element, 'height', 'set').and.callThrough()
                };
            }
            return element;
        });

        function assertCanvas(z) {
            expect(canvasStub.width.calls.count()).toBe(1);
            expect(canvasStub.height.calls.count()).toBe(1);
            var m = z.length;
            var n = Lib.maxRowLength(z);
            var canvasW = canvasStub.width.calls.argsFor(0)[0];
            var canvasH = canvasStub.height.calls.argsFor(0)[0];
            expect([canvasW, canvasH]).toEqual([n, m]);
        }

        Plotly.newPlot(gd, [mock1.data[1]]).then(function() {
            assertCanvas(mock1.data[1].z);
            return Plotly.newPlot(gd, mock2.data, mock2.layout);
        }).then(function() {
            assertCanvas(mock2.data[0].z);
        }).then(done, done.fail);
    });

    it('should create imageData that fits the canvas dimensions if zsmooth is set and/or drawing method is fast', function(done) {
        var mock1 = require('../../image/mocks/zsmooth_methods.json');
        var mock2 = require('../../image/mocks/heatmap_small_layout_zsmooth_fast.json');

        var imageDataStub = {
            data: {
                set: jasmine.createSpy()
            }
        };

        var getContextStub = {
            createImageData: jasmine.createSpy().and.returnValue(imageDataStub),
            putImageData: function() {},
            fillRect: function() {},
        };

        function checkPixels(pixels) {
            for(var j = 0, px, check; j < pixels.length; j += 4) {
                px = pixels.slice(j, j + 4);
                check = px.every(function(c) { return c === 0; });
                if(check) {
                    return false;
                }
            }
            return true;
        }

        var canvasStubs = [];
        var originalCreateElement = document.createElement;

        spyOn(document, 'createElement').and.callFake(function(elementType) {
            var element = originalCreateElement.call(document, elementType);
            if(elementType === 'canvas') {
                spyOn(element, 'getContext').and.returnValue(getContextStub);
                canvasStubs.push({
                    width: spyOnProperty(element, 'width', 'set').and.callThrough(),
                    height: spyOnProperty(element, 'height', 'set').and.callThrough()
                });
            }
            return element;
        });

        function assertImageData(traceIndices) {
            expect(getContextStub.createImageData.calls.count()).toBe(traceIndices.length);
            expect(imageDataStub.data.set.calls.count()).toBe(traceIndices.length);

            traceIndices.forEach(function(i) {
                var createImageDataArgs = getContextStub.createImageData.calls.argsFor(i);
                var setImageDataArgs = imageDataStub.data.set.calls.argsFor(i);

                var canvasW = canvasStubs[i].width.calls.argsFor(0)[0];
                var canvasH = canvasStubs[i].height.calls.argsFor(0)[0];
                expect(createImageDataArgs).toEqual([canvasW, canvasH]);

                var pixels = setImageDataArgs[0];
                expect(pixels.length).toBe(canvasW * canvasH * 4);
                expect(checkPixels(pixels)).toBe(true);
            });
        }

        Plotly.newPlot(gd, mock1.data, mock1.layout).then(function() {
            assertImageData([0, 1, 2]);

            getContextStub.createImageData.calls.reset();
            imageDataStub.data.set.calls.reset();
            canvasStubs = [];

            return Plotly.newPlot(gd, mock2.data, mock2.layout);
        }).then(function() {
            assertImageData([0]);
        }).then(done, done.fail);
    });
});

describe('heatmap hover', function() {
    'use strict';

    var gd;

    function _hover(gd, xval, yval) {
        var fullLayout = gd._fullLayout;
        var calcData = gd.calcdata;
        var hoverData = [];

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
        expect(hoverPoint.xLabelVal).toBe(xLabel, 'have correct x label');
        expect(hoverPoint.yLabelVal).toBe(yLabel, 'have correct y label');
        expect(hoverPoint.zLabelVal).toBe(zLabel, 'have correct z label');
        expect(hoverPoint.text).toBe(text, 'have correct text label');
    }

    describe('for `heatmap_multi-trace`', function() {
        beforeAll(function(done) {
            gd = createGraphDiv();

            var mock = require('../../image/mocks/heatmap_multi-trace.json');
            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        afterAll(destroyGraphDiv);

        it('should find closest point (case 1) and should', function() {
            var pt = _hover(gd, 0.5, 0.5)[0];

            expect(pt.index).toBe(1, 'have correct index');
            assertLabels(pt, 1, 1, 4);
        });

        it('should find closest point (case 2) and should', function() {
            var pt = _hover(gd, 1.5, 0.5)[0];

            expect(pt.index).toBe(0, 'have correct index');
            assertLabels(pt, 2, 0.2, 6);
        });
    });

    describe('with sorted categories', function() {
        beforeAll(function(done) {
            gd = createGraphDiv();

            var mock = require('../../image/mocks/heatmap_categoryorder.json');
            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(done);
        });
        afterAll(destroyGraphDiv);

        it('should find closest point (case 1) and should', function() {
            var pt = _hover(gd, 3, 1)[0];
            expect(pt.index).toEqual([1, 3], 'have correct index');
            assertLabels(pt, 2.5, 0.5, 0);
        });
    });

    describe('for xyz-column traces', function() {
        beforeAll(function(done) {
            gd = createGraphDiv();

            Plotly.newPlot(gd, [{
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

            expect(pt.index).toBe(0, 'have correct index');
            assertLabels(pt, 1, 1, 10, 'a');

            Plotly.relayout(gd, 'xaxis.range', [1, 2]).then(function() {
                var pt2 = _hover(gd, 1.5, 0.5)[0];

                expect(pt2.index).toBe(1, 'have correct index');
                assertLabels(pt2, 2, 1, 4, 'b');
            })
            .then(done);
        });
    });

    describe('nonuniform bricks', function() {
        beforeAll(function(done) {
            gd = createGraphDiv();

            var mock = require('../../image/mocks/heatmap_contour_irregular_bricks.json');
            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        afterAll(destroyGraphDiv);

        function checkData() {
            var pt = _hover(gd, -4, 6)[0];
            assertLabels(pt, 0, 10, 1);

            pt = _hover(gd, 10.5, 12.5)[0];
            assertLabels(pt, 10, 12, 2);

            pt = _hover(gd, 11.5, 4)[0];
            assertLabels(pt, 12, 0, 3);
        }

        it('gives data positions, not brick centers', function(done) {
            checkData();

            Plotly.restyle(gd, {zsmooth: 'none'}, [0])
            .then(checkData)
            .then(done, done.fail);
        });
    });

    describe('missing data', function() {
        beforeAll(function(done) {
            gd = createGraphDiv();

            Plotly.newPlot(gd, {
                data: [{
                    type: 'heatmap',
                    x: [10, 11, 10, 11],
                    y: [100, 100, 101, 101],
                    z: [null, 1, 2, 3],
                    connectgaps: false,
                    hoverongaps: false
                }]
            }).then(done);
        });
        afterAll(destroyGraphDiv);

        it('should not display hover on missing data and hoverongaps is disabled', function() {
            var hoverData;
            gd.on('plotly_hover', function(data) {
                hoverData = data;
            });

            var pt = _hover(gd, 10, 100)[0];

            expect(hoverData).toEqual(undefined);
            expect(pt).toEqual(undefined);
        });
    });
});
