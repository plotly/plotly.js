var Plotly = require('@lib/index');

var Bar = require('@src/traces/bar');
var Lib = require('@src/lib');
var Plots = require('@src/plots/plots');
var Drawing = require('@src/components/drawing');

var Axes = require('@src/plots/cartesian/axes');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var checkTicks = require('../assets/custom_assertions').checkTicks;
var supplyAllDefaults = require('../assets/supply_defaults');

var customAssertions = require('../assets/custom_assertions');
var assertClip = customAssertions.assertClip;
var assertNodeDisplay = customAssertions.assertNodeDisplay;

var d3 = require('d3');

describe('Bar.supplyDefaults', function() {
    'use strict';

    var traceIn,
        traceOut;

    var defaultColor = '#444';

    var supplyDefaults = Bar.supplyDefaults;

    beforeEach(function() {
        traceOut = {};
    });

    it('should set visible to false when x and y are empty', function() {
        traceIn = {};
        supplyDefaults(traceIn, traceOut, defaultColor, {});
        expect(traceOut.visible).toBe(false);

        traceIn = {
            x: [],
            y: []
        };
        supplyDefaults(traceIn, traceOut, defaultColor, {});
        expect(traceOut.visible).toBe(false);
    });

    it('should set visible to false when x or y is empty', function() {
        traceIn = {
            x: []
        };
        supplyDefaults(traceIn, traceOut, defaultColor, {});
        expect(traceOut.visible).toBe(false);

        traceIn = {
            x: [],
            y: [1, 2, 3]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, {});
        expect(traceOut.visible).toBe(false);

        traceIn = {
            y: []
        };
        supplyDefaults(traceIn, traceOut, defaultColor, {});
        expect(traceOut.visible).toBe(false);

        traceIn = {
            x: [1, 2, 3],
            y: []
        };
        supplyDefaults(traceIn, traceOut, defaultColor, {});
        expect(traceOut.visible).toBe(false);
    });

    [{letter: 'y', counter: 'x'}, {letter: 'x', counter: 'y'}].forEach(function(spec) {
        var l = spec.letter;
        var c = spec.counter;
        var c0 = c + '0';
        var dc = 'd' + c;
        it('should be visible using ' + c0 + '/' + dc + ' if ' + c + ' is missing completely but ' + l + ' is present', function() {
            traceIn = {};
            traceIn[l] = [1, 2];
            supplyDefaults(traceIn, traceOut, defaultColor, {});
            expect(traceOut.visible).toBe(undefined, l); // visible: true gets set above the module level
            expect(traceOut._length).toBe(2, l);
            expect(traceOut[c0]).toBe(0, c0);
            expect(traceOut[dc]).toBe(1, dc);
            expect(traceOut.orientation).toBe(l === 'x' ? 'h' : 'v', l);
        });
    });

    it('should not set base, offset or width', function() {
        traceIn = {
            y: [1, 2, 3]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, {});
        expect(traceOut.base).toBeUndefined();
        expect(traceOut.offset).toBeUndefined();
        expect(traceOut.width).toBeUndefined();
    });

    it('should coerce a non-negative width', function() {
        traceIn = {
            width: -1,
            y: [1, 2, 3]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, {});
        expect(traceOut.width).toBeUndefined();
    });

    it('should coerce textposition to none', function() {
        traceIn = {
            y: [1, 2, 3]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, {});
        expect(traceOut.textposition).toBe('none');
        expect(traceOut.texfont).toBeUndefined();
        expect(traceOut.insidetexfont).toBeUndefined();
        expect(traceOut.outsidetexfont).toBeUndefined();
        expect(traceOut.constraintext).toBeUndefined();
    });

    it('should default textfont to layout.font', function() {
        traceIn = {
            textposition: 'inside',
            y: [1, 2, 3]
        };

        var layout = {
            font: {family: 'arial', color: '#AAA', size: 13}
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);

        expect(traceOut.textposition).toBe('inside');
        expect(traceOut.textfont).toEqual(layout.font);
        expect(traceOut.textfont).not.toBe(layout.font);
        expect(traceOut.insidetextfont).toEqual(layout.font);
        expect(traceOut.insidetextfont).not.toBe(layout.font);
        expect(traceOut.insidetextfont).not.toBe(traceOut.textfont);
        expect(traceOut.outsidetexfont).toBeUndefined();
        expect(traceOut.constraintext).toBe('both');
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
});

describe('bar calc / crossTraceCalc (formerly known as setPositions)', function() {
    'use strict';

    it('should fill in calc pt fields (stack case)', function() {
        var gd = mockBarPlot([{
            y: [2, 1, 2]
        }, {
            y: [3, 1, 2]
        }, {
            y: [null, null, 2]
        }], {
            barmode: 'stack'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'y', [[2, 1, 2], [5, 2, 4], [undefined, undefined, 6]]);
        assertPointField(cd, 'b', [[0, 0, 0], [2, 1, 2], [0, 0, 4]]);
        assertPointField(cd, 's', [[2, 1, 2], [3, 1, 2], [undefined, undefined, 2]]);
        assertPointField(cd, 'p', [[0, 1, 2], [0, 1, 2], [0, 1, 2]]);
        assertTraceField(cd, 't.barwidth', [0.8, 0.8, 0.8]);
        assertTraceField(cd, 't.poffset', [-0.4, -0.4, -0.4]);
        assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8, 0.8]);
    });

    it('should fill in calc pt fields (overlay case)', function() {
        var gd = mockBarPlot([{
            y: [2, 1, 2]
        }, {
            y: [3, 1, 2]
        }], {
            barmode: 'overlay'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'y', [[2, 1, 2], [3, 1, 2]]);
        assertPointField(cd, 'b', [[0, 0, 0], [0, 0, 0]]);
        assertPointField(cd, 's', [[2, 1, 2], [3, 1, 2]]);
        assertPointField(cd, 'p', [[0, 1, 2], [0, 1, 2]]);
        assertTraceField(cd, 't.barwidth', [0.8, 0.8]);
        assertTraceField(cd, 't.poffset', [-0.4, -0.4]);
        assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8]);
    });

    it('should fill in calc pt fields (group case)', function() {
        var gd = mockBarPlot([{
            y: [2, 1, 2]
        }, {
            y: [3, 1, 2]
        }], {
            barmode: 'group',
            // asumming default bargap is 0.2
            bargroupgap: 0.1
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[-0.2, 0.8, 1.8], [0.2, 1.2, 2.2]]);
        assertPointField(cd, 'y', [[2, 1, 2], [3, 1, 2]]);
        assertPointField(cd, 'b', [[0, 0, 0], [0, 0, 0]]);
        assertPointField(cd, 's', [[2, 1, 2], [3, 1, 2]]);
        assertPointField(cd, 'p', [[0, 1, 2], [0, 1, 2]]);
        assertTraceField(cd, 't.barwidth', [0.36, 0.36]);
        assertTraceField(cd, 't.poffset', [-0.38, 0.02]);
        assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8]);
    });

    it('should fill in calc pt fields (relative case)', function() {
        var gd = mockBarPlot([{
            y: [20, 14, -23]
        }, {
            y: [-12, -18, -29]
        }], {
            barmode: 'relative'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'y', [[20, 14, -23], [-12, -18, -52]]);
        assertPointField(cd, 'b', [[0, 0, 0], [0, 0, -23]]);
        assertPointField(cd, 's', [[20, 14, -23], [-12, -18, -29]]);
        assertPointField(cd, 'p', [[0, 1, 2], [0, 1, 2]]);
        assertTraceField(cd, 't.barwidth', [0.8, 0.8]);
        assertTraceField(cd, 't.poffset', [-0.4, -0.4]);
        assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8]);
    });

    it('should fill in calc pt fields (relative / percent case)', function() {
        var gd = mockBarPlot([{
            x: ['A', 'B', 'C', 'D'],
            y: [20, 14, 40, -60]
        }, {
            x: ['A', 'B', 'C', 'D'],
            y: [-12, -18, 60, -40]
        }], {
            barmode: 'relative',
            barnorm: 'percent'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[0, 1, 2, 3], [0, 1, 2, 3]]);
        assertPointField(cd, 'y', [[100, 100, 40, -60], [-100, -100, 100, -100]]);
        assertPointField(cd, 'b', [[0, 0, 0, 0], [0, 0, 40, -60]]);
        assertPointField(cd, 's', [[100, 100, 40, -60], [-100, -100, 60, -40]]);
        assertPointField(cd, 'p', [[0, 1, 2, 3], [0, 1, 2, 3]]);
        assertTraceField(cd, 't.barwidth', [0.8, 0.8]);
        assertTraceField(cd, 't.poffset', [-0.4, -0.4]);
        assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8]);
    });
});

describe('Bar.calc', function() {
    'use strict';

    it('should guard against invalid base items', function() {
        var gd = mockBarPlot([{
            base: [null, 1, 2],
            y: [1, 2, 3]
        }, {
            base: [null, 1],
            y: [1, 2, 3]
        }, {
            base: null,
            y: [1, 2]
        }], {
            barmode: 'overlay'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[0, 1, 2], [0, 1, 0], [0, 0]]);
    });

    it('should not exclude items with non-numeric x/y from calcdata', function() {
        var gd = mockBarPlot([{
            x: [5, NaN, 15, 20, null, 21],
            y: [20, NaN, 23, 25, null, 26]
        }]);

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[5, NaN, 15, 20, NaN, 21]]);
        assertPointField(cd, 'y', [[20, NaN, 23, 25, NaN, 26]]);
    });

    it('should not exclude items with non-numeric y from calcdata (to plots gaps correctly)', function() {
        var gd = mockBarPlot([{
            x: ['a', 'b', 'c', 'd'],
            y: [1, null, 'nonsense', 15]
        }]);

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[0, 1, 2, 3]]);
        assertPointField(cd, 'y', [[1, NaN, NaN, 15]]);
    });

    it('should not exclude items with non-numeric x from calcdata (to plots gaps correctly)', function() {
        var gd = mockBarPlot([{
            x: [1, null, 'nonsense', 15],
            y: [1, 2, 10, 30]
        }]);

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[1, NaN, NaN, 15]]);
        assertPointField(cd, 'y', [[1, 2, 10, 30]]);
    });
});

describe('Bar.crossTraceCalc (formerly known as setPositions)', function() {
    'use strict';

    it('should guard against invalid offset items', function() {
        var gd = mockBarPlot([{
            offset: [null, 0, 1],
            y: [1, 2, 3]
        }, {
            offset: [null, 1],
            y: [1, 2, 3]
        }, {
            offset: null,
            y: [1]
        }], {
            bargap: 0.2,
            barmode: 'overlay'
        });

        var cd = gd.calcdata;
        assertArrayField(cd[0][0], 't.poffset', [-0.4, 0, 1]);
        assertArrayField(cd[1][0], 't.poffset', [-0.4, 1, -0.4]);
        assertArrayField(cd[2][0], 't.poffset', [-0.4]);
    });

    it('should guard against invalid width items', function() {
        var gd = mockBarPlot([{
            width: [null, 1, 0.8],
            y: [1, 2, 3]
        }, {
            width: [null, 1],
            y: [1, 2, 3]
        }, {
            width: null,
            y: [1]
        }], {
            bargap: 0.2,
            barmode: 'overlay'
        });

        var cd = gd.calcdata;
        assertArrayField(cd[0][0], 't.barwidth', [0.8, 1, 0.8]);
        assertArrayField(cd[1][0], 't.barwidth', [0.8, 1, 0.8]);
        assertArrayField(cd[2][0], 't.barwidth', [0.8]);
    });

    it('should guard against invalid width items (group case)', function() {
        var gd = mockBarPlot([{
            width: [null, 0.1, 0.2],
            y: [1, 2, 3]
        }, {
            width: [null, 0.1],
            y: [1, 2, 3]
        }, {
            width: null,
            y: [1]
        }], {
            bargap: 0,
            barmode: 'group'
        });

        var cd = gd.calcdata;
        assertArrayField(cd[0][0], 't.barwidth', [0.33, 0.1, 0.2]);
        assertArrayField(cd[1][0], 't.barwidth', [0.33, 0.1, 0.33]);
        assertArrayField(cd[2][0], 't.barwidth', [0.33]);
    });

    it('should stack vertical and horizontal traces separately', function() {
        var gd = mockBarPlot([{
            y: [1, 2, 3]
        }, {
            y: [10, 20, 30]
        }, {
            x: [-1, -2, -3]
        }, {
            x: [-10, -20, -30]
        }], {
            barmode: 'stack'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[0, 0, 0], [1, 2, 3], [0, 0, 0], [-1, -2, -3]]);
        assertPointField(cd, 's', [[1, 2, 3], [10, 20, 30], [-1, -2, -3], [-10, -20, -30]]);
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2], [-1, -2, -3], [-11, -22, -33]]);
        assertPointField(cd, 'y', [[1, 2, 3], [11, 22, 33], [0, 1, 2], [0, 1, 2]]);
    });

    it('should not group traces that set offset', function() {
        var gd = mockBarPlot([{
            y: [1, 2, 3]
        }, {
            y: [10, 20, 30]
        }, {
            offset: -1,
            y: [-1, -2, -3]
        }], {
            bargap: 0,
            barmode: 'group'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
        assertPointField(cd, 's', [[1, 2, 3], [10, 20, 30], [-1, -2, -3]]);
        assertPointField(cd, 'x', [[-0.25, 0.75, 1.75], [0.25, 1.25, 2.25], [-0.5, 0.5, 1.5]]);
        assertPointField(cd, 'y', [[1, 2, 3], [10, 20, 30], [-1, -2, -3]]);
    });

    it('should not stack traces that set base', function() {
        var gd = mockBarPlot([{
            y: [1, 2, 3]
        }, {
            y: [10, 20, 30]
        }, {
            base: -1,
            y: [-1, -2, -3]
        }], {
            bargap: 0,
            barmode: 'stack'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[0, 0, 0], [1, 2, 3], [-1, -1, -1]]);
        assertPointField(cd, 's', [[1, 2, 3], [10, 20, 30], [-1, -2, -3]]);
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'y', [[1, 2, 3], [11, 22, 33], [-2, -3, -4]]);
    });

    it('should draw traces separately in overlay mode', function() {
        var gd = mockBarPlot([{
            y: [1, 2, 3]
        }, {
            y: [10, 20, 30]
        }], {
            bargap: 0,
            barmode: 'overlay',
            barnorm: false
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[0, 0, 0], [0, 0, 0]]);
        assertPointField(cd, 's', [[1, 2, 3], [10, 20, 30]]);
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'y', [[1, 2, 3], [10, 20, 30]]);
    });

    it('should ignore barnorm in overlay mode', function() {
        var gd = mockBarPlot([{
            y: [1, 2, 3]
        }, {
            y: [10, 20, 30]
        }], {
            bargap: 0,
            barmode: 'overlay',
            barnorm: 'percent'
        });

        expect(gd._fullLayout.barnorm).toBeUndefined();

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[0, 0, 0], [0, 0, 0]]);
        assertPointField(cd, 's', [[1, 2, 3], [10, 20, 30]]);
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'y', [[1, 2, 3], [10, 20, 30]]);
    });

    it('should honor barnorm for traces that cannot be grouped', function() {
        var gd = mockBarPlot([{
            offset: 0,
            y: [1, 2, 3]
        }], {
            bargap: 0,
            barmode: 'group',
            barnorm: 'percent'
        });

        expect(gd._fullLayout.barnorm).toBe('percent');

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[0, 0, 0]]);
        assertPointField(cd, 's', [[100, 100, 100]]);
        assertPointField(cd, 'x', [[0.5, 1.5, 2.5]]);
        assertPointField(cd, 'y', [[100, 100, 100]]);
    });

    it('should honor barnorm for traces that cannot be stacked', function() {
        var gd = mockBarPlot([{
            offset: 0,
            y: [1, 2, 3]
        }], {
            bargap: 0,
            barmode: 'stack',
            barnorm: 'percent'
        });

        expect(gd._fullLayout.barnorm).toBe('percent');

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[0, 0, 0]]);
        assertPointField(cd, 's', [[100, 100, 100]]);
        assertPointField(cd, 'x', [[0.5, 1.5, 2.5]]);
        assertPointField(cd, 'y', [[100, 100, 100]]);
    });

    it('should honor barnorm (group case)', function() {
        var gd = mockBarPlot([{
            y: [3, 2, 1]
        }, {
            y: [1, 2, 3]
        }], {
            bargap: 0,
            barmode: 'group',
            barnorm: 'fraction'
        });

        expect(gd._fullLayout.barnorm).toBe('fraction');

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[0, 0, 0], [0, 0, 0]]);
        assertPointField(cd, 's', [[0.75, 0.50, 0.25], [0.25, 0.50, 0.75]]);
        assertPointField(cd, 'x', [[-0.25, 0.75, 1.75], [0.25, 1.25, 2.25]]);
        assertPointField(cd, 'y', [[0.75, 0.50, 0.25], [0.25, 0.50, 0.75]]);
    });

    it('should honor barnorm (group+base case)', function() {
        var gd = mockBarPlot([{
            base: [3, 2, 1],
            y: [0, 0, 0]
        }, {
            y: [1, 2, 3]
        }], {
            bargap: 0,
            barmode: 'group',
            barnorm: 'fraction'
        });

        expect(gd._fullLayout.barnorm).toBe('fraction');

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[0.75, 0.50, 0.25], [0, 0, 0]]);
        assertPointField(cd, 's', [[0, 0, 0], [0.25, 0.50, 0.75]]);
        assertPointField(cd, 'x', [[-0.25, 0.75, 1.75], [0.25, 1.25, 2.25]]);
        assertPointField(cd, 'y', [[0.75, 0.50, 0.25], [0.25, 0.50, 0.75]]);
    });

    it('should honor barnorm (stack case)', function() {
        var gd = mockBarPlot([{
            y: [3, 2, 1]
        }, {
            y: [1, 2, 3]
        }], {
            bargap: 0,
            barmode: 'stack',
            barnorm: 'fraction'
        });

        expect(gd._fullLayout.barnorm).toBe('fraction');

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[0, 0, 0], [0.75, 0.50, 0.25]]);
        assertPointField(cd, 's', [[0.75, 0.50, 0.25], [0.25, 0.50, 0.75]]);
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'y', [[0.75, 0.50, 0.25], [1, 1, 1]]);
    });

    it('should honor barnorm (relative case)', function() {
        var gd = mockBarPlot([{
            y: [3, 2, 1]
        }, {
            y: [1, 2, 3]
        }, {
            y: [-3, -2, -1]
        }, {
            y: [-1, -2, -3]
        }], {
            bargap: 0,
            barmode: 'relative',
            barnorm: 'fraction'
        });

        expect(gd._fullLayout.barnorm).toBe('fraction');

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [
            [0, 0, 0], [0.75, 0.50, 0.25],
            [0, 0, 0], [-0.75, -0.50, -0.25]
        ]);
        assertPointField(cd, 's', [
            [0.75, 0.50, 0.25], [0.25, 0.50, 0.75],
            [-0.75, -0.50, -0.25], [-0.25, -0.50, -0.75],
        ]);
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2], [0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'y', [
            [0.75, 0.50, 0.25], [1, 1, 1],
            [-0.75, -0.50, -0.25], [-1, -1, -1],
        ]);
    });

    it('should expand position axis', function() {
        var gd = mockBarPlot([{
            offset: 10,
            width: 2,
            y: [3, 2, 1]
        }, {
            offset: -5,
            width: 2,
            y: [-1, -2, -3]
        }], {
            bargap: 0,
            barmode: 'overlay',
            barnorm: false
        });

        expect(gd._fullLayout.barnorm).toBeUndefined();

        var xa = gd._fullLayout.xaxis,
            ya = gd._fullLayout.yaxis;
        expect(Axes.getAutoRange(gd, xa)).toBeCloseToArray([-5, 14], undefined, '(xa.range)');
        expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([-3.33, 3.33], undefined, '(ya.range)');
    });

    it('should expand size axis (overlay case)', function() {
        var gd = mockBarPlot([{
            base: 7,
            y: [3, 2, 1]
        }, {
            base: 2,
            y: [1, 2, 3]
        }, {
            base: -2,
            y: [-3, -2, -1]
        }, {
            base: -7,
            y: [-1, -2, -3]
        }], {
            bargap: 0,
            barmode: 'overlay',
            barnorm: false
        });

        expect(gd._fullLayout.barnorm).toBeUndefined();

        var xa = gd._fullLayout.xaxis,
            ya = gd._fullLayout.yaxis;
        expect(Axes.getAutoRange(gd, xa)).toBeCloseToArray([-0.5, 2.5], undefined, '(xa.range)');
        expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([-11.11, 11.11], undefined, '(ya.range)');
    });

    it('should expand size axis (relative case)', function() {
        var gd = mockBarPlot([{
            y: [3, 2, 1]
        }, {
            y: [1, 2, 3]
        }, {
            y: [-3, -2, -1]
        }, {
            y: [-1, -2, -3]
        }], {
            bargap: 0,
            barmode: 'relative',
            barnorm: false
        });

        expect(gd._fullLayout.barnorm).toBe('');

        var xa = gd._fullLayout.xaxis,
            ya = gd._fullLayout.yaxis;
        expect(Axes.getAutoRange(gd, xa)).toBeCloseToArray([-0.5, 2.5], undefined, '(xa.range)');
        expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([-4.44, 4.44], undefined, '(ya.range)');
    });

    it('should expand size axis (barnorm case)', function() {
        var gd = mockBarPlot([{
            y: [3, 2, 1]
        }, {
            y: [1, 2, 3]
        }, {
            y: [-3, -2, -1]
        }, {
            y: [-1, -2, -3]
        }], {
            bargap: 0,
            barmode: 'relative',
            barnorm: 'fraction'
        });

        expect(gd._fullLayout.barnorm).toBe('fraction');

        var xa = gd._fullLayout.xaxis,
            ya = gd._fullLayout.yaxis;
        expect(Axes.getAutoRange(gd, xa)).toBeCloseToArray([-0.5, 2.5], undefined, '(xa.range)');
        expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([-1.11, 1.11], undefined, '(ya.range)');
    });

    it('should include explicit base in size axis range', function() {
        var barmodes = ['stack', 'group', 'overlay'];
        barmodes.forEach(function(barmode) {
            var gd = mockBarPlot([
                {y: [3, 4, -5], base: [-1, -2, 7]}
            ], {
                barmode: barmode
            });

            var ya = gd._fullLayout.yaxis;
            expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([-2.5, 7.5]);
        });
    });

    it('should not include date zero (1970) in date axis range', function() {
        var barmodes = ['stack', 'group', 'overlay'];
        barmodes.forEach(function(barmode) {
            var gd = mockBarPlot([
                {y: ['2017-01-01', '2017-01-03', '2017-01-19']}
            ], {
                barmode: barmode
            });

            var ya = gd._fullLayout.yaxis;
            expect(Axes.getAutoRange(gd, ya)).toEqual(['2016-12-31', '2017-01-20']);
        });
    });

    it('works with log axes (grouped bars)', function() {
        var gd = mockBarPlot([
            {y: [1, 10, 1e10, -1]},
            {y: [2, 20, 2e10, -2]}
        ], {
            yaxis: {type: 'log'},
            barmode: 'group'
        });

        var ya = gd._fullLayout.yaxis;
        expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([-0.572, 10.873], undefined, '(ya.range)');
    });

    it('works with log axes (stacked bars)', function() {
        var gd = mockBarPlot([
            {y: [1, 10, 1e10, -1]},
            {y: [2, 20, 2e10, -2]}
        ], {
            yaxis: {type: 'log'},
            barmode: 'stack'
        });

        var ya = gd._fullLayout.yaxis;
        expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([-0.582, 11.059], undefined, '(ya.range)');
    });

    it('works with log axes (normalized bars)', function() {
        // strange case... but it should work!
        var gd = mockBarPlot([
            {y: [1, 10, 1e10, -1]},
            {y: [2, 20, 2e10, -2]}
        ], {
            yaxis: {type: 'log'},
            barmode: 'stack',
            barnorm: 'percent'
        });

        var ya = gd._fullLayout.yaxis;
        expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([1.496, 2.027], undefined, '(ya.range)');
    });
});

describe('A bar plot', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function getAllTraceNodes(node) {
        return node.querySelectorAll('g.points');
    }

    function getAllBarNodes(node) {
        return node.querySelectorAll('g.point');
    }

    function assertTextIsInsidePath(textNode, pathNode) {
        var textBB = textNode.getBoundingClientRect(),
            pathBB = pathNode.getBoundingClientRect();

        expect(pathBB.left).not.toBeGreaterThan(textBB.left);
        expect(textBB.right).not.toBeGreaterThan(pathBB.right);
        expect(pathBB.top).not.toBeGreaterThan(textBB.top);
        expect(textBB.bottom).not.toBeGreaterThan(pathBB.bottom);
    }

    function assertTextIsAbovePath(textNode, pathNode) {
        var textBB = textNode.getBoundingClientRect(),
            pathBB = pathNode.getBoundingClientRect();

        expect(textBB.bottom).not.toBeGreaterThan(pathBB.top);
    }

    function assertTextIsBelowPath(textNode, pathNode) {
        var textBB = textNode.getBoundingClientRect(),
            pathBB = pathNode.getBoundingClientRect();

        expect(pathBB.bottom).not.toBeGreaterThan(textBB.top);
    }

    function assertTextIsAfterPath(textNode, pathNode) {
        var textBB = textNode.getBoundingClientRect(),
            pathBB = pathNode.getBoundingClientRect();

        expect(pathBB.right).not.toBeGreaterThan(textBB.left);
    }

    var colorMap = {
        'rgb(0, 0, 0)': 'black',
        'rgb(255, 0, 0)': 'red',
        'rgb(0, 128, 0)': 'green',
        'rgb(0, 0, 255)': 'blue'
    };
    function assertTextFont(textNode, textFont, index) {
        expect(textNode.style.fontFamily).toBe(textFont.family[index]);
        expect(textNode.style.fontSize).toBe(textFont.size[index] + 'px');

        var color = textNode.style.fill;
        if(!colorMap[color]) colorMap[color] = color;
        expect(colorMap[color]).toBe(textFont.color[index]);
    }

    function assertTextIsBeforePath(textNode, pathNode) {
        var textBB = textNode.getBoundingClientRect(),
            pathBB = pathNode.getBoundingClientRect();

        expect(textBB.right).not.toBeGreaterThan(pathBB.left);
    }

    it('should show bar texts (inside case)', function(done) {
        var data = [{
            y: [10, 20, 30],
            type: 'bar',
            text: ['1', 'Very very very very very long bar text'],
            textposition: 'inside',
        }];
        var layout = {};

        Plotly.plot(gd, data, layout).then(function() {
            var traceNodes = getAllTraceNodes(gd),
                barNodes = getAllBarNodes(traceNodes[0]),
                foundTextNodes;

            for(var i = 0; i < barNodes.length; i++) {
                var barNode = barNodes[i],
                    pathNode = barNode.querySelector('path'),
                    textNode = barNode.querySelector('text');
                if(textNode) {
                    foundTextNodes = true;
                    assertTextIsInsidePath(textNode, pathNode);
                }
            }

            expect(foundTextNodes).toBe(true);
        })
        .catch(failTest)
        .then(done);
    });

    it('should show bar texts (outside case)', function(done) {
        var data = [{
            y: [10, -20, 30],
            type: 'bar',
            text: ['1', 'Very very very very very long bar text'],
            textposition: 'outside',
        }];
        var layout = {
            barmode: 'relative'
        };

        Plotly.plot(gd, data, layout).then(function() {
            var traceNodes = getAllTraceNodes(gd),
                barNodes = getAllBarNodes(traceNodes[0]),
                foundTextNodes;

            for(var i = 0; i < barNodes.length; i++) {
                var barNode = barNodes[i],
                    pathNode = barNode.querySelector('path'),
                    textNode = barNode.querySelector('text');
                if(textNode) {
                    foundTextNodes = true;
                    if(data[0].y[i] > 0) assertTextIsAbovePath(textNode, pathNode);
                    else assertTextIsBelowPath(textNode, pathNode);
                }
            }

            expect(foundTextNodes).toBe(true);
        })
        .catch(failTest)
        .then(done);
    });

    it('should show bar texts (horizontal case)', function(done) {
        var data = [{
            x: [10, -20, 30],
            type: 'bar',
            text: ['Very very very very very long bar text', -20],
            textposition: 'outside',
        }];
        var layout = {};

        Plotly.plot(gd, data, layout).then(function() {
            var traceNodes = getAllTraceNodes(gd),
                barNodes = getAllBarNodes(traceNodes[0]),
                foundTextNodes;

            for(var i = 0; i < barNodes.length; i++) {
                var barNode = barNodes[i],
                    pathNode = barNode.querySelector('path'),
                    textNode = barNode.querySelector('text');
                if(textNode) {
                    foundTextNodes = true;
                    if(data[0].x[i] > 0) assertTextIsAfterPath(textNode, pathNode);
                    else assertTextIsBeforePath(textNode, pathNode);
                }
            }

            expect(foundTextNodes).toBe(true);
        })
        .catch(failTest)
        .then(done);
    });

    it('should show bar texts (barnorm case)', function(done) {
        var data = [{
            x: [100, -100, 100],
            type: 'bar',
            text: [100, -100, 100],
            textposition: 'outside',
        }];
        var layout = {
            barmode: 'relative',
            barnorm: 'percent'
        };

        Plotly.plot(gd, data, layout).then(function() {
            var traceNodes = getAllTraceNodes(gd),
                barNodes = getAllBarNodes(traceNodes[0]),
                foundTextNodes;

            for(var i = 0; i < barNodes.length; i++) {
                var barNode = barNodes[i],
                    pathNode = barNode.querySelector('path'),
                    textNode = barNode.querySelector('text');
                if(textNode) {
                    foundTextNodes = true;
                    if(data[0].x[i] > 0) assertTextIsAfterPath(textNode, pathNode);
                    else assertTextIsBeforePath(textNode, pathNode);
                }
            }

            expect(foundTextNodes).toBe(true);
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to restyle', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/bar_attrs_relative'));

        Plotly.plot(gd, mock.data, mock.layout).then(function() {
            var cd = gd.calcdata;
            assertPointField(cd, 'x', [
                [1, 2, 3, 4], [1, 2, 3, 4],
                [1, 2, 3, 4], [1, 2, 3, 4]]);
            assertPointField(cd, 'y', [
                [1, 2, 3, 4], [4, 4, 4, 4],
                [-1, -3, -2, -4], [4, -3.25, -5, -6]]);
            assertPointField(cd, 'b', [
                [0, 0, 0, 0], [1, 2, 3, 4],
                [0, 0, 0, 0], [4, -3, -2, -4]]);
            assertPointField(cd, 's', [
                [1, 2, 3, 4], [3, 2, 1, 0],
                [-1, -3, -2, -4], [0, -0.25, -3, -2]]);
            assertPointField(cd, 'p', [
                [1, 2, 3, 4], [1, 2, 3, 4],
                [1, 2, 3, 4], [1, 2, 3, 4]]);
            assertArrayField(cd[0][0], 't.barwidth', [1, 0.8, 0.6, 0.4]);
            assertArrayField(cd[1][0], 't.barwidth', [0.4, 0.6, 0.8, 1]);
            expect(cd[2][0].t.barwidth).toBe(1);
            expect(cd[3][0].t.barwidth).toBe(0.8);
            assertArrayField(cd[0][0], 't.poffset', [-0.5, -0.4, -0.3, -0.2]);
            assertArrayField(cd[1][0], 't.poffset', [-0.2, -0.3, -0.4, -0.5]);
            expect(cd[2][0].t.poffset).toBe(-0.5);
            expect(cd[3][0].t.poffset).toBe(-0.4);
            assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8, 0.8, 0.8]);

            return Plotly.restyle(gd, 'offset', 0);
        }).then(function() {
            var cd = gd.calcdata;
            assertPointField(cd, 'x', [
                [1.5, 2.4, 3.3, 4.2], [1.2, 2.3, 3.4, 4.5],
                [1.5, 2.5, 3.5, 4.5], [1.4, 2.4, 3.4, 4.4]]);
            assertPointField(cd, 'y', [
                [1, 2, 3, 4], [4, 4, 4, 4],
                [-1, -3, -2, -4], [4, -3.25, -5, -6]]);
            assertPointField(cd, 'b', [
                [0, 0, 0, 0], [1, 2, 3, 4],
                [0, 0, 0, 0], [4, -3, -2, -4]]);
            assertPointField(cd, 's', [
                [1, 2, 3, 4], [3, 2, 1, 0],
                [-1, -3, -2, -4], [0, -0.25, -3, -2]]);
            assertPointField(cd, 'p', [
                [1, 2, 3, 4], [1, 2, 3, 4],
                [1, 2, 3, 4], [1, 2, 3, 4]]);
            assertArrayField(cd[0][0], 't.barwidth', [1, 0.8, 0.6, 0.4]);
            assertArrayField(cd[1][0], 't.barwidth', [0.4, 0.6, 0.8, 1]);
            expect(cd[2][0].t.barwidth).toBe(1);
            expect(cd[3][0].t.barwidth).toBe(0.8);
            expect(cd[0][0].t.poffset).toBe(0);
            expect(cd[1][0].t.poffset).toBe(0);
            expect(cd[2][0].t.poffset).toBe(0);
            expect(cd[3][0].t.poffset).toBe(0);
            assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8, 0.8, 0.8]);

            var traceNodes = getAllTraceNodes(gd),
                trace0Bar3 = getAllBarNodes(traceNodes[0])[3],
                path03 = trace0Bar3.querySelector('path'),
                text03 = trace0Bar3.querySelector('text'),
                trace1Bar2 = getAllBarNodes(traceNodes[1])[2],
                path12 = trace1Bar2.querySelector('path'),
                text12 = trace1Bar2.querySelector('text'),
                trace2Bar0 = getAllBarNodes(traceNodes[2])[0],
                path20 = trace2Bar0.querySelector('path'),
                text20 = trace2Bar0.querySelector('text'),
                trace3Bar0 = getAllBarNodes(traceNodes[3])[0],
                path30 = trace3Bar0.querySelector('path'),
                text30 = trace3Bar0.querySelector('text');

            expect(text03.textContent).toBe('4');
            expect(text12.textContent).toBe('inside text');
            expect(text20.textContent).toBe('-1');
            expect(text30.textContent).toBe('outside text');

            assertTextIsAbovePath(text03, path03); // outside
            assertTextIsInsidePath(text12, path12); // inside
            assertTextIsInsidePath(text20, path20); // inside
            assertTextIsBelowPath(text30, path30); // outside

            // clear bounding box cache - somehow when you cache
            // text size too early sometimes it changes later...
            // we've had this issue before, where we've had to
            // redraw annotations to get final sizes, I wish we
            // could get some signal that fonts are really ready
            // and not start drawing until then (or invalidate
            // the bbox cache when that happens?)
            // without this change, we get an error at
            // assertTextIsInsidePath(text30, path30);
            Drawing.savedBBoxes = {};

            return Plotly.restyle(gd, 'textposition', 'inside');
        }).then(function() {
            var cd = gd.calcdata;
            assertPointField(cd, 'x', [
                [1.5, 2.4, 3.3, 4.2], [1.2, 2.3, 3.4, 4.5],
                [1.5, 2.5, 3.5, 4.5], [1.4, 2.4, 3.4, 4.4]]);
            assertPointField(cd, 'y', [
                [1, 2, 3, 4], [4, 4, 4, 4],
                [-1, -3, -2, -4], [4, -3.25, -5, -6]]);
            assertPointField(cd, 'b', [
                [0, 0, 0, 0], [1, 2, 3, 4],
                [0, 0, 0, 0], [4, -3, -2, -4]]);
            assertPointField(cd, 's', [
                [1, 2, 3, 4], [3, 2, 1, 0],
                [-1, -3, -2, -4], [0, -0.25, -3, -2]]);
            assertPointField(cd, 'p', [
                [1, 2, 3, 4], [1, 2, 3, 4],
                [1, 2, 3, 4], [1, 2, 3, 4]]);
            assertArrayField(cd[0][0], 't.barwidth', [1, 0.8, 0.6, 0.4]);
            assertArrayField(cd[1][0], 't.barwidth', [0.4, 0.6, 0.8, 1]);
            expect(cd[2][0].t.barwidth).toBe(1);
            expect(cd[3][0].t.barwidth).toBe(0.8);
            expect(cd[0][0].t.poffset).toBe(0);
            expect(cd[1][0].t.poffset).toBe(0);
            expect(cd[2][0].t.poffset).toBe(0);
            expect(cd[3][0].t.poffset).toBe(0);
            assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8, 0.8, 0.8]);

            var traceNodes = getAllTraceNodes(gd),
                trace0Bar3 = getAllBarNodes(traceNodes[0])[3],
                path03 = trace0Bar3.querySelector('path'),
                text03 = trace0Bar3.querySelector('text'),
                trace1Bar2 = getAllBarNodes(traceNodes[1])[2],
                path12 = trace1Bar2.querySelector('path'),
                text12 = trace1Bar2.querySelector('text'),
                trace2Bar0 = getAllBarNodes(traceNodes[2])[0],
                path20 = trace2Bar0.querySelector('path'),
                text20 = trace2Bar0.querySelector('text'),
                trace3Bar0 = getAllBarNodes(traceNodes[3])[0],
                path30 = trace3Bar0.querySelector('path'),
                text30 = trace3Bar0.querySelector('text');

            expect(text03.textContent).toBe('4');
            expect(text12.textContent).toBe('inside text');
            expect(text20.textContent).toBe('-1');
            expect(text30.textContent).toBe('outside text');

            assertTextIsInsidePath(text03, path03); // inside
            assertTextIsInsidePath(text12, path12); // inside
            assertTextIsInsidePath(text20, path20); // inside
            assertTextIsInsidePath(text30, path30); // inside
        })
        .catch(failTest)
        .then(done);
    });

    it('should coerce text-related attributes', function(done) {
        var data = [{
            y: [10, 20, 30, 40],
            type: 'bar',
            text: ['T1P1', 'T1P2', 13, 14],
            textposition: ['inside', 'outside', 'auto', 'BADVALUE'],
            textfont: {
                family: ['"comic sans"'],
                color: ['red', 'green'],
            },
            insidetextfont: {
                size: [8, 12, 16],
                color: ['black'],
            },
            outsidetextfont: {
                size: [null, 24, 32]
            }
        }];
        var layout = {
            font: {family: 'arial', color: 'blue', size: 13}
        };

        var expected = {
            y: [10, 20, 30, 40],
            type: 'bar',
            text: ['T1P1', 'T1P2', '13', '14'],
            textposition: ['inside', 'outside', 'none'],
            textfont: {
                family: ['"comic sans"', 'arial'],
                color: ['red', 'green'],
                size: [13, 13]
            },
            insidetextfont: {
                family: ['"comic sans"', 'arial', 'arial'],
                color: ['black', 'green', 'blue'],
                size: [8, 12, 16]
            },
            outsidetextfont: {
                family: ['"comic sans"', 'arial', 'arial'],
                color: ['red', 'green', 'blue'],
                size: [13, 24, 32]
            }
        };

        Plotly.plot(gd, data, layout).then(function() {
            var traceNodes = getAllTraceNodes(gd),
                barNodes = getAllBarNodes(traceNodes[0]),
                pathNodes = [
                    barNodes[0].querySelector('path'),
                    barNodes[1].querySelector('path'),
                    barNodes[2].querySelector('path'),
                    barNodes[3].querySelector('path')
                ],
                textNodes = [
                    barNodes[0].querySelector('text'),
                    barNodes[1].querySelector('text'),
                    barNodes[2].querySelector('text'),
                    barNodes[3].querySelector('text')
                ],
                i;

            // assert bar texts
            for(i = 0; i < 3; i++) {
                expect(textNodes[i].textContent).toBe(expected.text[i]);
            }

            // assert bar positions
            assertTextIsInsidePath(textNodes[0], pathNodes[0]); // inside
            assertTextIsAbovePath(textNodes[1], pathNodes[1]); // outside
            assertTextIsInsidePath(textNodes[2], pathNodes[2]); // auto -> inside
            expect(textNodes[3]).toBe(null); // BADVALUE -> none

            // assert fonts
            assertTextFont(textNodes[0], expected.insidetextfont, 0);
            assertTextFont(textNodes[1], expected.outsidetextfont, 1);
            assertTextFont(textNodes[2], expected.insidetextfont, 2);
        })
        .catch(failTest)
        .then(done);
    });

    it('can change orientation and correctly sets axis types', function(done) {
        function checkBarsMatch(dims, msg) {
            var bars = d3.selectAll('.bars .point');
            var bbox1 = bars.node().getBoundingClientRect();
            bars.each(function(d, i) {
                if(!i) return;
                var bbox = this.getBoundingClientRect();
                ['left', 'right', 'top', 'bottom', 'width', 'height'].forEach(function(dim) {
                    expect(bbox[dim]).negateIf(dims.indexOf(dim) === -1)
                        .toBeWithin(bbox1[dim], 0.1, msg + ' (' + i + '): ' + dim);
                });
            });
        }

        Plotly.newPlot(gd, [{
            x: ['a', 'b', 'c'],
            y: [1, 2, 3],
            type: 'bar'
        }], {
            width: 400, height: 400
        })
        .then(function() {
            checkTicks('x', ['a', 'b', 'c'], 'initial x');
            checkTicks('y', ['0', '0.5', '1', '1.5', '2', '2.5', '3'], 'initial y');

            checkBarsMatch(['bottom', 'width'], 'initial');

            // turn implicit "v" into explicit "v" - a noop but specifically
            // for orientation this was broken at one point...
            return Plotly.restyle(gd, {orientation: 'v'});
        })
        .then(function() {
            checkTicks('x', ['a', 'b', 'c'], 'explicit v x');
            checkTicks('y', ['0', '0.5', '1', '1.5', '2', '2.5', '3'], 'explicit v y');

            checkBarsMatch(['bottom', 'width'], 'explicit v');

            // back to implicit v
            return Plotly.restyle(gd, {orientation: null});
        })
        .then(function() {
            checkTicks('x', ['a', 'b', 'c'], 'implicit v x');
            checkTicks('y', ['0', '0.5', '1', '1.5', '2', '2.5', '3'], 'implicit v y');

            checkBarsMatch(['bottom', 'width'], 'implicit v');

            return Plotly.restyle(gd, {orientation: 'h'});
        })
        .then(function() {
            checkTicks('x', ['0', '1', '2', '3'], 'h x');
            checkTicks('y', ['a', 'b', 'c'], 'h y');

            checkBarsMatch(['left', 'height'], 'initial');

            return Plotly.restyle(gd, {orientation: 'v'});
        })
        .then(function() {
            checkTicks('x', ['a', 'b', 'c'], 'final x');
            checkTicks('y', ['0', '0.5', '1', '1.5', '2', '2.5', '3'], 'final y');

            checkBarsMatch(['bottom', 'width'], 'final');
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to add/remove text node on restyle', function(done) {
        function _assertNumberOfBarTextNodes(cnt) {
            var sel = d3.select(gd).select('.barlayer').selectAll('text');
            expect(sel.size()).toBe(cnt);
        }

        Plotly.plot(gd, [{
            type: 'bar',
            x: ['Product A', 'Product B', 'Product C'],
            y: [20, 14, 23],
            text: [20, 14, 23],
            textposition: 'auto'
        }])
        .then(function() {
            _assertNumberOfBarTextNodes(3);
            return Plotly.restyle(gd, 'textposition', 'none');
        })
        .then(function() {
            _assertNumberOfBarTextNodes(0);
            return Plotly.restyle(gd, 'textposition', 'auto');
        })
        .then(function() {
            _assertNumberOfBarTextNodes(3);
            return Plotly.restyle(gd, 'text', [[null, 0, '']]);
        })
        .then(function() {
            // N.B. that '0' should be there!
            _assertNumberOfBarTextNodes(1);
            return Plotly.restyle(gd, 'text', 'yo!');
        })
        .then(function() {
            _assertNumberOfBarTextNodes(3);
        })
        .catch(failTest)
        .then(done);
    });
});

describe('bar visibility toggling:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function _assert(msg, xrng, yrng, calls) {
        var fullLayout = gd._fullLayout;
        expect(fullLayout.xaxis.range).toBeCloseToArray(xrng, 2, msg + ' xrng');
        expect(fullLayout.yaxis.range).toBeCloseToArray(yrng, 2, msg + ' yrng');

        var crossTraceCalc = gd._fullData[0]._module.crossTraceCalc;
        expect(crossTraceCalc).toHaveBeenCalledTimes(calls);
        crossTraceCalc.calls.reset();
    }

    it('should update axis range according to visible edits (group case)', function(done) {
        Plotly.plot(gd, [
            {type: 'bar', x: [1, 2, 3], y: [1, 2, 1]},
            {type: 'bar', x: [1, 2, 3], y: [-1, -2, -1]}
        ])
        .then(function() {
            spyOn(gd._fullData[0]._module, 'crossTraceCalc').and.callThrough();

            _assert('base', [0.5, 3.5], [-2.222, 2.222], 0);
            return Plotly.restyle(gd, 'visible', false, [1]);
        })
        .then(function() {
            _assert('visible [true,false]', [0.5, 3.5], [0, 2.105], 1);
            return Plotly.restyle(gd, 'visible', false, [0]);
        })
        .then(function() {
            _assert('both invisible', [0.5, 3.5], [0, 2.105], 0);
            return Plotly.restyle(gd, 'visible', true, [1]);
        })
        .then(function() {
            _assert('visible [false,true]', [0.5, 3.5], [-2.105, 0], 1);
            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            _assert('back to both visible', [0.5, 3.5], [-2.222, 2.222], 1);
        })
        .catch(failTest)
        .then(done);
    });

    it('should update axis range according to visible edits (stack case)', function(done) {
        Plotly.plot(gd, [
            {type: 'bar', x: [1, 2, 3], y: [1, 2, 1]},
            {type: 'bar', x: [1, 2, 3], y: [2, 3, 2]}
        ], {barmode: 'stack'})
        .then(function() {
            spyOn(gd._fullData[0]._module, 'crossTraceCalc').and.callThrough();

            _assert('base', [0.5, 3.5], [0, 5.263], 0);
            return Plotly.restyle(gd, 'visible', false, [1]);
        })
        .then(function() {
            _assert('visible [true,false]', [0.5, 3.5], [0, 2.105], 1);
            return Plotly.restyle(gd, 'visible', false, [0]);
        })
        .then(function() {
            _assert('both invisible', [0.5, 3.5], [0, 2.105], 0);
            return Plotly.restyle(gd, 'visible', true, [1]);
        })
        .then(function() {
            _assert('visible [false,true]', [0.5, 3.5], [0, 3.157], 1);
            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            _assert('back to both visible', [0.5, 3.5], [0, 5.263], 1);
        })
        .catch(failTest)
        .then(done);
    });
});

describe('bar hover', function() {
    'use strict';

    var gd;

    afterEach(destroyGraphDiv);

    function getPointData(gd) {
        var cd = gd.calcdata,
            subplot = gd._fullLayout._plots.xy;

        return {
            index: false,
            distance: 20,
            cd: cd[0],
            trace: cd[0][0].trace,
            xa: subplot.xaxis,
            ya: subplot.yaxis,
            maxHoverDistance: 20
        };
    }

    function _hover(gd, xval, yval, hovermode) {
        var pointData = getPointData(gd);
        var pts = Bar.hoverPoints(pointData, xval, yval, hovermode);
        if(!pts) return false;

        var pt = pts[0];

        return {
            style: [pt.index, pt.color, pt.xLabelVal, pt.yLabelVal],
            pos: [pt.x0, pt.x1, pt.y0, pt.y1],
            text: pt.text
        };
    }

    function assertPos(actual, expected) {
        var TOL = 5;

        actual.forEach(function(p, i) {
            expect(p).toBeWithin(expected[i], TOL);
        });
    }

    describe('with orientation *v*', function() {
        beforeAll(function(done) {
            gd = createGraphDiv();

            var mock = Lib.extendDeep({}, require('@mocks/11.json'));

            Plotly.plot(gd, mock.data, mock.layout)
            .catch(failTest)
            .then(done);
        });

        it('should return the correct hover point data (case x)', function() {
            var out = _hover(gd, 0, 0, 'x');

            expect(out.style).toEqual([0, 'rgb(255, 102, 97)', 0, 13.23]);
            assertPos(out.pos, [11.87, 106.8, 152.76, 152.76]);
        });

        it('should return the correct hover point data (case closest)', function() {
            var out = _hover(gd, -0.2, 12, 'closest');

            expect(out.style).toEqual([0, 'rgb(255, 102, 97)', 0, 13.23]);
            assertPos(out.pos, [11.87, 59.33, 152.76, 152.76]);
        });
    });

    describe('with orientation *h*', function() {
        beforeAll(function(done) {
            gd = createGraphDiv();

            var mock = Lib.extendDeep({}, require('@mocks/bar_attrs_group_norm.json'));

            Plotly.plot(gd, mock.data, mock.layout)
            .catch(failTest)
            .then(done);
        });

        it('should return the correct hover point data (case y)', function() {
            var out = _hover(gd, 0.75, 0.15, 'y'),
                subplot = gd._fullLayout._plots.xy,
                xa = subplot.xaxis,
                ya = subplot.yaxis,
                barDelta = 1 * 0.8 / 2,
                x0 = xa.c2p(0.5, true),
                x1 = x0,
                y0 = ya.c2p(0 - barDelta, true),
                y1 = ya.c2p(0 + barDelta, true);

            expect(out.style).toEqual([0, '#1f77b4', 0.5, 0]);
            assertPos(out.pos, [x0, x1, y0, y1]);
        });

        it('should return the correct hover point data (case closest)', function() {
            var out = _hover(gd, 0.75, -0.15, 'closest'),
                subplot = gd._fullLayout._plots.xy,
                xa = subplot.xaxis,
                ya = subplot.yaxis,
                barDelta = 1 * 0.8 / 2 / 2,
                barPos = 0 - 1 * 0.8 / 2 + barDelta,
                x0 = xa.c2p(0.5, true),
                x1 = x0,
                y0 = ya.c2p(barPos - barDelta, true),
                y1 = ya.c2p(barPos + barDelta, true);

            expect(out.style).toEqual([0, '#1f77b4', 0.5, 0]);
            assertPos(out.pos, [x0, x1, y0, y1]);
        });
    });

    describe('text labels', function() {

        it('should show \'hovertext\' items when present, \'text\' if not', function(done) {
            gd = createGraphDiv();

            var mock = Lib.extendDeep({}, require('@mocks/text_chart_arrays'));
            mock.data.forEach(function(t) { t.type = 'bar'; });

            Plotly.plot(gd, mock).then(function() {
                var out = _hover(gd, -0.25, 0.5, 'closest');
                expect(out.text).toEqual('Hover text\nA', 'hover text');

                return Plotly.restyle(gd, 'hovertext', null);
            })
            .then(function() {
                var out = _hover(gd, -0.25, 0.5, 'closest');
                expect(out.text).toEqual('Text\nA', 'hover text');

                return Plotly.restyle(gd, 'text', ['APPLE', 'BANANA', 'ORANGE']);
            })
            .then(function() {
                var out = _hover(gd, -0.25, 0.5, 'closest');
                expect(out.text).toEqual('APPLE', 'hover text');

                return Plotly.restyle(gd, 'hovertext', ['apple', 'banana', 'orange']);
            })
            .then(function() {
                var out = _hover(gd, -0.25, 0.5, 'closest');
                expect(out.text).toEqual('apple', 'hover text');
            })
            .catch(failTest)
            .then(done);
        });
    });

    describe('with special width/offset combinations', function() {

        beforeEach(function() {
            gd = createGraphDiv();
        });

        it('should return correct hover data (single bar, trace width)', function(done) {
            Plotly.plot(gd, [{
                type: 'bar',
                x: [1],
                y: [2],
                width: 10,
                marker: { color: 'red' }
            }], {
                xaxis: { range: [-200, 200] }
            })
            .then(function() {
                // all these x, y, hovermode should give the same (the only!) hover label
                [
                    [0, 0, 'closest'],
                    [-3.9, 1, 'closest'],
                    [5.9, 1.9, 'closest'],
                    [-3.9, -10, 'x'],
                    [5.9, 19, 'x']
                ].forEach(function(hoverSpec) {
                    var out = _hover(gd, hoverSpec[0], hoverSpec[1], hoverSpec[2]);

                    expect(out.style).toEqual([0, 'red', 1, 2], hoverSpec);
                    assertPos(out.pos, [264, 278, 14, 14], hoverSpec);
                });

                // then a few that are off the edge so yield nothing
                [
                    [1, -0.1, 'closest'],
                    [1, 2.1, 'closest'],
                    [-4.1, 1, 'closest'],
                    [6.1, 1, 'closest'],
                    [-4.1, 1, 'x'],
                    [6.1, 1, 'x']
                ].forEach(function(hoverSpec) {
                    var out = _hover(gd, hoverSpec[0], hoverSpec[1], hoverSpec[2]);

                    expect(out).toBe(false, hoverSpec);
                });
            })
            .catch(failTest)
            .then(done);
        });

        it('should return correct hover data (two bars, array width)', function(done) {
            Plotly.plot(gd, [{
                type: 'bar',
                x: [1, 200],
                y: [2, 1],
                width: [10, 20],
                marker: { color: 'red' }
            }, {
                type: 'bar',
                x: [1, 200],
                y: [1, 2],
                width: [20, 10],
                marker: { color: 'green' }
            }], {
                xaxis: { range: [-200, 300] },
                width: 500,
                height: 500
            })
            .then(function() {
                var out = _hover(gd, -36, 1.5, 'closest');

                expect(out.style).toEqual([0, 'red', 1, 2]);
                assertPos(out.pos, [99, 106, 13, 13]);

                out = _hover(gd, 164, 0.8, 'closest');

                expect(out.style).toEqual([1, 'red', 200, 1]);
                assertPos(out.pos, [222, 235, 168, 168]);

                out = _hover(gd, 125, 0.8, 'x');

                expect(out.style).toEqual([1, 'red', 200, 1]);
                assertPos(out.pos, [222, 280, 168, 168]);
            })
            .catch(failTest)
            .then(done);
        });

        it('positions labels correctly w.r.t. narrow bars', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 10, 20],
                y: [1, 3, 2],
                type: 'bar',
                width: 1
            }], {
                width: 500,
                height: 500,
                margin: {l: 100, r: 100, t: 100, b: 100}
            })
            .then(function() {
                // you can still hover over the gap (14) but the label will
                // get pushed in to the bar
                var out = _hover(gd, 14, 2, 'x');
                assertPos(out.pos, [145, 155, 15, 15]);

                // in closest mode you must be over the bar though
                out = _hover(gd, 14, 2, 'closest');
                expect(out).toBe(false);

                // now for a single bar trace, closest and compare modes give the same
                // positioning of hover labels
                out = _hover(gd, 10, 2, 'closest');
                assertPos(out.pos, [145, 155, 15, 15]);
            })
            .catch(failTest)
            .then(done);
        });
    });

    it('should show/hide text in clipped and non-clipped layers', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/bar_cliponaxis-false.json'));
        gd = createGraphDiv();

        // only show one bar trace
        fig.data = [fig.data[0]];

        // add a non-bar trace to make sure its module layer gets clipped
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

        function _assert(layerClips, barDisplays, barTextDisplays, barClips) {
            var subplotLayer = d3.select('.plot');
            var barLayer = subplotLayer.select('.barlayer');

            _assertClip(subplotLayer, layerClips[0], 1, 'subplot layer');
            _assertClip(subplotLayer.select('.contourlayer'), layerClips[1], 1, 'some other trace layer');
            _assertClip(barLayer, layerClips[2], 1, 'bar layer');

            assertNodeDisplay(
                barLayer.selectAll('.point'),
                barDisplays,
                'bar points (never hidden by display attr)'
            );
            assertNodeDisplay(
                barLayer.selectAll('.bartext'),
                barTextDisplays,
                'bar text'
            );

            assertClip(
                barLayer.selectAll('.point > path'),
                barClips[0], barClips[1],
                'bar clips'
            );
        }

        Plotly.newPlot(gd, fig).then(function() {
            _assert(
                [false, true, false],
                [null, null, null],
                [null, null, 'none'],
                [true, 3]
            );
            return Plotly.restyle(gd, 'visible', false);
        })
        .then(function() {
            _assert(
                [true, null, null],
                [],
                [],
                [false, 0]
            );
            return Plotly.restyle(gd, {visible: true, cliponaxis: null});
        })
        .then(function() {
            _assert(
                [true, false, false],
                [null, null, null],
                [null, null, null],
                [false, 3]
            );
            return Plotly.restyle(gd, 'cliponaxis', false);
        })
        .then(function() {
            _assert(
                [false, true, false],
                [null, null, null],
                [null, null, 'none'],
                [true, 3]
            );
            return Plotly.relayout(gd, 'yaxis.range', [0, 1]);
        })
        .then(function() {
            _assert(
                [false, true, false],
                [null, null, null],
                ['none', 'none', 'none'],
                [true, 3]
            );
            return Plotly.relayout(gd, 'yaxis.range', [0, 4]);
        })
        .then(function() {
            _assert(
                [false, true, false],
                [null, null, null],
                [null, null, null],
                [true, 3]
            );
        })
        .catch(failTest)
        .then(done);
    });
});

function mockBarPlot(dataWithoutTraceType, layout) {
    var traceTemplate = { type: 'bar' };

    var dataWithTraceType = dataWithoutTraceType.map(function(trace) {
        return Lib.extendFlat({}, traceTemplate, trace);
    });

    var gd = {
        data: dataWithTraceType,
        layout: layout || {},
        calcdata: [],
        _context: {locale: 'en', locales: {}}
    };

    supplyAllDefaults(gd);
    Plots.doCalcdata(gd);

    return gd;
}

function assertArrayField(calcData, prop, expectation) {
    var values = Lib.nestedProperty(calcData, prop).get();
    if(!Array.isArray(values)) values = [values];

    expect(values).toBeCloseToArray(expectation, undefined, '(field ' + prop + ')');
}

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

function assertTraceField(calcData, prop, expectation) {
    var values = calcData.map(function(calcTrace) {
        return Lib.nestedProperty(calcTrace[0], prop).get();
    });

    expect(values).toBeCloseToArray(expectation, undefined, '(field ' + prop + ')');
}
