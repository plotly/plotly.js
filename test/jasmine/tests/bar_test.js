var Plotly = require('@lib/index');

var Bar = require('@src/traces/bar');
var Lib = require('@src/lib');
var Plots = require('@src/plots/plots');

var PlotlyInternal = require('@src/plotly');
var Axes = PlotlyInternal.Axes;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var customMatchers = require('../assets/custom_matchers');

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

describe('bar calc / setPositions', function() {
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

    it('should skip placeholder trace in position computations', function() {
        var gd = mockBarPlot([{
            x: [1, 2, 3],
            y: [2, 1, 2]
        }, {
            x: [null],
            y: [null]
        }]);

        expect(gd.calcdata[0][0].t.barwidth).toEqual(0.8);

        expect(gd.calcdata[1][0].x).toBe(false);
        expect(gd.calcdata[1][0].y).toBe(false);
        expect(gd.calcdata[1][0].placeholder).toBe(true);
        expect(gd.calcdata[1][0].t.barwidth).toBeUndefined();
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
        expect(Axes.getAutoRange(ya)).toBeCloseToArray([-0.572, 10.873], undefined, '(ya.range)');
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
        expect(Axes.getAutoRange(ya)).toBeCloseToArray([-0.582, 11.059], undefined, '(ya.range)');
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
        expect(Axes.getAutoRange(ya)).toBeCloseToArray([1.496, 2.027], undefined, '(ya.range)');
    });
});

describe('A bar plot', function() {
    'use strict';

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
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
        var gd = createGraphDiv(),
            data = [{
                y: [10, 20, 30],
                type: 'bar',
                text: ['1', 'Very very very very very long bar text'],
                textposition: 'inside',
            }],
            layout = {
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
                    assertTextIsInsidePath(textNode, pathNode);
                }
            }

            expect(foundTextNodes).toBe(true);

            done();
        });
    });

    it('should show bar texts (outside case)', function(done) {
        var gd = createGraphDiv(),
            data = [{
                y: [10, -20, 30],
                type: 'bar',
                text: ['1', 'Very very very very very long bar text'],
                textposition: 'outside',
            }],
            layout = {
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

            done();
        });
    });

    it('should show bar texts (horizontal case)', function(done) {
        var gd = createGraphDiv(),
            data = [{
                x: [10, -20, 30],
                type: 'bar',
                text: ['Very very very very very long bar text', -20],
                textposition: 'outside',
            }],
            layout = {
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

            done();
        });
    });

    it('should show bar texts (barnorm case)', function(done) {
        var gd = createGraphDiv(),
            data = [{
                x: [100, -100, 100],
                type: 'bar',
                text: [100, -100, 100],
                textposition: 'outside',
            }],
            layout = {
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

            done();
        });
    });

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

            done();
        });
    });

    it('should coerce text-related attributes', function(done) {
        var gd = createGraphDiv(),
            data = [{
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
            }],
            layout = {
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

    Plots.supplyDefaults(gd);
    Plots.doCalcdata(gd);

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
