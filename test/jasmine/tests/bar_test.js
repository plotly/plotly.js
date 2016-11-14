var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');

var PlotlyInternal = require('@src/plotly');
var Axes = PlotlyInternal.Axes;

var Bar = require('@src/traces/bar');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customMatchers = require('../assets/custom_matchers');

describe('bar supplyDefaults', function() {
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
        supplyDefaults(traceIn, traceOut, defaultColor);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            x: [],
            y: []
        };
        supplyDefaults(traceIn, traceOut, defaultColor);
        expect(traceOut.visible).toBe(false);
    });

    it('should set visible to false when x or y is empty', function() {
        traceIn = {
            x: []
        };
        supplyDefaults(traceIn, traceOut, defaultColor);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            x: [],
            y: [1, 2, 3]
        };
        supplyDefaults(traceIn, traceOut, defaultColor);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            y: []
        };
        supplyDefaults(traceIn, traceOut, defaultColor);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            x: [1, 2, 3],
            y: []
        };
        supplyDefaults(traceIn, traceOut, defaultColor);
        expect(traceOut.visible).toBe(false);
    });

    it('should not set base, offset or width', function() {
        traceIn = {
            y: [1, 2, 3]
        };
        supplyDefaults(traceIn, traceOut, defaultColor);
        expect(traceOut.base).toBeUndefined();
        expect(traceOut.offset).toBeUndefined();
        expect(traceOut.width).toBeUndefined();
    });

    it('should coerce a non-negative width', function() {
        traceIn = {
            width: -1,
            y: [1, 2, 3]
        };
        supplyDefaults(traceIn, traceOut, defaultColor);
        expect(traceOut.width).toBeUndefined();
    });
});

describe('heatmap calc / setPositions', function() {
    'use strict';

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

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

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

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
});

describe('Bar.setPositions', function() {
    'use strict';

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

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
        expect(Axes.getAutoRange(xa)).toBeCloseToArray([-5, 14], undefined, '(xa.range)');
        expect(Axes.getAutoRange(ya)).toBeCloseToArray([-3.33, 3.33], undefined, '(ya.range)');
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
        expect(Axes.getAutoRange(xa)).toBeCloseToArray([-0.5, 2.5], undefined, '(xa.range)');
        expect(Axes.getAutoRange(ya)).toBeCloseToArray([-11.11, 11.11], undefined, '(ya.range)');
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
        expect(Axes.getAutoRange(xa)).toBeCloseToArray([-0.5, 2.5], undefined, '(xa.range)');
        expect(Axes.getAutoRange(ya)).toBeCloseToArray([-4.44, 4.44], undefined, '(ya.range)');
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
        expect(Axes.getAutoRange(xa)).toBeCloseToArray([-0.5, 2.5], undefined, '(xa.range)');
        expect(Axes.getAutoRange(ya)).toBeCloseToArray([-1.11, 1.11], undefined, '(ya.range)');
    });
});

describe('A bar plot', function() {
    'use strict';

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    afterEach(destroyGraphDiv);

    it('should be able to restyle', function(done) {
        var gd = createGraphDiv(),
            mock = Lib.extendDeep({}, require('@mocks/bar_attrs_relative'));

        Plotly.plot(gd, mock.data, mock.layout).then(function() {
            var cd = gd.calcdata;
            assertPointField(cd, 'x', [
                [1, 2, 3, 4], [1, 2, 3, 4],
                [1, 2, 3, 4], [1, 2, 3, 4]]);
            assertPointField(cd, 'y', [
                [1, 2, 3, 4], [4, 4, 4, 4],
                [-1, -3, -2, -4], [4, -4, -5, -6]]);
            assertPointField(cd, 'b', [
                [0, 0, 0, 0], [1, 2, 3, 4],
                [0, 0, 0, 0], [4, -3, -2, -4]]);
            assertPointField(cd, 's', [
                [1, 2, 3, 4], [3, 2, 1, 0],
                [-1, -3, -2, -4], [0, -1, -3, -2]]);
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
                [-1, -3, -2, -4], [4, -4, -5, -6]]);
            assertPointField(cd, 'b', [
                [0, 0, 0, 0], [1, 2, 3, 4],
                [0, 0, 0, 0], [4, -3, -2, -4]]);
            assertPointField(cd, 's', [
                [1, 2, 3, 4], [3, 2, 1, 0],
                [-1, -3, -2, -4], [0, -1, -3, -2]]);
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

            done();
        });
    });
});

describe('bar hover', function() {
    'use strict';

    var gd;

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

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
            ya: subplot.yaxis
        };
    }

    function _hover(gd, xval, yval, closest) {
        var pointData = getPointData(gd);
        var pt = Bar.hoverPoints(pointData, xval, yval, closest)[0];

        return {
            style: [pt.index, pt.color, pt.xLabelVal, pt.yLabelVal],
            pos: [pt.x0, pt.x1, pt.y0, pt.y1]
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

            Plotly.plot(gd, mock.data, mock.layout).then(done);
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

            Plotly.plot(gd, mock.data, mock.layout).then(done);
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

});

function mockBarPlot(dataWithoutTraceType, layout) {
    var traceTemplate = { type: 'bar' };

    var dataWithTraceType = dataWithoutTraceType.map(function(trace) {
        return Lib.extendFlat({}, traceTemplate, trace);
    });

    var gd = {
        data: dataWithTraceType,
        layout: layout,
        calcdata: []
    };

    // call Bar.supplyDefaults
    Plots.supplyDefaults(gd);

    // call Bar.calc
    gd._fullData.forEach(function(fullTrace) {
        var cd = Bar.calc(gd, fullTrace);

        cd[0].t = {};
        cd[0].trace = fullTrace;

        gd.calcdata.push(cd);
    });

    var plotinfo = {
        xaxis: gd._fullLayout.xaxis,
        yaxis: gd._fullLayout.yaxis
    };

    // call Bar.setPositions
    Bar.setPositions(gd, plotinfo);

    return gd;
}

function assertArrayField(calcData, prop, expectation) {
    // Note that this functions requires to add `customMatchers` to jasmine
    // matchers; i.e: `jasmine.addMatchers(customMatchers);`.
    var values = Lib.nestedProperty(calcData, prop).get();
    if(!Array.isArray(values)) values = [values];

    expect(values).toBeCloseToArray(expectation, undefined, '(field ' + prop + ')');
}

function assertPointField(calcData, prop, expectation) {
    // Note that this functions requires to add `customMatchers` to jasmine
    // matchers; i.e: `jasmine.addMatchers(customMatchers);`.
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
    // Note that this functions requires to add `customMatchers` to jasmine
    // matchers; i.e: `jasmine.addMatchers(customMatchers);`.
    var values = calcData.map(function(calcTrace) {
        return Lib.nestedProperty(calcTrace[0], prop).get();
    });

    expect(values).toBeCloseToArray(expectation, undefined, '(field ' + prop + ')');
}
