var Plotly = require('../../../lib/index');

var Funnel = require('../../../src/traces/funnel');
var Lib = require('../../../src/lib');
var Plots = require('../../../src/plots/plots');
var Drawing = require('../../../src/components/drawing');

var Axes = require('../../../src/plots/cartesian/axes');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var supplyAllDefaults = require('../assets/supply_defaults');
var color = require('../../../src/components/color');
var rgb = color.rgb;

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;
var checkTextTemplate = require('../assets/check_texttemplate');
var checkTransition = require('../assets/check_transitions');
var Fx = require('../../../src/components/fx');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;

var FUNNEL_TEXT_SELECTOR = '.bars .bartext';

describe('Funnel.supplyDefaults', function() {
    'use strict';

    var traceIn,
        traceOut;

    var defaultColor = '#444';

    var supplyDefaults = Funnel.supplyDefaults;

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

    it('should coerce textposition to auto', function() {
        traceIn = {
            y: [1, 2, 3]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, {});
        expect(traceOut.textposition).toBe('auto');
        expect(traceOut.texfont).toBeUndefined();
        expect(traceOut.insidetexfont).toBeUndefined();
        expect(traceOut.outsidetexfont).toBeUndefined();
        expect(traceOut.constraintext).toBe('both'); // TODO: is this expected for funnel?
    });

    it('should not coerce textinfo when textposition is none', function() {
        traceIn = {
            y: [1, 2, 3],
            textposition: 'none',
            textinfo: 'text'
        };
        supplyDefaults(traceIn, traceOut, defaultColor, {});
        expect(traceOut.textinfo).toBeUndefined();
    });

    it('should coerce textinfo when textposition is not none', function() {
        traceIn = {
            y: [1, 2, 3],
            textinfo: 'text'
        };
        supplyDefaults(traceIn, traceOut, defaultColor, {});
        expect(traceOut.textinfo).not.toBeUndefined();
    });

    it('should default textfont to layout.font except for insidetextfont.color', function() {
        traceIn = {
            textposition: 'inside',
            y: [1, 2, 3]
        };
        var layout = {
            font: {
                family: 'arial',
                color: '#AAA',
                size: 13,
                weight: 'bold',
                style: 'italic',
                variant: 'small-caps',
                textcase: 'word caps',
                lineposition: 'under',
                shadow: 'auto',
            }
        };
        var layoutFontMinusColor = {
            family: 'arial',
            size: 13,
            weight: 'bold',
            style: 'italic',
            variant: 'small-caps',
            textcase: 'word caps',
            lineposition: 'under',
            shadow: 'auto',
        };

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

    it('should include alignementgroup/offsetgroup regardless of the funnelmode', function() {
        var gd = {
            data: [{type: 'funnel', y: [1], alignmentgroup: 'a', offsetgroup: '1'}],
            layout: {funnelmode: 'group'}
        };

        supplyAllDefaults(gd);
        expect(gd._fullData[0].alignmentgroup).toBe('a', 'alignementgroup');
        expect(gd._fullData[0].offsetgroup).toBe('1', 'offsetgroup');

        gd.layout.funnelmode = 'stack';
        supplyAllDefaults(gd);
        expect(gd._fullData[0].alignmentgroup).toBe('a', 'alignementgroup');
        expect(gd._fullData[0].offsetgroup).toBe('1', 'offsetgroup');
    });
});

describe('funnel calc / crossTraceCalc', function() {
    'use strict';

    it('should fill in calc pt fields (stack case)', function() {
        var gd = mockFunnelPlot([{
            y: [3, 2, 1]
        }, {
            y: [4, 3, 2]
        }, {
            y: [null, null, 2]
        }], {
            funnelmode: 'stack'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'y', [[-0.5, -0.5, -1.5], [3.5, 2.5, 0.5], [undefined, undefined, 2.5]]);
        assertPointField(cd, 'b', [[-3.5, -2.5, -2.5], [-0.5, -0.5, -1.5], [0, 0, 0.5]]);
        assertPointField(cd, 's', [[3, 2, 1], [4, 3, 2], [undefined, undefined, 2]]);
        assertPointField(cd, 'p', [[0, 1, 2], [0, 1, 2], [0, 1, 2]]);
        assertTraceField(cd, 't.barwidth', [0.8, 0.8, 0.8]);
        assertTraceField(cd, 't.poffset', [-0.4, -0.4, -0.4]);
        assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8, 0.8]);
    });

    it('should fill in calc pt fields (overlay case)', function() {
        var gd = mockFunnelPlot([{
            y: [2, 1, 2]
        }, {
            y: [3, 1, 2]
        }], {
            funnelmode: 'overlay'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'y', [[1, 0.5, 1], [1.5, 0.5, 1]]);
        assertPointField(cd, 'b', [[-1, -0.5, -1], [-1.5, -0.5, -1]]);
        assertPointField(cd, 's', [[2, 1, 2], [3, 1, 2]]);
        assertPointField(cd, 'p', [[0, 1, 2], [0, 1, 2]]);
        assertTraceField(cd, 't.barwidth', [0.8, 0.8]);
        assertTraceField(cd, 't.poffset', [-0.4, -0.4]);
        assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8]);
    });

    it('should fill in calc pt fields (group case)', function() {
        var gd = mockFunnelPlot([{
            y: [2, 1, 2]
        }, {
            y: [3, 1, 2]
        }], {
            funnelmode: 'group',
            // asumming default bargap is 0.2
            funnelgroupgap: 0.1
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[-0.2, 0.8, 1.8], [0.2, 1.2, 2.2]]);
        assertPointField(cd, 'y', [[1, 0.5, 1], [1.5, 0.5, 1]]);
        assertPointField(cd, 'b', [[-1, -0.5, -1], [-1.5, -0.5, -1]]);
        assertPointField(cd, 's', [[2, 1, 2], [3, 1, 2]]);
        assertPointField(cd, 'p', [[0, 1, 2], [0, 1, 2]]);
        assertTraceField(cd, 't.barwidth', [0.36, 0.36]);
        assertTraceField(cd, 't.poffset', [-0.38, 0.02]);
        assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8]);
    });
});

describe('Funnel.calc', function() {
    'use strict';

    it('should not exclude items with non-numeric x from calcdata (vertical case)', function() {
        var gd = mockFunnelPlot([{
            x: [5, NaN, 15, 20, null, 21],
            orientation: 'v'
        }]);

        var cd = gd.calcdata;
        assertPointField(cd, 'x', [[5, NaN, 15, 20, NaN, 21]]);
    });

    it('should not exclude items with non-numeric y from calcdata (horizontal case)', function() {
        var gd = mockFunnelPlot([{
            orientation: 'h',
            y: [20, NaN, 23, 25, null, 26]
        }]);

        var cd = gd.calcdata;
        assertPointField(cd, 'y', [[20, NaN, 23, 25, NaN, 26]]);
    });

    it('should not exclude items with non-numeric x from calcdata (to plots gaps correctly)', function() {
        var gd = mockFunnelPlot([{
            y: ['a', 'b', 'c', 'd'],
            x: [1, null, 'nonsense', 15]
        }]);

        var cd = gd.calcdata;
        assertPointField(cd, 'y', [[0, 1, 2, 3]]);
        assertPointField(cd, 'x', [[0.5, NaN, NaN, 7.5]]);
    });

    it('should not exclude items with non-numeric y from calcdata (to plots gaps correctly)', function() {
        var gd = mockFunnelPlot([{
            y: [1, null, 'nonsense', 15],
            x: [1, 2, 10, 30]
        }], {funnelmode: 'group'});

        var cd = gd.calcdata;
        assertPointField(cd, 'y', [[1, NaN, NaN, 15]]);
        assertPointField(cd, 'x', [[0.5, 1, 5, 15]]);
    });

    it('should guard against negative marker.line.width values', function() {
        var gd = mockFunnelPlot([{
            marker: {
                line: {
                    width: [2, 1, 0, -1, false, true, null, [], -Infinity, Infinity, NaN, {}, '12+1', '1e1']
                }
            },
            y: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
        }], {});

        var cd = gd.calcdata;
        assertPointField(cd, 'mlw', [[2, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 10]]);
    });
});

describe('Funnel.crossTraceCalc', function() {
    'use strict';

    it('should guard against invalid offset items', function() {
        var gd = mockFunnelPlot([{
            offset: 0,
            y: [1, 2, 3]
        }, {
            offset: 1,
            y: [1, 2]
        }, {
            offset: null,
            y: [1]
        }], {
            funnelgap: 0.2,
            funnelmode: 'overlay'
        });

        var cd = gd.calcdata;
        assertArrayField(cd[0][0], 't.poffset', [0]);
        assertArrayField(cd[1][0], 't.poffset', [1]);
        assertArrayField(cd[2][0], 't.poffset', [-0.4]);
    });

    it('should guard against invalid width items', function() {
        var gd = mockFunnelPlot([{
            width: null,
            y: [1]
        }], {
            funnelgap: 0.2,
            funnelmode: 'overlay'
        });

        var cd = gd.calcdata;
        assertArrayField(cd[0][0], 't.barwidth', [0.8]);
    });

    it('should guard against invalid width items (group case)', function() {
        var gd = mockFunnelPlot([{
            width: 0.2,
            y: [1, 2, 3]
        }, {
            width: 0.1,
            y: [1, 2]
        }, {
            width: null,
            y: [1]
        }], {
            funnelgap: 0,
            funnelmode: 'group'
        });

        var cd = gd.calcdata;
        assertArrayField(cd[0][0], 't.barwidth', [0.2]);
        assertArrayField(cd[1][0], 't.barwidth', [0.1]);
        assertArrayField(cd[2][0], 't.barwidth', [0.33]);
    });

    it('should stack vertical and horizontal traces separately', function() {
        var gd = mockFunnelPlot([{
            y: [3, 2, 1]
        }, {
            y: [4, 3, 2]
        }, {
            x: [3, 2, 1]
        }, {
            x: [4, 3, 2]
        }], {
            funnelmode: 'stack'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[-3.5, -2.5, -1.5], [-0.5, -0.5, -0.5], [-3.5, -2.5, -1.5], [-0.5, -0.5, -0.5]]);
        assertPointField(cd, 's', [[3, 2, 1], [4, 3, 2], [3, 2, 1], [4, 3, 2]]);
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2], [-0.5, -0.5, -0.5], [3.5, 2.5, 1.5]]);
        assertPointField(cd, 'y', [[-0.5, -0.5, -0.5], [3.5, 2.5, 1.5], [0, 1, 2], [0, 1, 2]]);
    });

    it('should not group traces that set offset', function() {
        var gd = mockFunnelPlot([{
            y: [3, 2, 1]
        }, {
            y: [2, 1, 0]
        }, {
            offset: -1,
            y: [15, 10, 5]
        }], {
            funnelgap: 0,
            funnelmode: 'group'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[-1.5, -1, -0.5], [-1, -0.5, 0], [-7.5, -5, -2.5]]);
        assertPointField(cd, 's', [[3, 2, 1], [2, 1, 0], [15, 10, 5]]);
        assertPointField(cd, 'x', [[-0.25, 0.75, 1.75], [0.25, 1.25, 2.25], [-0.5, 0.5, 1.5]]);
        assertPointField(cd, 'y', [[1.5, 1, 0.5], [1, 0.5, 0], [7.5, 5, 2.5]]);
    });

    it('should draw traces separately in overlay mode', function() {
        var gd = mockFunnelPlot([{
            y: [1, 2, 3]
        }, {
            y: [10, 20, 30]
        }], {
            funnelgap: 0,
            funnelmode: 'overlay'
        });

        var cd = gd.calcdata;
        assertPointField(cd, 'b', [[-0.5, -1, -1.5], [-5, -10, -15]]);
        assertPointField(cd, 's', [[1, 2, 3], [10, 20, 30]]);
        assertPointField(cd, 'x', [[0, 1, 2], [0, 1, 2]]);
        assertPointField(cd, 'y', [[0.5, 1, 1.5], [5, 10, 15]]);
    });

    it('should expand position axis', function() {
        var gd = mockFunnelPlot([{
            offset: 10,
            width: 2,
            y: [1.5, 1, 0.5]
        }, {
            offset: -5,
            width: 2,
            y: [3, 2, 1]
        }], {
            funnelgap: 0,
            funnelmode: 'overlay'
        });

        var xa = gd._fullLayout.xaxis;
        var ya = gd._fullLayout.yaxis;
        expect(Axes.getAutoRange(gd, xa)).toBeCloseToArray([-5, 14], undefined, '(xa.range)');
        expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([-1.666, 1.666], undefined, '(ya.range)');
    });

    it('should expand size axis (overlay case)', function() {
        var gd = mockFunnelPlot([{
            y: [20, 18, 16]
        }, {
            y: [6, 7, 8]
        }], {
            funnelgap: 0,
            funnelmode: 'overlay'
        });

        expect(gd._fullLayout.barnorm).toBeUndefined();

        var xa = gd._fullLayout.xaxis;
        var ya = gd._fullLayout.yaxis;
        expect(Axes.getAutoRange(gd, xa)).toBeCloseToArray([-0.5, 2.5], undefined, '(xa.range)');
        expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([-11.11, 11.11], undefined, '(ya.range)');
    });

    it('works with log axes (grouped funnels)', function() {
        var gd = mockFunnelPlot([
            {y: [1, 10, 1e10]},
            {y: [2, 20, 2e10]}
        ], {
            yaxis: {type: 'log'},
            funnelmode: 'group'
        });

        var ya = gd._fullLayout.yaxis;
        expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([-0.8733094398675356, 10.572279444203554], undefined, '(ya.range)');
    });

    it('works with log axes (stacked funnels)', function() {
        var gd = mockFunnelPlot([
            {y: [1, 10, 1e10]},
            {y: [2, 20, 2e10]}
        ], {
            yaxis: {type: 'log'},
            funnelmode: 'stack'
        });

        var ya = gd._fullLayout.yaxis;
        expect(Axes.getAutoRange(gd, ya)).toBeCloseToArray([-0.37946429649987423, 10.731646814611235], undefined, '(ya.range)');
    });
});

describe('A funnel plot', function() {
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

    function getAllFunnelNodes(node) {
        return node.querySelectorAll('g.point');
    }

    function assertTextIsInsidePath(textNode, pathNode, errorMargin=0) {
        var textBB = textNode.getBoundingClientRect();
        var pathBB = pathNode.getBoundingClientRect();

        expect(pathBB.left - errorMargin).not.toBeGreaterThan(textBB.left);
        expect(textBB.right - errorMargin).not.toBeGreaterThan(pathBB.right);
        expect(pathBB.top - errorMargin).not.toBeGreaterThan(textBB.top);
        expect(textBB.bottom - errorMargin).not.toBeGreaterThan(pathBB.bottom);
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
            var selection = d3SelectAll(FUNNEL_TEXT_SELECTOR);
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
            type: 'funnel',
            text: ['1', 'Very very very very very long text'],
            textposition: 'inside',
            insidetextrotate: 'auto',
        }];
        var layout = {};

        Plotly.newPlot(gd, data, layout).then(function() {
            var traceNodes = getAllTraceNodes(gd);
            var funnelNodes = getAllFunnelNodes(traceNodes[0]);
            var foundTextNodes;

            for(var i = 0; i < funnelNodes.length; i++) {
                var funnelNode = funnelNodes[i];
                var pathNode = funnelNode.querySelector('path');
                var textNode = funnelNode.querySelector('text');
                if(textNode) {
                    foundTextNodes = true;
                    assertTextIsInsidePath(textNode, pathNode);
                }
            }

            expect(foundTextNodes).toBe(true);
        })
        .then(done, done.fail);
    });

    it('should show funnel texts (outside case)', function(done) {
        var data = [{
            y: [30, 20, 10],
            type: 'funnel',
            text: ['1', 'Very very very very very long funnel text'],
            textposition: 'outside',
        }];
        var layout = {};

        Plotly.newPlot(gd, data, layout).then(function() {
            var traceNodes = getAllTraceNodes(gd);
            var funnelNodes = getAllFunnelNodes(traceNodes[0]);
            var foundTextNodes;

            for(var i = 0; i < funnelNodes.length; i++) {
                var funnelNode = funnelNodes[i];
                var pathNode = funnelNode.querySelector('path');
                var textNode = funnelNode.querySelector('text');
                if(textNode) {
                    foundTextNodes = true;
                    if(data[0].y[i] > 0) assertTextIsAbovePath(textNode, pathNode);
                    else assertTextIsBelowPath(textNode, pathNode);
                }
            }

            expect(foundTextNodes).toBe(true);
        })
        .then(done, done.fail);
    });

    it('should show texts (horizontal case)', function(done) {
        var data = [{
            x: [30, 20, 10],
            type: 'funnel',
            text: ['Very very very very very long text', -20],
            textposition: 'outside',
        }];
        var layout = {};

        Plotly.newPlot(gd, data, layout).then(function() {
            var traceNodes = getAllTraceNodes(gd);
            var funnelNodes = getAllFunnelNodes(traceNodes[0]);
            var foundTextNodes;

            for(var i = 0; i < funnelNodes.length; i++) {
                var funnelNode = funnelNodes[i];
                var pathNode = funnelNode.querySelector('path');
                var textNode = funnelNode.querySelector('text');
                if(textNode) {
                    foundTextNodes = true;
                    if(data[0].x[i] > 0) assertTextIsAfterPath(textNode, pathNode);
                    else assertTextIsBeforePath(textNode, pathNode);
                }
            }

            expect(foundTextNodes).toBe(true);
        })
        .then(done, done.fail);
    });

    var insideTextTestsTrace = {
        x: ['giraffes', 'orangutans', 'monkeys', 'elefants', 'spiders', 'snakes'],
        y: [20, 14, 23, 10, 59, 15],
        text: [20, 14, 23, 10, 59, 15],
        type: 'funnel',
        marker: {
            color: ['#ee1', '#eee', '#333', '#9467bd', '#dda', '#922'],
        }
    };

    it('should take fill opacities into account when calculating contrasting inside text colors', function(done) {
        var trace = {
            x: [5, 10],
            y: [5, 15],
            text: ['Giraffes', 'Zebras'],
            type: 'funnel',
            textposition: 'inside',
            marker: {
                color: ['rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.8)']
            }
        };

        Plotly.newPlot(gd, [trace])
          .then(assertTextFontColors([DARK, LIGHT]))
          .then(done, done.fail);
    });

    it('should use defined textfont.color for inside text instead of the contrasting default', function(done) {
        var data = Lib.extendFlat({}, insideTextTestsTrace, { textfont: { color: '#09f' }, orientation: 'v' });

        Plotly.newPlot(gd, [data])
          .then(assertTextFontColors(Lib.repeat('#09f', 6)))
          .then(done, done.fail);
    });

    it('@noCI should be able to restyle', function(done) {
        var mock = {
            data: [
                {
                    text: [1, 2, 3333333333, 4],
                    textposition: 'outside',
                    textinfo: 'text',
                    y: [1, 2, 3, 4],
                    x: [1, 2, 3, 4],
                    orientation: 'v',
                    type: 'funnel'
                }, {
                    width: 0.4,
                    text: ['Three', 2, 'inside text', 0],
                    textinfo: 'text',
                    textfont: { size: [10] },
                    y: [3, 2, 1, 0],
                    x: [1, 2, 3, 4],
                    orientation: 'v',
                    type: 'funnel'
                }, {
                    width: 1,
                    text: [4, 3, 2, 1],
                    textinfo: 'text',
                    textposition: 'inside',
                    y: [4, 3, 2, 1],
                    x: [1, 2, 3, 4],
                    orientation: 'v',
                    type: 'funnel'
                }, {
                    text: [0, 'outside text', 3, 2],
                    textinfo: 'text',
                    y: [0, 0.25, 3, 2],
                    x: [1, 2, 3, 4],
                    orientation: 'v',
                    type: 'funnel'
                }
            ],
            layout: {
                xaxis: { showgrid: true },
                yaxis: { range: [-6, 6] },
                height: 400,
                width: 400,
                funnelmode: 'overlay'
            }
        };

        Plotly.newPlot(gd, mock.data, mock.layout).then(function() {
            var cd = gd.calcdata;
            assertPointField(cd, 'x', [
                [1, 2, 3, 4], [1, 2, 3, 4],
                [1, 2, 3, 4], [1, 2, 3, 4]]);
            assertPointField(cd, 'y', [
                [0.5, 1, 1.5, 2], [1.5, 1, 0.5, 0],
                [2, 1.5, 1, 0.5], [0, 0.125, 1.5, 1]]);
            assertPointField(cd, 'b', [
                [-0.5, -1, -1.5, -2], [-1.5, -1, -0.5, 0],
                [-2, -1.5, -1, -0.5], [0, -0.125, -1.5, -1]]);
            assertPointField(cd, 's', [
                [1, 2, 3, 4], [3, 2, 1, 0],
                [4, 3, 2, 1], [0, 0.25, 3, 2]]);
            assertPointField(cd, 'p', [
                [1, 2, 3, 4], [1, 2, 3, 4],
                [1, 2, 3, 4], [1, 2, 3, 4]]);
            assertArrayField(cd[0][0], 't.barwidth', [0.8]);
            assertArrayField(cd[1][0], 't.barwidth', [0.4]);
            expect(cd[2][0].t.barwidth).toBe(1);
            expect(cd[3][0].t.barwidth).toBe(0.8);
            assertArrayField(cd[0][0], 't.poffset', [-0.4]);
            assertArrayField(cd[1][0], 't.poffset', [-0.2]);
            expect(cd[2][0].t.poffset).toBe(-0.5);
            expect(cd[3][0].t.poffset).toBe(-0.4);
            assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8, 0.8, 0.8]);

            return Plotly.restyle(gd, 'offset', 0);
        })
        .then(function() {
            var cd = gd.calcdata;
            assertPointField(cd, 'x', [
                [1.4, 2.4, 3.4, 4.4], [1.2, 2.2, 3.2, 4.2],
                [1.5, 2.5, 3.5, 4.5], [1.4, 2.4, 3.4, 4.4]]);
            assertPointField(cd, 'y', [
                [0.5, 1, 1.5, 2], [1.5, 1, 0.5, 0],
                [2, 1.5, 1, 0.5], [0, 0.125, 1.5, 1]]);
            assertPointField(cd, 'b', [
                [-0.5, -1, -1.5, -2], [-1.5, -1, -0.5, 0],
                [-2, -1.5, -1, -0.5], [0, -0.125, -1.5, -1]]);
            assertPointField(cd, 's', [
                [1, 2, 3, 4], [3, 2, 1, 0],
                [4, 3, 2, 1], [0, 0.25, 3, 2]]);
            assertPointField(cd, 'p', [
                [1, 2, 3, 4], [1, 2, 3, 4],
                [1, 2, 3, 4], [1, 2, 3, 4]]);
            assertArrayField(cd[0][0], 't.barwidth', [0.8]);
            assertArrayField(cd[1][0], 't.barwidth', [0.4]);
            expect(cd[2][0].t.barwidth).toBe(1);
            expect(cd[3][0].t.barwidth).toBe(0.8);
            expect(cd[0][0].t.poffset).toBe(0);
            expect(cd[1][0].t.poffset).toBe(0);
            expect(cd[2][0].t.poffset).toBe(0);
            expect(cd[3][0].t.poffset).toBe(0);
            assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8, 0.8, 0.8]);

            var traceNodes = getAllTraceNodes(gd);
            var trace0Bar3 = getAllFunnelNodes(traceNodes[0])[3];
            var path03 = trace0Bar3.querySelector('path');
            var text03 = trace0Bar3.querySelector('text');
            var trace1Bar2 = getAllFunnelNodes(traceNodes[1])[2];
            var path12 = trace1Bar2.querySelector('path');
            var text12 = trace1Bar2.querySelector('text');
            var trace2Bar0 = getAllFunnelNodes(traceNodes[2])[0];
            var path20 = trace2Bar0.querySelector('path');
            var text20 = trace2Bar0.querySelector('text');
            var trace3Bar0 = getAllFunnelNodes(traceNodes[3])[1];
            var path30 = trace3Bar0.querySelector('path');
            var text30 = trace3Bar0.querySelector('text');

            expect(text03.textContent).toBe('4');
            expect(text12.textContent).toBe('inside text');
            expect(text20.textContent).toBe('4');
            expect(text30.textContent).toBe('outside text');

            assertTextIsAbovePath(text03, path03); // outside
            assertTextIsInsidePath(text12, path12); // inside
            assertTextIsInsidePath(text20, path20); // inside
            assertTextIsAbovePath(text30, path30); // outside

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
        })
        .then(function() {
            var cd = gd.calcdata;
            assertPointField(cd, 'x', [
                [1.4, 2.4, 3.4, 4.4], [1.2, 2.2, 3.2, 4.2],
                [1.5, 2.5, 3.5, 4.5], [1.4, 2.4, 3.4, 4.4]]);
            assertPointField(cd, 'y', [
                [0.5, 1, 1.5, 2], [1.5, 1, 0.5, 0],
                [2, 1.5, 1, 0.5], [0, 0.125, 1.5, 1]]);
            assertPointField(cd, 'b', [
                [-0.5, -1, -1.5, -2], [-1.5, -1, -0.5, 0],
                [-2, -1.5, -1, -0.5], [0, -0.125, -1.5, -1]]);
            assertPointField(cd, 's', [
                [1, 2, 3, 4], [3, 2, 1, 0],
                [4, 3, 2, 1], [0, 0.25, 3, 2]]);
            assertPointField(cd, 'p', [
                [1, 2, 3, 4], [1, 2, 3, 4],
                [1, 2, 3, 4], [1, 2, 3, 4]]);
            assertArrayField(cd[0][0], 't.barwidth', [0.8]);
            assertArrayField(cd[1][0], 't.barwidth', [0.4]);
            expect(cd[2][0].t.barwidth).toBe(1);
            expect(cd[3][0].t.barwidth).toBe(0.8);
            expect(cd[0][0].t.poffset).toBe(0);
            expect(cd[1][0].t.poffset).toBe(0);
            expect(cd[2][0].t.poffset).toBe(0);
            expect(cd[3][0].t.poffset).toBe(0);
            assertTraceField(cd, 't.bargroupwidth', [0.8, 0.8, 0.8, 0.8]);

            var traceNodes = getAllTraceNodes(gd);
            var trace0Bar3 = getAllFunnelNodes(traceNodes[0])[3];
            var path03 = trace0Bar3.querySelector('path');
            var text03 = trace0Bar3.querySelector('text');
            var trace1Bar2 = getAllFunnelNodes(traceNodes[1])[2];
            var path12 = trace1Bar2.querySelector('path');
            var text12 = trace1Bar2.querySelector('text');
            var trace2Bar0 = getAllFunnelNodes(traceNodes[2])[0];
            var path20 = trace2Bar0.querySelector('path');
            var text20 = trace2Bar0.querySelector('text');
            var trace3Bar0 = getAllFunnelNodes(traceNodes[3])[1];
            var path30 = trace3Bar0.querySelector('path');
            var text30 = trace3Bar0.querySelector('text');

            expect(text03.textContent).toBe('4');
            expect(text12.textContent).toBe('inside text');
            expect(text20.textContent).toBe('4');
            expect(text30.textContent).toBe('outside text');

            assertTextIsInsidePath(text03, path03); // inside
            assertTextIsInsidePath(text12, path12); // inside
            assertTextIsInsidePath(text20, path20); // inside
            assertTextIsInsidePath(text30, path30, 0.5); // inside
        })
        .then(done, done.fail);
    });

    it('should be able to add/remove connector line nodes on restyle', function(done) {
        function _assertNumberOfFunnelConnectorNodes(cnt) {
            var sel = d3Select(gd).select('.funnellayer').selectAll('.line');
            expect(sel.size()).toBe(cnt);
        }

        Plotly.newPlot(gd, [{
            type: 'funnel',
            x: ['Initial', 'A', 'B', 'C', 'Total'],
            y: [10, 2, 3, 5],
            connector: { visible: false, line: { width: 2 } }
        }])
        .then(function() {
            _assertNumberOfFunnelConnectorNodes(0);
            return Plotly.restyle(gd, 'connector.visible', true);
        })
        .then(function() {
            _assertNumberOfFunnelConnectorNodes(4);
            return Plotly.restyle(gd, 'connector.visible', false);
        })
        .then(function() {
            _assertNumberOfFunnelConnectorNodes(0);
            return Plotly.restyle(gd, 'connector.visible', true);
        })
        .then(function() {
            _assertNumberOfFunnelConnectorNodes(4);
            return Plotly.restyle(gd, 'connector.line.width', 0);
        })
        .then(function() {
            _assertNumberOfFunnelConnectorNodes(0);
            return Plotly.restyle(gd, 'connector.line.width', 10);
        })
        .then(function() {
            _assertNumberOfFunnelConnectorNodes(4);
            return Plotly.restyle(gd, 'connector.line.width', 0);
        })
        .then(function() {
            _assertNumberOfFunnelConnectorNodes(0);
        })
        .then(done, done.fail);
    });

    it('should be able to add/remove connector region nodes on restyle', function(done) {
        function _assertNumberOfFunnelConnectorNodes(cnt) {
            var sel = d3Select(gd).select('.funnellayer').selectAll('.region');
            expect(sel.size()).toBe(cnt);
        }

        Plotly.newPlot(gd, [{
            type: 'funnel',
            x: ['Initial', 'A', 'B', 'C', 'Total'],
            y: [10, 2, 3, 5],
            connector: { visible: false }
        }])
        .then(function() {
            _assertNumberOfFunnelConnectorNodes(0);
            return Plotly.restyle(gd, 'connector.visible', true);
        })
        .then(function() {
            _assertNumberOfFunnelConnectorNodes(4);
            return Plotly.restyle(gd, 'connector.visible', false);
        })
        .then(function() {
            _assertNumberOfFunnelConnectorNodes(0);
            return Plotly.restyle(gd, 'connector.visible', true);
        })
        .then(function() {
            _assertNumberOfFunnelConnectorNodes(4);
        })
        .then(done, done.fail);
    });

    it('handle BADNUM positions', function(done) {
        var x1 = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
        var x2 = x1; // no transition now
        var mockCopy = {
            data: [
                {
                    type: 'funnel',
                    y: [
                        0,
                        1,
                        '',
                        'NaN',
                        NaN,
                        Infinity,
                        -Infinity,
                        undefined,
                        null,
                        9,
                        10
                    ],
                    x: x1
                }
            ],
            layout: {
                width: 800,
                height: 600
            }
        };

        var barTests = [
            [0, '.point path', 'attr', 'd', ['M245,4V34H395V4Z', 'M251,42V73H389V42Z', 'M0,0Z', 'M0,0Z', 'M0,0Z', 'M0,0Z', 'M0,0Z', 'M0,0Z', 'M0,0Z', 'M306,347V378H334V347Z', 'M313,386V416H327V386Z']]
        ];

        var connectorTests = [
            [0, '.regions path', 'attr', 'd', ['M245,34L251,42H389L395,34Z', 'M0,0Z', 'M0,0Z', 'M0,0Z', 'M0,0Z', 'M0,0Z', 'M0,0Z', 'M0,0Z', 'M0,0Z', 'M306,378L313,386H327L334,378Z', 'M0,0Z']]
        ];

        var animateOpts = {data: [{x: x2}]};
        var transitionOpts = false; // use default

        checkTransition(gd, mockCopy, animateOpts, transitionOpts, barTests)
        .then(function() {
            return checkTransition(gd, mockCopy, animateOpts, transitionOpts, connectorTests);
        })
        .then(done, done.fail);
    });

    it('should coerce text-related attributes', function(done) {
        var data = [{
            y: [10, 20, 30, 40],
            type: 'funnel',
            text: ['T1P1', 'T1P2', 13, 14],
            textinfo: 'text',
            textposition: ['inside', 'outside', 'auto', 'none', 'BADVALUE'],
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
            type: 'funnel',
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

        Plotly.newPlot(gd, data, layout).then(function() {
            var traceNodes = getAllTraceNodes(gd);
            var funnelNodes = getAllFunnelNodes(traceNodes[0]);
            var pathNodes = [
                funnelNodes[0].querySelector('path'),
                funnelNodes[1].querySelector('path'),
                funnelNodes[2].querySelector('path'),
                funnelNodes[3].querySelector('path')
            ];
            var textNodes = [
                funnelNodes[0].querySelector('text'),
                funnelNodes[1].querySelector('text'),
                funnelNodes[2].querySelector('text'),
                funnelNodes[3].querySelector('text')
            ];
            var i;

            // assert funnel texts
            for(i = 0; i < 3; i++) {
                expect(textNodes[i].textContent).toBe(expected.text[i]);
            }

            // assert funnel positions
            assertTextIsInsidePath(textNodes[0], pathNodes[0]); // inside
            assertTextIsAbovePath(textNodes[1], pathNodes[1]); // outside
            assertTextIsInsidePath(textNodes[2], pathNodes[2]); // auto -> inside
            expect(textNodes[3]).toBe(null); // BADVALUE -> none

            // assert fonts
            assertTextFont(textNodes[0], expected.insidetextfont, 0);
            assertTextFont(textNodes[1], expected.outsidetextfont, 1);
            assertTextFont(textNodes[2], expected.insidetextfont, 2);
        })
        .then(done, done.fail);
    });

    it('should be able to add/remove text node on restyle', function(done) {
        function _assertNumberOfFunnelTextNodes(cnt) {
            var sel = d3Select(gd).select('.funnellayer').selectAll('text');
            expect(sel.size()).toBe(cnt);
        }

        Plotly.newPlot(gd, [{
            type: 'funnel',
            orientation: 'v',
            x: ['Product A', 'Product B', 'Product C'],
            y: [20, 14, 23],
            text: [20, 14, 23],
            textinfo: 'text'
        }])
        .then(function() {
            _assertNumberOfFunnelTextNodes(3);
            return Plotly.restyle(gd, 'textposition', 'none');
        })
        .then(function() {
            _assertNumberOfFunnelTextNodes(0);
            return Plotly.restyle(gd, 'textposition', 'auto');
        })
        .then(function() {
            _assertNumberOfFunnelTextNodes(3);
            return Plotly.restyle(gd, 'text', [[null, 0, '']]);
        })
        .then(function() {
            // N.B. that '0' should be there!
            _assertNumberOfFunnelTextNodes(1);
            return Plotly.restyle(gd, 'text', 'yo!');
        })
        .then(function() {
            _assertNumberOfFunnelTextNodes(3);
            return Plotly.restyle(gd, 'textinfo', 'text');
        })
        .then(function() {
            _assertNumberOfFunnelTextNodes(3);
            return Plotly.restyle(gd, 'text', [[null, 0, '']]);
        })
        .then(function() {
            // N.B. that '0' should be there!
            _assertNumberOfFunnelTextNodes(1);
            return Plotly.restyle(gd, 'textinfo', 'value');
        })
        .then(function() {
            _assertNumberOfFunnelTextNodes(3);
            return Plotly.restyle(gd, 'textposition', 'none');
        })
        .then(function() {
            _assertNumberOfFunnelTextNodes(0);
        })
        .then(done, done.fail);
    });

    it('should be able to react with new text colors', function(done) {
        Plotly.react(gd, [{
            type: 'funnel',
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
        .then(done, done.fail);
    });

    checkTextTemplate([{
        type: 'funnel',
        orientation: 'v',
        x: ['A', 'B', 'C'],
        y: [3, 2, 1],
        textinfo: 'value+percent initial+percent previous+percent total',
    }], 'text.bartext', [
      ['txt: %{value}', ['txt: 3', 'txt: 2', 'txt: 1']],
      ['%{value}-%{percentInitial}-%{percentPrevious}-%{percentTotal:0.3f}', ['3-100%-100%-0.500', '2-67%-67%-0.333', '1-33%-50%-0.167']]
    ]);
});

describe('funnel hover', function() {
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
        var pts = Funnel.hoverPoints(pointData, xval, yval, hovermode, {});
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

            var mock = Lib.extendDeep({}, require('../../image/mocks/funnel_11.json'));

            Plotly.newPlot(gd, mock.data, mock.layout)
            .then(done, done.fail);
        });

        it('should return the correct hover point data (case x)', function() {
            var out = _hover(gd, 0, 0, 'x');

            expect(out.style).toEqual([0, 'rgb(255, 102, 97)', 0, 13.23]);
            assertPos(out.pos, [11.87, 106.8, 76.23, 76.23]);
        });

        it('should return the correct hover point data (case closest)', function() {
            var out = _hover(gd, -0.2, 6, 'closest');

            expect(out.style).toEqual([0, 'rgb(255, 102, 97)', 0, 13.23]);
            assertPos(out.pos, [11.87, 59.33, 76.23, 76.23]);
        });
    });

    describe('text labels', function() {
        it('should show \'hovertext\' items when present, \'text\' if not', function(done) {
            gd = createGraphDiv();

            var mock = Lib.extendDeep({}, require('../../image/mocks/text_chart_arrays'));
            mock.data.forEach(function(t) { t.type = 'funnel'; t.orientation = 'v'; });
            mock.layout.funnelmode = 'group';

            Plotly.newPlot(gd, mock).then(function() {
                var out = _hover(gd, -0.25, 0.25, 'closest');
                expect(out.text).toEqual('Hover text\nA', 'hover text');

                return Plotly.restyle(gd, 'hovertext', null);
            })
            .then(function() {
                var out = _hover(gd, -0.25, 0.25, 'closest');
                expect(out.text).toEqual('Text\nA', 'hover text');

                return Plotly.restyle(gd, 'text', ['APPLE', 'BANANA', 'ORANGE']);
            })
            .then(function() {
                var out = _hover(gd, -0.25, 0.25, 'closest');
                expect(out.text).toEqual('APPLE', 'hover text');

                return Plotly.restyle(gd, 'hovertext', ['apple', 'banana', 'orange']);
            })
            .then(function() {
                var out = _hover(gd, -0.25, 0.25, 'closest');
                expect(out.text).toEqual('apple', 'hover text');
            })
            .then(done, done.fail);
        });

        it('should turn off percentages with hoveinfo none or skip', function(done) {
            gd = createGraphDiv();

            var mock = Lib.extendDeep({}, require('../../image/mocks/text_chart_arrays'));
            mock.data.forEach(function(t, i) {
                t.type = 'funnel';
                t.orientation = 'v';
                if(i === 0) {
                    t.hoverinfo = 'none';
                } else {
                    t.hoverinfo = 'skip';
                }
            });

            function _hover() {
                var evt = { xpx: 125, ypx: 150 };
                Fx.hover('graph', evt, 'xy');
            }

            Plotly.newPlot(gd, mock)
            .then(_hover)
            .then(function() {
                expect(d3SelectAll('g.hovertext').size()).toBe(0);
            })
            .then(done, done.fail);
        });

        it('should turn on percentages with hoveinfo all', function(done) {
            gd = createGraphDiv();

            var mock = Lib.extendDeep({}, require('../../image/mocks/text_chart_arrays'));
            mock.data.forEach(function(t) {
                t.type = 'funnel';
                t.orientation = 'v';
                t.hoverinfo = 'all';
            });
            mock.layout.hovermode = 'x';

            function _hover() {
                var evt = { xpx: 125, ypx: 150 };
                Fx.hover('graph', evt, 'xy');
            }

            Plotly.newPlot(gd, mock)
            .then(_hover)
            .then(function() {
                assertHoverLabelContent({
                    nums: [
                        '1\nHover text A\n100% of initial\n100% of previous\n33.3% of total',
                        '2\nHover text G\n100% of initial\n100% of previous\n33.3% of total',
                        '1.5\na (hover)\n100% of initial\n100% of previous\n33.3% of total'
                    ],
                    name: ['Lines, Marke...', 'Lines and Text', 'missing text'],
                    axis: '0'
                });
            })
            .then(done, done.fail);
        });

        it('should use hovertemplate if specified', function(done) {
            gd = createGraphDiv();

            var mock = Lib.extendDeep({}, require('../../image/mocks/text_chart_arrays'));
            mock.data.forEach(function(t) {
                t.type = 'funnel';
                t.orientation = 'v';
                t.hovertemplate = 'Value: %{y}<br>Total percentage: %{percentTotal}<br>Initial percentage: %{percentInitial}<br>Previous percentage: %{percentPrevious}<extra></extra>';
            });
            mock.layout.hovermode = 'x';

            function _hover() {
                var evt = { xpx: 125, ypx: 150 };
                Fx.hover('graph', evt, 'xy');
            }

            Plotly.newPlot(gd, mock)
            .then(_hover)
            .then(function() {
                assertHoverLabelContent({
                    nums: [
                        'Value: 1\nTotal percentage: 33.3%\nInitial percentage: 100%\nPrevious percentage: 100%',
                        'Value: 2\nTotal percentage: 33.3%\nInitial percentage: 100%\nPrevious percentage: 100%',
                        'Value: 1.5\nTotal percentage: 33.3%\nInitial percentage: 100%\nPrevious percentage: 100%'
                    ],
                    name: ['', '', ''],
                    axis: '0'
                });
            })
            .then(done, done.fail);
        });

        describe('display percentage from the initial value', function() {
            it('should format numbers and add tick prefix & suffix even if axis is not visible', function(done) {
                gd = createGraphDiv();

                Plotly.newPlot(gd, {
                    data: [{
                        x: ['A', 'B', 'C', 'D', 'E'],
                        y: [5.5, 4.4, 3.3, 2.2, 1.1],
                        orientation: 'v',
                        type: 'funnel'
                    }],
                    layout: {
                        hovermode: 'x',
                        yaxis: {
                            visible: false,
                            tickprefix: '$',
                            ticksuffix: '!'
                        },
                        width: 400,
                        height: 400
                    }
                })
                .then(function() {
                    var evt = { xpx: 200, ypx: 350 };
                    Fx.hover('graph', evt, 'xy');
                })
                .then(function() {
                    assertHoverLabelContent({
                        nums: '$1.1!\n20% of initial\n50% of previous\n6.7% of total',
                        axis: 'E'
                    });
                })
                .then(done, done.fail);
            });
        });
    });

    describe('with special width/offset combinations', function() {
        beforeEach(function() {
            gd = createGraphDiv();
        });

        it('should return correct hover data (single funnel, trace width)', function(done) {
            Plotly.newPlot(gd, [{
                type: 'funnel',
                orientation: 'v',
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
                    [-3.9, 0.5, 'closest'],
                    [5.9, 0.95, 'closest'],
                    [-3.9, -5, 'x'],
                    [5.9, 9.5, 'x']
                ].forEach(function(hoverSpec) {
                    var out = _hover(gd, hoverSpec[0], hoverSpec[1], hoverSpec[2]);

                    expect(out.style).toEqual([0, 'red', 1, 2], hoverSpec);
                    assertPos(out.pos, [264, 278, 14, 14], hoverSpec);
                });

                // then a few that are off the edge so yield nothing
                [
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
            .then(done, done.fail);
        });

        it('positions labels correctly w.r.t. narrow funnels', function(done) {
            Plotly.newPlot(gd, [{
                x: [0, 10, 20],
                y: [2, 6, 4],
                type: 'funnel',
                orientation: 'v',
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
            .then(done, done.fail);
        });
    });
});

function mockFunnelPlot(dataWithoutTraceType, layout) {
    var traceTemplate = { type: 'funnel' };

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

describe('funnel uniformtext', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function assertTextSizes(msg, opts) {
        return function() {
            var selection = d3SelectAll(FUNNEL_TEXT_SELECTOR);
            var size = selection.size();
            ['fontsizes', 'scales'].forEach(function(e) {
                expect(size).toBe(opts[e].length, 'length for ' + e + ' does not match with the number of elements');
            });

            selection.each(function(d, i) {
                var fontSize = this.style.fontSize;
                expect(fontSize).toBe(opts.fontsizes[i] + 'px', 'fontSize for element ' + i, msg);
            });

            for(var i = 0; i < selection[0].length; i++) {
                var transform = selection[0][i].getAttribute('transform');
                var pos0 = transform.indexOf('scale(');
                var scale = 1;
                if(pos0 !== -1) {
                    pos0 += 'scale('.length;
                    var pos1 = transform.indexOf(')', pos0);
                    scale = +(transform.substring(pos0, pos1));
                }

                expect(opts.scales[i]).toBeCloseTo(scale, 1, 'scale for element ' + i, msg);
            }
        };
    }

    it('should be able to react with new uniform text options', function(done) {
        var fig = {
            data: [{
                type: 'funnel',
                orientation: 'h',
                x: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],

                text: [
                    'long lablel',
                    '$',
                    '=',
                    '|',
                    '.',
                    ' ',
                    '',
                    null,
                    '<br>',
                    0
                ],

                textinfo: 'text',
                textposition: 'inside',
                textangle: 0
            }],
            layout: {
                width: 500,
                height: 500
            }
        };

        Plotly.newPlot(gd, fig)
        .then(assertTextSizes('without uniformtext', {
            fontsizes: [12, 12, 12, 12, 12, 12, 12],
            scales: [0.44, 1, 1, 1, 1, 1, 1],
        }))
        .then(function() {
            fig.layout.uniformtext = {mode: 'hide'}; // default with minsize=0
            return Plotly.react(gd, fig);
        })
        .then(assertTextSizes('using mode: "hide"', {
            fontsizes: [12, 12, 12, 12, 12, 12, 12],
            scales: [0.44, 0.44, 0.44, 0.44, 0.44, 0.44, 0.44],
        }))
        .then(function() {
            fig.layout.uniformtext.minsize = 9; // set a minsize less than trace font size
            return Plotly.react(gd, fig);
        })
        .then(assertTextSizes('using minsize: 9', {
            fontsizes: [12, 12, 12, 12, 12, 12, 12],
            scales: [0, 1, 1, 1, 1, 1, 1],
        }))
        .then(function() {
            fig.layout.uniformtext.minsize = 32; // set a minsize greater than trace font size
            return Plotly.react(gd, fig);
        })
        .then(assertTextSizes('using minsize: 32', {
            fontsizes: [32, 32, 32, 32, 32, 32, 32],
            scales: [0, 0, 0, 0, 0, 0, 0],
        }))
        .then(function() {
            fig.layout.uniformtext.minsize = 14; // set a minsize greater than trace font size
            return Plotly.react(gd, fig);
        })
        .then(assertTextSizes('using minsize: 14', {
            fontsizes: [14, 14, 14, 14, 14, 14, 14],
            scales: [0, 1, 1, 1, 1, 1, 1],
        }))
        .then(function() {
            fig.layout.uniformtext.mode = 'show';
            return Plotly.react(gd, fig);
        })
        .then(assertTextSizes('using mode: "show"', {
            fontsizes: [14, 14, 14, 14, 14, 14, 14],
            scales: [1, 1, 1, 1, 1, 1, 1],
        }))
        .then(function() {
            fig.layout.uniformtext = undefined; // back to default
            return Plotly.react(gd, fig);
        })
        .then(assertTextSizes('clear uniformtext', {
            fontsizes: [12, 12, 12, 12, 12, 12, 12],
            scales: [0.44, 1, 1, 1, 1, 1, 1],
        }))
        .then(done, done.fail);
    });
});
