var Plotly = require('@lib/index');

var Waterfall = require('@src/traces/waterfall');
var Lib = require('@src/lib');
var Plots = require('@src/plots/plots');
var Drawing = require('@src/components/drawing');

var Axes = require('@src/plots/cartesian/axes');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var supplyAllDefaults = require('../assets/supply_defaults');
var color = require('../../../src/components/color');
var rgb = color.rgb;

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;
var Fx = require('@src/components/fx');

var d3 = require('d3');

var WATERFALL_TEXT_SELECTOR = '.bars .bartext';

describe('Waterfall.supplyDefaults', function() {
    'use strict';

    var traceIn,
        traceOut;

    var defaultColor = '#444';

    var supplyDefaults = Waterfall.supplyDefaults;

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

    it('should default textfont to layout.font except for insidetextfont.color', function() {
        traceIn = {
            textposition: 'inside',
            y: [1, 2, 3]
        };
        var layout = {
            font: {family: 'arial', color: '#AAA', size: 13}
        };
        var layoutFontMinusColor = {family: 'arial', size: 13};

        supplyDefaults(traceIn, traceOut, defaultColor, layout);

        expect(traceOut.textposition).toBe('inside');
        expect(traceOut.textfont).toEqual(layout.font);
        expect(traceOut.textfont).not.toBe(layout.font);
        expect(traceOut.insidetextfont).toEqual(layoutFontMinusColor);
        expect(traceOut.insidetextfont).not.toBe(layout.font);
        expect(traceOut.insidetextfont).not.toBe(traceOut.textfont);
        expect(traceOut.outsidetexfont).toBeUndefined();
        expect(traceOut.constraintext).toBe('both');
    });

    it('should not default insidetextfont.color to layout.font.color', function() {
        traceIn = {
            textposition: 'inside',
            y: [1, 2, 3]
        };
        var layout = {
            font: {family: 'arial', color: '#AAA', size: 13}
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);

        expect(traceOut.insidetextfont.family).toBe('arial');
        expect(traceOut.insidetextfont.color).toBeUndefined();
        expect(traceOut.insidetextfont.size).toBe(13);
    });

    it('should default insidetextfont.color to textfont.color', function() {
        traceIn = {
            textposition: 'inside',
            y: [1, 2, 3],
            textfont: {family: 'arial', color: '#09F', size: 20}
        };

        supplyDefaults(traceIn, traceOut, defaultColor, {});

        expect(traceOut.insidetextfont.family).toBe('arial');
        expect(traceOut.insidetextfont.color).toBe('#09F');
        expect(traceOut.insidetextfont.size).toBe(20);
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

describe('waterfall calc / crossTraceCalc', function() {
    'use strict';

    it('should fill in calc pt fields (overlay case)', function() {
        var gd = mockWaterfallPlot([{
            y: [2, 1, 2]
        }, {
            y: [3, 1, null, 2, null],
            measure: ['absolute', 'relative', 'total', 'relative', 'total']
        }], {
            waterfallmode: 'overlay'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'w', [[0.8, 0.8, 0.8], [0.8, 0.8, 0.8, 0.8, 0.8]]);
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2, 3, 4]]);
        assertPointField(cd, 'y', [[2, 3, 5], [3, 4, 4, 6, 6]]);
        assertPointField(cd, 'b', [[0, 0, 0], [0, 0, 0, 0, 0]]);
        assertPointField(cd, 's', [[2, 3, 5], [3, 4, 4, 6, 6]]);
        assertPointField(cd, 'p', [[0, 1, 2], [0, 1, 2, 3, 4]]);
        assertPointField(cd, 'p0', [[-0.4, 0.6, 1.6], [-0.4, 0.6, 1.6, 2.6, 3.6]]);
        assertPointField(cd, 'p1', [[0.4, 1.4, 2.4], [0.4, 1.4, 2.4, 3.4, 4.4]]);
        assertPointField(cd, 's0', [[0, 2, 3], [0, 3, 0, 4, 0]]);
        assertPointField(cd, 's1', [[2, 3, 5], [3, 4, 4, 6, 6]]);
        assertPointField(cd, 'isSum', [[false, false, false], [true, false, true, false, true]]);
        assertPointField(cd, 'rawS', [[2, 1, 2], [3, 1, 0, 2, 0]]);
        assertPointField(cd, 'dir', [['increasing', 'increasing', 'increasing'], ['totals', 'increasing', 'totals', 'increasing', 'totals']]);
        assertPointField(cd, 'hasTotals', [[false, undefined, undefined], [true, undefined, undefined, undefined, undefined]]);
        assertTraceField(cd, 't.barwidth', [0.8, 0.8]);
        assertTraceField(cd, 't.poffset', [-0.4, -0.4]);
        assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8]);
    });

    it('should fill in calc pt fields (group case)', function() {
        var gd = mockWaterfallPlot([{
            y: [2, 1, 2]
        }, {
            y: [3, 1, null, 2, null],
            measure: ['absolute', null, 'total', null, 'total']
        }], {
            waterfallmode: 'group',
            // asumming default waterfallgap is 0.2
            waterfallgroupgap: 0.1
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'w', [[0.36, 0.36, 0.36], [0.36, 0.36, 0.36, 0.36, 0.36]]);
        assertPointField(cd, 'x', [[-0.2, 0.8, 1.8], [0.2, 1.2, 2.2, 3.2, 4.2]]);
        assertPointField(cd, 'y', [[2, 3, 5], [3, 4, 4, 6, 6]]);
        assertPointField(cd, 'b', [[0, 0, 0], [0, 0, 0, 0, 0]]);
        assertPointField(cd, 's', [[2, 3, 5], [3, 4, 4, 6, 6]]);
        assertPointField(cd, 'p', [[0, 1, 2], [0, 1, 2, 3, 4]]);
        assertPointField(cd, 'p0', [[-0.38, 0.62, 1.62], [0.02, 1.02, 2.02, 3.02, 4.02]]);
        assertPointField(cd, 'p1', [[-0.02, 0.98, 1.98], [0.38, 1.38, 2.38, 3.38, 4.38]]);
        assertPointField(cd, 's0', [[0, 2, 3], [0, 3, 0, 4, 0]]);
        assertPointField(cd, 's1', [[2, 3, 5], [3, 4, 4, 6, 6]]);
        assertPointField(cd, 'isSum', [[false, false, false], [true, false, true, false, true]]);
        assertPointField(cd, 'rawS', [[2, 1, 2], [3, 1, 0, 2, 0]]);
        assertPointField(cd, 'dir', [['increasing', 'increasing', 'increasing'], ['totals', 'increasing', 'totals', 'increasing', 'totals']]);
        assertPointField(cd, 'hasTotals', [[false, undefined, undefined], [true, undefined, undefined, undefined, undefined]]);
        assertTraceField(cd, 't.barwidth', [0.36, 0.36]);
        assertTraceField(cd, 't.poffset', [-0.38, 0.02]);
        assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8]);
    });
});

describe('Waterfall.calc', function() {
    'use strict';

    it('should not exclude items with non-numeric x from calcdata (vertical case)', function() {
        var gd = mockWaterfallPlot([{
            x: [5, NaN, 15, 20, null, 21],
            orientation: 'v',
        }]);

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[5, NaN, 15, 20, NaN, 21]]);
    });

    it('should not exclude items with non-numeric y from calcdata (horizontal case)', function() {
        var gd = mockWaterfallPlot([{
            orientation: 'h',
            y: [20, NaN, 23, 25, null, 26]
        }]);

        var cd = gd.calcdata;
        assertPointField(cd, 'y', [[20, NaN, 23, 25, NaN, 26]]);
    });

    it('should not exclude items with non-numeric y from calcdata (to plots gaps correctly)', function() {
        var gd = mockWaterfallPlot([{
            x: ['a', 'b', 'c', 'd'],
            y: [1, null, 'nonsense', 15]
        }]);

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[0, 1, 2, 3]]);
        assertPointField(cd, 'y', [[1, 1, 1, 16]]);
    });

    it('should not exclude items with non-numeric x from calcdata (to plots gaps correctly)', function() {
        var gd = mockWaterfallPlot([{
            x: [1, null, 'nonsense', 15],
            y: [1, 2, 10, 30]
        }]);

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[1, NaN, NaN, 15]]);
        assertPointField(cd, 'y', [[1, 3, 13, 43]]);
    });
});

describe('Waterfall.crossTraceCalc', function() {
    'use strict';

    it('should guard against invalid offset items', function() {
        var gd = mockWaterfallPlot([{
            offset: [null, 0, 1],
            y: [1, 2, 3]
        }, {
            offset: [null, 1],
            y: [1, 2, 3]
        }, {
            offset: null,
            y: [1]
        }], {
            waterfallgap: 0.2,
            waterfallmode: 'overlay'
        });

        var cd = gd.calcdata;
        assertArrayField(cd[0][0], 't.poffset', [-0.4, 0, 1]);
        assertArrayField(cd[1][0], 't.poffset', [-0.4, 1, -0.4]);
        assertArrayField(cd[2][0], 't.poffset', [-0.4]);
    });

    it('should work with *width* typed arrays', function() {
        var w = [0.1, 0.4, 0.7];

        var gd = mockWaterfallPlot([{
            width: w,
            y: [1, 2, 3]
        }, {
            width: new Float32Array(w),
            y: [1, 2, 3]
        }]);

        var cd = gd.calcdata;
        assertArrayField(cd[0][0], 't.barwidth', w);
        assertArrayField(cd[1][0], 't.barwidth', w);
        assertPointField(cd, 'x', [
            [-0.2, 0.8, 1.8],
            [0.2, 1.2, 2.2]
        ]);
    });

    it('should work with *offset* typed arrays', function() {
        var o = [0.1, 0.4, 0.7];

        var gd = mockWaterfallPlot([{
            offset: o,
            y: [1, 2, 3]
        }, {
            offset: new Float32Array(o),
            y: [1, 2, 3]
        }]);

        var cd = gd.calcdata;
        assertArrayField(cd[0][0], 't.poffset', o);
        assertArrayField(cd[1][0], 't.poffset', o);
        assertPointField(cd, 'x', [
            [0.5, 1.8, 3.1],
            [0.5, 1.8, 3.099]
        ]);
    });

    it('should guard against invalid width items', function() {
        var gd = mockWaterfallPlot([{
            width: [null, 1, 0.8],
            y: [1, 2, 3]
        }, {
            width: [null, 1],
            y: [1, 2, 3]
        }, {
            width: null,
            y: [1]
        }], {
            waterfallgap: 0.2,
            waterfallmode: 'overlay'
        });

        var cd = gd.calcdata;
        assertArrayField(cd[0][0], 't.barwidth', [0.8, 1, 0.8]);
        assertArrayField(cd[1][0], 't.barwidth', [0.8, 1, 0.8]);
        assertArrayField(cd[2][0], 't.barwidth', [0.8]);
    });

    it('should guard against invalid width items (group case)', function() {
        var gd = mockWaterfallPlot([{
            width: [null, 0.1, 0.2],
            y: [1, 2, 3]
        }, {
            width: [null, 0.1],
            y: [1, 2, 3]
        }, {
            width: null,
            y: [1]
        }], {
            waterfallgap: 0,
            waterfallmode: 'group'
        });

        var cd = gd.calcdata;
        assertArrayField(cd[0][0], 't.barwidth', [0.33, 0.1, 0.2]);
        assertArrayField(cd[1][0], 't.barwidth', [0.33, 0.1, 0.33]);
        assertArrayField(cd[2][0], 't.barwidth', [0.33]);
    });

    it('should not group traces that set offset', function() {
        var gd = mockWaterfallPlot([{
            y: [1, 2, 3]
        }, {
            y: [10, 20, 30]
        }, {
            offset: -1,
            y: [-1, -2, -3]
        }], {
            waterfallgap: 0,
            waterfallmode: 'group'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
        assertPointField(cd, 's', [[1, 3, 6], [10, 30, 60], [-1, -3, -6]]);
        assertPointField(cd, 'x', [[-0.25, 0.75, 1.75], [0.25, 1.25, 2.25], [-0.5, 0.5, 1.5]]);
        assertPointField(cd, 'y', [[1, 3, 6], [10, 30, 60], [-1, -3, -6]]);
    });

    it('should draw traces separately in overlay mode', function() {
        var gd = mockWaterfallPlot([{
            y: [1, 2, 3]
        }, {
            y: [10, 20, 30]
        }], {
            waterfallgap: 0,
            waterfallmode: 'overlay'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[0, 0, 0], [0, 0, 0]]);
        assertPointField(cd, 's', [[1, 3, 6], [10, 30, 60]]);
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'y', [[1, 3, 6], [10, 30, 60]]);
    });

    it('should expand position axis', function() {
        var gd = mockWaterfallPlot([{
            offset: 10,
            width: 2,
            y: [1.5, 1, 0.5]
        }, {
            offset: -5,
            width: 2,
            y: [-0.5, -1, -1.5]
        }], {
            waterfallgap: 0,
            waterfallmode: 'overlay'
        });

        var xa = gd._fullLayout.xaxis;
        var ya = gd._fullLayout.yaxis;
        expect(Axes.getAutoRange(gd, xa)).toBeCloseToArray([-5, 14], undefined, '(xa.range)');
        expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([-3.33, 3.33], undefined, '(ya.range)');
    });

    it('should expand size axis (overlay case)', function() {
        var gd = mockWaterfallPlot([{
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
            waterfallgap: 0,
            waterfallmode: 'overlay'
        });

        var xa = gd._fullLayout.xaxis;
        var ya = gd._fullLayout.yaxis;
        expect(Axes.getAutoRange(gd, xa)).toBeCloseToArray([-0.5, 2.5], undefined, '(xa.range)');
        expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([-14.44, 14.44], undefined, '(ya.range)');
    });

    it('should include explicit base in size axis range', function() {
        var waterfallmodes = ['group', 'overlay'];
        waterfallmodes.forEach(function(waterfallmode) {
            var gd = mockWaterfallPlot([
                {y: [3, 4, -5], base: 10}
            ], {
                waterfallmode: waterfallmode
            });

            var ya = gd._fullLayout.yaxis;
            expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([9.611, 17.388]);
        });
    });

    it('works with log axes (grouped waterfalls)', function() {
        var gd = mockWaterfallPlot([
            {y: [1, 10, 1e10, -1]},
            {y: [2, 20, 2e10, -2]}
        ], {
            yaxis: {type: 'log'},
            waterfallmode: 'group'
        });

        var ya = gd._fullLayout.yaxis;
        expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([-0.572, 10.873], undefined, '(ya.range)');
    });

    it('should ignore *base* on category axes', function() {
        var gd = mockWaterfallPlot([
            {x: ['a', 'b', 'c'], base: 10},
        ]);

        expect(gd._fullLayout.xaxis.type).toBe('category');
        assertPointField(gd.calcdata, 'b', [[0, 0, 0]]);
    });

    it('should ignore *base* on multicategory axes', function() {
        var gd = mockWaterfallPlot([
            {x: [['a', 'a', 'b', 'b'], ['1', '2', '1', '2']], base: 10}
        ]);

        expect(gd._fullLayout.xaxis.type).toBe('multicategory');
        assertPointField(gd.calcdata, 'b', [[0, 0, 0, 0]]);
    });
});

describe('A waterfall plot', function() {
    'use strict';

    var DARK = '#444';
    var LIGHT = '#fff';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function getAllTraceNodes(node) {
        return node.querySelectorAll('g.points');
    }

    function getAllWaterfallNodes(node) {
        return node.querySelectorAll('g.point');
    }

    function assertTextIsInsidePath(textNode, pathNode) {
        var textBB = textNode.getBoundingClientRect();
        var pathBB = pathNode.getBoundingClientRect();

        expect(pathBB.left).not.toBeGreaterThan(textBB.left);
        expect(textBB.right).not.toBeGreaterThan(pathBB.right);
        expect(pathBB.top).not.toBeGreaterThan(textBB.top);
        expect(textBB.bottom).not.toBeGreaterThan(pathBB.bottom);
    }

    function assertTextIsAbovePath(textNode, pathNode) {
        var textBB = textNode.getBoundingClientRect();
        var pathBB = pathNode.getBoundingClientRect();

        expect(textBB.bottom).not.toBeGreaterThan(pathBB.top);
    }

    function assertTextIsBelowPath(textNode, pathNode) {
        var textBB = textNode.getBoundingClientRect();
        var pathBB = pathNode.getBoundingClientRect();

        expect(pathBB.bottom).not.toBeGreaterThan(textBB.top);
    }

    function assertTextIsAfterPath(textNode, pathNode) {
        var textBB = textNode.getBoundingClientRect();
        var pathBB = pathNode.getBoundingClientRect();

        expect(pathBB.right).not.toBeGreaterThan(textBB.left);
    }

    function assertTextFont(textNode, expectedFontProps, index) {
        expect(textNode.style.fontFamily).toBe(expectedFontProps.family[index]);
        expect(textNode.style.fontSize).toBe(expectedFontProps.size[index] + 'px');

        var actualColorRGB = textNode.style.fill;
        var expectedColorRGB = rgb(expectedFontProps.color[index]);
        expect(actualColorRGB).toBe(expectedColorRGB);
    }

    function assertTextIsBeforePath(textNode, pathNode) {
        var textBB = textNode.getBoundingClientRect();
        var pathBB = pathNode.getBoundingClientRect();

        expect(textBB.right).not.toBeGreaterThan(pathBB.left);
    }

    function assertTextFontColors(expFontColors, label) {
        return function() {
            var selection = d3.selectAll(WATERFALL_TEXT_SELECTOR);
            expect(selection.size()).toBe(expFontColors.length);

            selection.each(function(d, i) {
                var expFontColor = expFontColors[i];
                var isArray = Array.isArray(expFontColor);

                expect(this.style.fill).toBe(isArray ? rgb(expFontColor[0]) : rgb(expFontColor),
                  (label || '') + ', fill for element ' + i);
                expect(this.style.fillOpacity).toBe(isArray ? expFontColor[1] : '1',
                  (label || '') + ', fillOpacity for element ' + i);
            });
        };
    }

    it('should show texts (inside case)', function(done) {
        var data = [{
            y: [10, 20, 30],
            type: 'waterfall',
            text: ['1', 'Very very very very very long text'],
            textposition: 'inside',
        }];
        var layout = {};

        Plotly.plot(gd, data, layout).then(function() {
            var traceNodes = getAllTraceNodes(gd);
            var waterfallNodes = getAllWaterfallNodes(traceNodes[0]);
            var foundTextNodes;

            for(var i = 0; i < waterfallNodes.length; i++) {
                var waterfallNode = waterfallNodes[i];
                var pathNode = waterfallNode.querySelector('path');
                var textNode = waterfallNode.querySelector('text');
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

    it('should show texts (horizontal case)', function(done) {
        var data = [{
            x: [10, -20, 30],
            type: 'waterfall',
            text: ['Very very very very very long text', -20],
            textposition: 'outside',
        }];
        var layout = {};

        Plotly.plot(gd, data, layout).then(function() {
            var traceNodes = getAllTraceNodes(gd);
            var waterfallNodes = getAllWaterfallNodes(traceNodes[0]);
            var foundTextNodes;

            for(var i = 0; i < waterfallNodes.length; i++) {
                var waterfallNode = waterfallNodes[i];
                var pathNode = waterfallNode.querySelector('path');
                var textNode = waterfallNode.querySelector('text');
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

    var insideTextTestsTrace = {
        x: ['giraffes', 'orangutans', 'monkeys', 'elefants', 'spiders', 'snakes'],
        y: [20, 14, 23, 10, 59, 15],
        text: [20, 14, 23, 10, 59, 15],
        type: 'waterfall',
        textposition: 'auto',
        marker: {
            color: ['#ee1', '#eee', '#333', '#9467bd', '#dda', '#922'],
        }
    };

    it('should take fill opacities into account when calculating contrasting inside text colors', function(done) {
        var trace = {
            x: [5, 10],
            y: [5, -15],
            text: ['Giraffes', 'Zebras'],
            type: 'waterfall',
            textposition: 'inside',
            increasing: { marker: { color: 'rgba(0, 0, 0, 0.2)' } },
            decreasing: { marker: { color: 'rgba(0, 0, 0, 0.8)' } }
        };

        Plotly.plot(gd, [trace])
          .then(assertTextFontColors([DARK, LIGHT]))
          .catch(failTest)
          .then(done);
    });

    it('should use defined textfont.color for inside text instead of the contrasting default', function(done) {
        var data = Lib.extendFlat({}, insideTextTestsTrace, { textfont: { color: '#09f' } });

        Plotly.plot(gd, [data])
          .then(assertTextFontColors(Lib.repeat('#09f', 6)))
          .catch(failTest)
          .then(done);
    });

    it('should be able to restyle', function(done) {
        var mock = {
            data: [
                {
                    width: [1, 0.8, 0.6, 0.4],
                    text: [1, 2, 3333333333, 4],
                    textposition: 'outside',
                    y: [1, 2, 3, 4],
                    x: [1, 2, 3, 4],
                    type: 'waterfall'
                }, {
                    width: [0.4, 0.6, 0.8, 1],
                    text: ['Three', 2, 'inside text', 0],
                    textposition: 'auto',
                    textfont: { size: [10] },
                    y: [3, 2, 1, 0],
                    x: [1, 2, 3, 4],
                    type: 'waterfall'
                }, {
                    width: 1,
                    text: [-1, -3, -2, -4],
                    textposition: 'inside',
                    y: [-1, -3, -2, -4],
                    x: [1, 2, 3, 4],
                    type: 'waterfall'
                }, {
                    text: [0, 'outside text', -3, -2],
                    textposition: 'auto',
                    y: [0, -0.25, -3, -2],
                    x: [1, 2, 3, 4],
                    type: 'waterfall'
                }
            ],
            layout: {
                xaxis: { showgrid: true },
                yaxis: { range: [-6, 6] },
                height: 400,
                width: 400,
                waterfallmode: 'overlay'
            }
        };

        Plotly.plot(gd, mock.data, mock.layout).then(function() {
            var cd = gd.calcdata;
            assertPointField(cd, 'x', [
                [1, 2, 3, 4], [1, 2, 3, 4],
                [1, 2, 3, 4], [1, 2, 3, 4]]);
            assertPointField(cd, 'y', [
                [1, 3, 6, 10], [3, 5, 6, 6],
                [-1, -4, -6, -10], [0, -0.25, -3.25, -5.25]]);
            assertPointField(cd, 's', [
                [1, 3, 6, 10], [3, 5, 6, 6],
                [-1, -4, -6, -10], [0, -0.25, -3.25, -5.25]]);
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
                [1, 3, 6, 10], [3, 5, 6, 6],
                [-1, -4, -6, -10], [0, -0.25, -3.25, -5.25]]);
            assertPointField(cd, 's', [
                [1, 3, 6, 10], [3, 5, 6, 6],
                [-1, -4, -6, -10], [0, -0.25, -3.25, -5.25] ]);
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

            var traceNodes = getAllTraceNodes(gd);
            var trace0Waterfall3 = getAllWaterfallNodes(traceNodes[0])[3];
            var path03 = trace0Waterfall3.querySelector('path');
            var text03 = trace0Waterfall3.querySelector('text');
            var trace1Waterfall2 = getAllWaterfallNodes(traceNodes[1])[2];
            var path12 = trace1Waterfall2.querySelector('path');
            var text12 = trace1Waterfall2.querySelector('text');
            var trace2Waterfall0 = getAllWaterfallNodes(traceNodes[2])[0];
            var path20 = trace2Waterfall0.querySelector('path');
            var text20 = trace2Waterfall0.querySelector('text');
            var trace3Waterfall0 = getAllWaterfallNodes(traceNodes[3])[0];
            var path30 = trace3Waterfall0.querySelector('path');
            var text30 = trace3Waterfall0.querySelector('text');

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
                [1, 3, 6, 10], [3, 5, 6, 6],
                [-1, -4, -6, -10], [0, -0.25, -3.25, -5.25]]);
            assertPointField(cd, 's', [
                [1, 3, 6, 10], [3, 5, 6, 6],
                [-1, -4, -6, -10], [0, -0.25, -3.25, -5.25]]);
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

            var traceNodes = getAllTraceNodes(gd);
            var trace0Waterfall3 = getAllWaterfallNodes(traceNodes[0])[3];
            var path03 = trace0Waterfall3.querySelector('path');
            var text03 = trace0Waterfall3.querySelector('text');
            var trace1Waterfall2 = getAllWaterfallNodes(traceNodes[1])[2];
            var path12 = trace1Waterfall2.querySelector('path');
            var text12 = trace1Waterfall2.querySelector('text');
            var trace2Waterfall0 = getAllWaterfallNodes(traceNodes[2])[0];
            var path20 = trace2Waterfall0.querySelector('path');
            var text20 = trace2Waterfall0.querySelector('text');
            var trace3Waterfall0 = getAllWaterfallNodes(traceNodes[3])[0];
            var path30 = trace3Waterfall0.querySelector('path');
            var text30 = trace3Waterfall0.querySelector('text');

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

    it('should be able to add/remove connector nodes on restyle', function(done) {
        function _assertNumberOfWaterfallConnectorNodes(cnt) {
            var sel = d3.select(gd).select('.waterfalllayer').selectAll('.line');
            expect(sel.size()).toBe(cnt);
        }

        Plotly.plot(gd, [{
            type: 'waterfall',
            x: ['Initial', 'A', 'B', 'C', 'Total'],
            y: [10, 2, 3, 5],
            measure: ['absolute', 'relative', 'relative', 'relative', 'total'],
            connector: { visible: false }
        }])
        .then(function() {
            _assertNumberOfWaterfallConnectorNodes(0);
            return Plotly.restyle(gd, 'connector.visible', true);
        })
        .then(function() {
            _assertNumberOfWaterfallConnectorNodes(4);
            return Plotly.restyle(gd, 'connector.visible', false);
        })
        .then(function() {
            _assertNumberOfWaterfallConnectorNodes(0);
            return Plotly.restyle(gd, 'connector.visible', true);
        })
        .then(function() {
            _assertNumberOfWaterfallConnectorNodes(4);
        })
        .catch(failTest)
        .then(done);
    });

    it('should coerce text-related attributes', function(done) {
        var data = [{
            y: [10, 20, 30, 40],
            type: 'waterfall',
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

        // Note: insidetextfont.color does NOT inherit from textfont.color
        // since insidetextfont.color should be contrasting to bar's fill by default.
        var contrastingLightColorVal = color.contrast('black');
        var expected = {
            y: [10, 20, 30, 40],
            type: 'waterfall',
            text: ['T1P1', 'T1P2', '13', '14'],
            textposition: ['inside', 'outside', 'none'],
            textfont: {
                family: ['"comic sans"', 'arial'],
                color: ['red', 'green'],
                size: [13, 13]
            },
            insidetextfont: {
                family: ['"comic sans"', 'arial', 'arial'],
                color: ['black', 'green', contrastingLightColorVal],
                size: [8, 12, 16]
            },
            outsidetextfont: {
                family: ['"comic sans"', 'arial', 'arial'],
                color: ['red', 'green', 'blue'],
                size: [13, 24, 32]
            }
        };

        Plotly.plot(gd, data, layout).then(function() {
            var traceNodes = getAllTraceNodes(gd);
            var waterfallNodes = getAllWaterfallNodes(traceNodes[0]);
            var pathNodes = [
                waterfallNodes[0].querySelector('path'),
                waterfallNodes[1].querySelector('path'),
                waterfallNodes[2].querySelector('path'),
                waterfallNodes[3].querySelector('path')
            ];
            var textNodes = [
                waterfallNodes[0].querySelector('text'),
                waterfallNodes[1].querySelector('text'),
                waterfallNodes[2].querySelector('text'),
                waterfallNodes[3].querySelector('text')
            ];
            var i;

            // assert waterfall texts
            for(i = 0; i < 3; i++) {
                expect(textNodes[i].textContent).toBe(expected.text[i]);
            }

            // assert waterfall positions
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

    it('should be able to add/remove text node on restyle', function(done) {
        function _assertNumberOfWaterfallTextNodes(cnt) {
            var sel = d3.select(gd).select('.waterfalllayer').selectAll('text');
            expect(sel.size()).toBe(cnt);
        }

        Plotly.plot(gd, [{
            type: 'waterfall',
            x: ['Product A', 'Product B', 'Product C'],
            y: [20, 14, 23],
            text: [20, 14, 23],
            textposition: 'auto'
        }])
        .then(function() {
            _assertNumberOfWaterfallTextNodes(3);
            return Plotly.restyle(gd, 'textposition', 'none');
        })
        .then(function() {
            _assertNumberOfWaterfallTextNodes(0);
            return Plotly.restyle(gd, 'textposition', 'auto');
        })
        .then(function() {
            _assertNumberOfWaterfallTextNodes(3);
            return Plotly.restyle(gd, 'text', [[null, 0, '']]);
        })
        .then(function() {
            // N.B. that '0' should be there!
            _assertNumberOfWaterfallTextNodes(1);
            return Plotly.restyle(gd, 'text', 'yo!');
        })
        .then(function() {
            _assertNumberOfWaterfallTextNodes(3);
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to react with new text colors', function(done) {
        Plotly.react(gd, [{
            type: 'waterfall',
            y: [1, 2, 3],
            text: ['A', 'B', 'C'],
            textposition: 'inside'
        }])
        .then(assertTextFontColors(['rgb(255, 255, 255)', 'rgb(255, 255, 255)', 'rgb(255, 255, 255)']))
        .then(function() {
            gd.data[0].insidetextfont = {color: 'red'};
            return Plotly.react(gd, gd.data);
        })
        .then(assertTextFontColors(['rgb(255, 0, 0)', 'rgb(255, 0, 0)', 'rgb(255, 0, 0)']))
        .then(function() {
            delete gd.data[0].insidetextfont.color;
            gd.data[0].textfont = {color: 'blue'};
            return Plotly.react(gd, gd.data);
        })
        .then(assertTextFontColors(['rgb(0, 0, 255)', 'rgb(0, 0, 255)', 'rgb(0, 0, 255)']))
        .then(function() {
            gd.data[0].textposition = 'outside';
            return Plotly.react(gd, gd.data);
        })
        .then(assertTextFontColors(['rgb(0, 0, 255)', 'rgb(0, 0, 255)', 'rgb(0, 0, 255)']))
        .then(function() {
            gd.data[0].outsidetextfont = {color: 'red'};
            return Plotly.react(gd, gd.data);
        })
        .then(assertTextFontColors(['rgb(255, 0, 0)', 'rgb(255, 0, 0)', 'rgb(255, 0, 0)']))
        .catch(failTest)
        .then(done);
    });
});

describe('waterfall visibility toggling:', function() {
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
            {type: 'waterfall', x: [1, 2, 3], y: [0.5, 1, 0.5]},
            {type: 'waterfall', x: [1, 2, 3], y: [-0.5, -1, -0.5]}
        ])
        .then(function() {
            spyOn(gd._fullData[0]._module, 'crossTraceCalc').and.callThrough();

            _assert('base', [0.5, 3.5], [-2.222, 2.222], 0);
            expect(gd._fullLayout.legend.traceorder).toBe('normal');
            return Plotly.restyle(gd, 'visible', false, [1]);
        })
        .then(function() {
            _assert('visible [true,false]', [0.5, 3.5], [0, 2.105], 1);
            return Plotly.restyle(gd, 'visible', false, [0]);
        })
        .then(function() {
            _assert('both invisible', [0.5, 3.5], [0, 2.105], 0);
            return Plotly.restyle(gd, 'visible', 'legendonly');
        })
        .then(function() {
            _assert('both legendonly', [0.5, 3.5], [0, 2.105], 0);
            expect(gd._fullLayout.legend.traceorder).toBe('normal');
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
});

describe('waterfall hover', function() {
    'use strict';

    var gd;

    afterEach(destroyGraphDiv);

    function getPointData(gd) {
        var cd = gd.calcdata;
        var subplot = gd._fullLayout._plots.xy;

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
        var pts = Waterfall.hoverPoints(pointData, xval, yval, hovermode);
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

            var mock = Lib.extendDeep({}, require('@mocks/waterfall_11.json'));

            Plotly.plot(gd, mock.data, mock.layout)
            .catch(failTest)
            .then(done);
        });

        it('should return the correct hover point data (case x)', function() {
            var out = _hover(gd, 0, 0, 'x');

            expect(out.style).toEqual([0, '#3D9970', 0, 13.23]);
            assertPos(out.pos, [11.87, 106.8, 52.71, 52.71]);
        });

        it('should return the correct hover point data (case closest)', function() {
            var out = _hover(gd, -0.2, 12, 'closest');

            expect(out.style).toEqual([0, '#3D9970', 0, 13.23]);
            assertPos(out.pos, [11.87, 59.33, 52.71, 52.71]);
        });
    });

    describe('text labels', function() {

        it('should show \'hovertext\' items when present, \'text\' if not', function(done) {
            gd = createGraphDiv();

            var mock = Lib.extendDeep({}, require('@mocks/text_chart_arrays'));
            mock.data.forEach(function(t) { t.type = 'waterfall'; });

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

        it('should use hovertemplate if specified', function(done) {
            gd = createGraphDiv();

            var mock = Lib.extendDeep({}, require('@mocks/text_chart_arrays'));
            mock.data.forEach(function(t) {
                t.type = 'waterfall';
                t.hovertemplate = '%{y}<extra></extra>';
            });

            function _hover() {
                var evt = { xpx: 125, ypx: 150 };
                Fx.hover('graph', evt, 'xy');
            }

            Plotly.plot(gd, mock)
            .then(_hover)
            .then(function() {
                assertHoverLabelContent({
                    nums: ['1', '2', '1.5'],
                    name: ['', '', ''],
                    axis: '0'
                });
                // return Plotly.restyle(gd, 'text', ['APPLE', 'BANANA', 'ORANGE']);
            })
            .catch(failTest)
            .then(done);
        });
    });

    describe('with special width/offset combinations', function() {

        beforeEach(function() {
            gd = createGraphDiv();
        });

        it('should return correct hover data (single waterfall, trace width)', function(done) {
            Plotly.plot(gd, [{
                type: 'waterfall',
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

                    expect(out.style).toEqual([0, '#3D9970', 1, 2], hoverSpec);
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

        it('should return correct hover data (two waterfalls, array width)', function(done) {
            Plotly.plot(gd, [{
                type: 'waterfall',
                x: [1, 200],
                y: [2, 1],
                width: [10, 20],
                marker: { color: 'red' }
            }, {
                type: 'waterfall',
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

                expect(out.style).toEqual([0, '#3D9970', 1, 2]);
                assertPos(out.pos, [99, 106, 117.33, 117.33]);

                out = _hover(gd, 164, 0.8, 'closest');

                expect(out.style).toEqual([1, '#3D9970', 200, 3]);
                assertPos(out.pos, [222, 235, 16, 16]);

                out = _hover(gd, 125, 0.8, 'x');

                expect(out.style).toEqual([1, '#3D9970', 200, 3]);
                assertPos(out.pos, [222, 280, 16, 16]);
            })
            .catch(failTest)
            .then(done);
        });

        it('positions labels correctly w.r.t. narrow waterfalls', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 10, 20],
                y: [1, 3, 2],
                type: 'waterfall',
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
                assertPos(out.pos, [145, 155, 110, 110]);

                // in closest mode you must be over the bar though
                out = _hover(gd, 14, 2, 'closest');
                expect(out).toBe(false);

                // now for a single waterfall trace, closest and compare modes give the same
                // positioning of hover labels
                out = _hover(gd, 10, 2, 'closest');
                assertPos(out.pos, [145, 155, 110, 110]);
            })
            .catch(failTest)
            .then(done);
        });
    });
});

function mockWaterfallPlot(dataWithoutTraceType, layout) {
    var traceTemplate = { type: 'waterfall' };

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
