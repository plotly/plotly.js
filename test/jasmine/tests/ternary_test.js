var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var rgb = require('../../../src/components/color').rgb;

var supplyLayoutDefaults = require('../../../src/plots/ternary/layout_defaults');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var mouseEvent = require('../assets/mouse_event');
var click = require('../assets/click');
var doubleClick = require('../assets/double_click');
var drag = require('../assets/drag');
var getClientPosition = require('../assets/get_client_position');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

var SORTED_EVENT_KEYS = [
    'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex',
    'xaxis', 'yaxis', 'a', 'b', 'c', 'id',
    'bbox', 'xPixel', 'yPixel'
].sort();

describe('ternary plots', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    describe('with scatterternary trace(s)', function() {
        var mock = require('../../image/mocks/ternary_simple.json');
        var gd;

        var pointPos = [391, 219];
        var blankPos = [200, 200];

        beforeEach(function(done) {
            gd = createGraphDiv();

            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        it('should be able to toggle trace visibility', function(done) {
            expect(countTraces('scatter')).toEqual(1);

            Plotly.restyle(gd, 'visible', false).then(function() {
                expect(countTraces('scatter')).toEqual(0);

                return Plotly.restyle(gd, 'visible', true);
            }).then(function() {
                expect(countTraces('scatter')).toEqual(1);

                return Plotly.restyle(gd, 'visible', 'legendonly');
            }).then(function() {
                expect(countTraces('scatter')).toEqual(0);

                return Plotly.restyle(gd, 'visible', true);
            }).then(function() {
                expect(countTraces('scatter')).toEqual(1);
            })
            .then(done, done.fail);
        });

        it('should be able to delete and add traces', function(done) {
            function checkTitles(cnt) {
                expect(d3SelectAll('.g-atitle').size()).toBe(cnt, 'aaxis title');
                expect(d3SelectAll('.g-btitle').size()).toBe(cnt, 'baxis title');
                expect(d3SelectAll('.g-ctitle').size()).toBe(cnt, 'caxis title');
            }

            expect(countTernarySubplot()).toEqual(1);
            expect(countTraces('scatter')).toEqual(1);
            checkTitles(1);

            Plotly.deleteTraces(gd, [0]).then(function() {
                expect(countTernarySubplot()).toEqual(0);
                expect(countTraces('scatter')).toEqual(0);
                checkTitles(0);

                var trace = Lib.extendDeep({}, mock.data[0]);

                return Plotly.addTraces(gd, [trace]);
            }).then(function() {
                expect(countTernarySubplot()).toEqual(1);
                expect(countTraces('scatter')).toEqual(1);
                checkTitles(1);

                var trace = Lib.extendDeep({}, mock.data[0]);

                return Plotly.addTraces(gd, [trace]);
            }).then(function() {
                expect(countTernarySubplot()).toEqual(1);
                expect(countTraces('scatter')).toEqual(2);
                checkTitles(1);

                return Plotly.deleteTraces(gd, [0]);
            }).then(function() {
                expect(countTernarySubplot()).toEqual(1);
                expect(countTraces('scatter')).toEqual(1);
                checkTitles(1);
            })
            .then(done, done.fail);
        });

        it('should be able to restyle', function(done) {
            Plotly.restyle(gd, { a: [[1, 2, 3]]}, 0).then(function() {
                var transforms = [];
                d3SelectAll('.ternary .point').each(function() {
                    var point = d3Select(this);
                    transforms.push(point.attr('transform'));
                });

                expect(transforms).toEqual([
                    'translate(186.45,209.8)',
                    'translate(118.53,170.59)',
                    'translate(248.76,117.69)'
                ]);
            })
            .then(done, done.fail);
        });

        it('should display to hover labels', function(done) {
            mouseEvent('mousemove', blankPos[0], blankPos[1]);
            assertHoverLabelContent([null, null], 'only on data points');

            function check(content, style, msg) {
                Lib.clearThrottle();
                mouseEvent('mousemove', pointPos[0], pointPos[1]);

                assertHoverLabelContent({nums: content}, msg);
                assertHoverLabelStyle(d3Select('g.hovertext'), style, msg);
            }

            check([
                'Component A: 0.5',
                'B: 0.25',
                'Component C: 0.25'
            ].join('\n'), {
                bgcolor: 'rgb(31, 119, 180)',
                bordercolor: 'rgb(255, 255, 255)',
                fontColor: 'rgb(255, 255, 255)',
                fontSize: 13,
                fontFamily: 'Arial'
            }, 'one label per data pt');

            Plotly.restyle(gd, {
                'hoverlabel.bordercolor': 'blue',
                'hoverlabel.font.family': [['Gravitas', 'Arial', 'Roboto']]
            })
            .then(function() {
                check([
                    'Component A: 0.5',
                    'B: 0.25',
                    'Component C: 0.25'
                ].join('\n'), {
                    bgcolor: 'rgb(31, 119, 180)',
                    bordercolor: 'rgb(0, 0, 255)',
                    fontColor: 'rgb(0, 0, 255)',
                    fontSize: 13,
                    fontFamily: 'Gravitas'
                }, 'after hoverlabel styling restyle call');

                return Plotly.restyle(gd, 'hoverinfo', [['a', 'b+c', 'b']]);
            })
            .then(function() {
                check('Component A: 0.5', {
                    bgcolor: 'rgb(31, 119, 180)',
                    bordercolor: 'rgb(0, 0, 255)',
                    fontColor: 'rgb(0, 0, 255)',
                    fontSize: 13,
                    fontFamily: 'Gravitas'
                }, 'after hoverlabel styling restyle call');
            })
            .then(done, done.fail);
        });

        it('should respond to hover interactions by', function() {
            var hoverCnt = 0;
            var unhoverCnt = 0;

            var hoverData, unhoverData;

            gd.on('plotly_hover', function(eventData) {
                hoverCnt++;
                hoverData = eventData.points[0];
            });

            gd.on('plotly_unhover', function(eventData) {
                unhoverCnt++;
                unhoverData = eventData.points[0];
            });

            mouseEvent('mousemove', blankPos[0], blankPos[1]);
            expect(hoverData).toBe(undefined, 'not firing on blank points');
            expect(unhoverData).toBe(undefined, 'not firing on blank points');

            mouseEvent('mousemove', pointPos[0], pointPos[1]);
            expect(hoverData).not.toBe(undefined, 'firing on data points');
            expect(Object.keys(hoverData).sort()).toEqual(SORTED_EVENT_KEYS, 'returning the correct event data keys');
            expect(hoverData.curveNumber).toEqual(0, 'returning the correct curve number');
            expect(hoverData.pointNumber).toEqual(0, 'returning the correct point number');

            mouseEvent('mouseout', pointPos[0], pointPos[1]);
            expect(unhoverData).not.toBe(undefined, 'firing on data points');
            expect(Object.keys(unhoverData).sort()).toEqual(SORTED_EVENT_KEYS, 'returning the correct event data keys');
            expect(unhoverData.curveNumber).toEqual(0, 'returning the correct curve number');
            expect(unhoverData.pointNumber).toEqual(0, 'returning the correct point number');

            expect(hoverCnt).toEqual(1);
            expect(unhoverCnt).toEqual(1);
        });

        it('should respond to click interactions by', function() {
            var ptData;

            gd.on('plotly_click', function(eventData) {
                ptData = eventData.points[0];
            });

            click(blankPos[0], blankPos[1]);
            expect(ptData).toBe(undefined, 'not firing on blank points');

            click(pointPos[0], pointPos[1]);
            expect(ptData).not.toBe(undefined, 'firing on data points');
            expect(Object.keys(ptData).sort()).toEqual(SORTED_EVENT_KEYS, 'returning the correct event data keys');
            expect(ptData.curveNumber).toEqual(0, 'returning the correct curve number');
            expect(ptData.pointNumber).toEqual(0, 'returning the correct point number');
        });

        it('should respond zoom drag interactions', function(done) {
            assertRange(gd, [0.231, 0.2, 0.11]);

            drag({path: [[383, 213], [293, 243]]})
            .then(function() { assertRange(gd, [0.4435, 0.2462, 0.1523]); })
            .then(function() { return doubleClick(pointPos[0], pointPos[1]); })
            .then(function() { assertRange(gd, [0, 0, 0]); })
            .then(done, done.fail);
        });
    });

    describe('static plots', function() {
        var mock = require('../../image/mocks/ternary_simple.json');
        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();

            var mockCopy = Lib.extendDeep({}, mock);
            var config = { staticPlot: true };

            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout, config).then(done);
        });

        it('should not respond to drag', function(done) {
            var range = [0.231, 0.2, 0.11];

            assertRange(gd, range);

            drag({path: [[390, 220], [300, 250]], noCover: true})
            .then(function() { assertRange(gd, range); })
            .then(function() { return doubleClick(390, 220); })
            .then(function() { assertRange(gd, range); })
            .then(done, done.fail);
        });
    });

    it('should be able to reorder axis layers when relayout\'ing *layer*', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('../../image/mocks/ternary_simple.json'));
        var dflt = [
            'draglayer', 'plotbg', 'backplot', 'grids',
            'frontplot',
            'aaxis', 'aline', 'baxis', 'bline', 'caxis', 'cline'
        ];

        function _assert(layers) {
            var toplevel = d3SelectAll('g.ternary > .toplevel');

            expect(toplevel.size()).toBe(layers.length, '# of layer');

            toplevel.each(function(d, i) {
                var className = d3Select(this)
                    .attr('class')
                    .split('toplevel ')[1];

                expect(className).toBe(layers[i], 'layer ' + i);
            });
        }

        Plotly.newPlot(gd, fig).then(function() {
            _assert(dflt);
            return Plotly.relayout(gd, 'ternary.aaxis.layer', 'below traces');
        })
        .then(function() {
            _assert([
                'draglayer', 'plotbg', 'backplot', 'grids',
                'aaxis', 'aline',
                'frontplot',
                'baxis', 'bline', 'caxis', 'cline'
            ]);
            return Plotly.relayout(gd, 'ternary.caxis.layer', 'below traces');
        })
        .then(function() {
            _assert([
                'draglayer', 'plotbg', 'backplot', 'grids',
                'aaxis', 'aline', 'caxis', 'cline',
                'frontplot',
                'baxis', 'bline'
            ]);
            return Plotly.relayout(gd, 'ternary.baxis.layer', 'below traces');
        })
        .then(function() {
            _assert([
                'draglayer', 'plotbg', 'backplot', 'grids',
                'aaxis', 'aline', 'baxis', 'bline', 'caxis', 'cline',
                'frontplot'
            ]);
            return Plotly.relayout(gd, 'ternary.aaxis.layer', null);
        })
        .then(function() {
            _assert([
                'draglayer', 'plotbg', 'backplot', 'grids',
                'baxis', 'bline', 'caxis', 'cline',
                'frontplot',
                'aaxis', 'aline'
            ]);
            return Plotly.relayout(gd, {
                'ternary.baxis.layer': null,
                'ternary.caxis.layer': null
            });
        })
        .then(function() {
            _assert(dflt);
        })
        .then(done, done.fail);
    });

    it('should be able to relayout axis tickfont attributes', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('../../image/mocks/ternary_simple.json'));

        function _assert(family, color, size) {
            var tick = d3Select('g.aaxis > g.ytick > text').node();

            expect(tick.style['font-family']).toBe(family, 'font family');
            expect(parseFloat(tick.style['font-size'])).toBe(size, 'font size');
            expect(tick.style.fill).toBe(color, 'font color');
        }

        Plotly.newPlot(gd, fig).then(function() {
            _assert('"Open Sans", verdana, arial, sans-serif', 'rgb(204, 204, 204)', 12);

            return Plotly.relayout(gd, 'ternary.aaxis.tickfont.size', 5);
        })
        .then(function() {
            _assert('"Open Sans", verdana, arial, sans-serif', 'rgb(204, 204, 204)', 5);

            return Plotly.relayout(gd, 'ternary.aaxis.tickfont', {
                family: 'Roboto',
                color: 'red',
                size: 20
            });
        })
        .then(function() {
            _assert('Roboto', 'rgb(255, 0, 0)', 20);
        })
        .then(done, done.fail);
    });

    it('should be able to relayout axis title attributes', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('../../image/mocks/ternary_simple.json'));

        function _assert(axisPrefix, title, family, color, size) {
            var titleSel = d3Select('.' + axisPrefix + 'title');
            var titleNode = titleSel.node();

            var msg = 'for ' + axisPrefix + 'axis title';
            expect(titleSel.text()).toBe(title, 'title ' + msg);
            expect(titleNode.style['font-family']).toBe(family, 'font family ' + msg);
            expect(parseFloat(titleNode.style['font-size'])).toBe(size, 'font size ' + msg);
            expect(titleNode.style.fill).toBe(color, 'font color ' + msg);
        }

        Plotly.newPlot(gd, fig).then(function() {
            _assert('a', 'Component A', '"Open Sans", verdana, arial, sans-serif', rgb('#ccc'), 14);
            _assert('b', 'chocolate', '"Open Sans", verdana, arial, sans-serif', rgb('#0f0'), 14);
            _assert('c', 'Component C', '"Open Sans", verdana, arial, sans-serif', rgb('#444'), 14);

            return Plotly.relayout(gd, {
                'ternary.aaxis.title.text': 'chips',
                'ternary.aaxis.title.font.color': 'yellow',
                'ternary.aaxis.title.font.family': 'monospace',
                'ternary.aaxis.title.font.size': 16,
                'ternary.baxis.title.text': 'white chocolate',
                'ternary.baxis.title.font.color': 'blue',
                'ternary.baxis.title.font.family': 'sans-serif',
                'ternary.baxis.title.font.size': 10,
                'ternary.caxis.title': {
                    text: 'candy',
                    font: {
                        color: 'pink',
                        family: 'serif',
                        size: 30
                    }
                }
            });
        })
          .then(function() {
              _assert('a', 'chips', 'monospace', rgb('yellow'), 16);
              _assert('b', 'white chocolate', 'sans-serif', rgb('blue'), 10);
              _assert('c', 'candy', 'serif', rgb('pink'), 30);
          })
          .then(done, done.fail);
    });

    it('should be able to hide/show ticks and tick labels', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('../../image/mocks/ternary_simple.json'));

        function assertCnt(selector, expected, msg) {
            var sel = d3Select(gd).selectAll(selector);
            expect(sel.size()).toBe(expected, msg);
        }

        function toggle(selector, astr, vals, exps) {
            return function() {
                return Plotly.relayout(gd, astr, vals[0]).then(function() {
                    assertCnt(selector, exps[0], astr + ' ' + vals[0]);
                    return Plotly.relayout(gd, astr, vals[1]);
                })
                .then(function() {
                    assertCnt(selector, exps[1], astr + ' ' + vals[1]);
                    return Plotly.relayout(gd, astr, vals[0]);
                })
                .then(function() {
                    assertCnt(selector, exps[0], astr + ' ' + vals[0]);
                });
            };
        }

        Plotly.newPlot(gd, fig)
        .then(toggle(
            '.aaxis > .ytick > text', 'ternary.aaxis.showticklabels',
            [true, false], [4, 0]
        ))
        .then(toggle(
            '.baxis > .xtick > text', 'ternary.baxis.showticklabels',
            [true, false], [5, 0]
        ))
        .then(toggle(
            '.caxis > .ytick > text', 'ternary.caxis.showticklabels',
            [true, false], [4, 0]
        ))
        .then(toggle(
            '.aaxis > path.ytick', 'ternary.aaxis.ticks',
            ['outside', ''], [4, 0]
        ))
        .then(toggle(
            '.baxis > path.xtick', 'ternary.baxis.ticks',
            ['outside', ''], [5, 0]
        ))
        .then(toggle(
            '.caxis > path.ytick', 'ternary.caxis.ticks',
            ['outside', ''], [4, 0]
        ))
        .then(done, done.fail);
    });

    it('should render a-axis and c-axis with negative offsets', function(done) {
        var gd = createGraphDiv();

        Plotly.newPlot(gd, [{
            type: 'scatterternary',
            a: [2, 1, 1],
            b: [1, 2, 1],
            c: [1, 1, 2.12345]
        }], {
            ternary: {
                domain: {
                    x: [0.67, 1],
                    y: [0.5, 1]
                },
            },
            margin: {t: 25, l: 25, r: 25, b: 25},
            height: 450,
            width: 1000
        })
        .then(function() {
            var subplot = gd._fullLayout.ternary._subplot;
            expect(subplot.aaxis._offset < 0).toBe(true);
            expect(subplot.caxis._offset < 0).toBe(true);
        })
        .then(done, done.fail);
    });

    describe('plotly_relayouting', function() {
        ['pan', 'zoom'].forEach(function(dragmode) {
            it('should emit plotly_relayouting events on ' + dragmode, function(done) {
                var events = [];
                var path = [[350, 250], [375, 250], [375, 225]];
                var relayoutCallback;
                var fig = Lib.extendDeep({}, require('../../image/mocks/ternary_simple'));
                fig.layout.dragmode = dragmode;

                var gd = createGraphDiv();
                Plotly.newPlot(gd, fig)
                .then(function() {
                    relayoutCallback = jasmine.createSpy('relayoutCallback');
                    gd.on('plotly_relayout', relayoutCallback);
                    gd.on('plotly_relayouting', function(e) {
                        events.push(e);
                    });
                    return drag({path: path});
                })
                .then(function() {
                    expect(events.length).toEqual(path.length - 1);
                    expect(relayoutCallback).toHaveBeenCalledTimes(1);
                })
                .then(done, done.fail);
            });
        });
    });

    function countTernarySubplot() {
        return d3SelectAll('.ternary').size();
    }

    function countTraces(type) {
        return d3SelectAll('.ternary').selectAll('g.trace.' + type).size();
    }

    function assertRange(gd, expected) {
        var ternary = gd._fullLayout.ternary;
        var actual = [
            ternary.aaxis.min,
            ternary.baxis.min,
            ternary.caxis.min
        ];
        expect(actual).toBeCloseToArray(expected);
    }
});

describe('ternary plots when css transform is present', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    var mock = require('../../image/mocks/ternary_simple.json');
    var gd;

    function transformPlot(gd, transformString) {
        gd.style.webkitTransform = transformString;
        gd.style.MozTransform = transformString;
        gd.style.msTransform = transformString;
        gd.style.OTransform = transformString;
        gd.style.transform = transformString;
    }

    var cssTransform = 'translate(-25%, -25%) scale(0.5)';
    var scale = 0.5;
    var pointPos = [scale * 391, scale * 219];
    var blankPos = [scale * 200, scale * 200];

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockCopy = Lib.extendDeep({}, mock);

        Plotly.newPlot(gd, mockCopy.data, mockCopy.layout)
            .then(function() { transformPlot(gd, cssTransform); })
            .then(done);
    });

    it('should respond zoom drag interactions', function(done) {
        function assertRange(gd, expected) {
            var ternary = gd._fullLayout.ternary;
            var actual = [
                ternary.aaxis.min,
                ternary.baxis.min,
                ternary.caxis.min
            ];
            expect(actual).toBeCloseToArray(expected);
        }

        assertRange(gd, [0.231, 0.2, 0.11]);

        drag({path: [[scale * 383, scale * 213], [scale * 293, scale * 243]]})
        .then(function() { assertRange(gd, [0.4486, 0.2480, 0.1453]); })
        .then(function() { return doubleClick(pointPos[0], pointPos[1]); })
        .then(function() { assertRange(gd, [0, 0, 0]); })
        .then(done, done.fail);
    });

    it('should display to hover labels', function(done) {
        mouseEvent('mousemove', blankPos[0], blankPos[1]);
        assertHoverLabelContent([null, null], 'only on data points');

        function check(content, style, msg) {
            Lib.clearThrottle();
            mouseEvent('mousemove', pointPos[0], pointPos[1]);

            assertHoverLabelContent({nums: content}, msg);
            assertHoverLabelStyle(d3Select('g.hovertext'), style, msg);
        }

        check([
            'Component A: 0.5',
            'B: 0.25',
            'Component C: 0.25'
        ].join('\n'), {
            bgcolor: 'rgb(31, 119, 180)',
            bordercolor: 'rgb(255, 255, 255)',
            fontColor: 'rgb(255, 255, 255)',
            fontSize: 13,
            fontFamily: 'Arial'
        }, 'one label per data pt');

        Plotly.restyle(gd, {
            'hoverlabel.bordercolor': 'blue',
            'hoverlabel.font.family': [['Gravitas', 'Arial', 'Roboto']]
        })
        .then(function() {
            check([
                'Component A: 0.5',
                'B: 0.25',
                'Component C: 0.25'
            ].join('\n'), {
                bgcolor: 'rgb(31, 119, 180)',
                bordercolor: 'rgb(0, 0, 255)',
                fontColor: 'rgb(0, 0, 255)',
                fontSize: 13,
                fontFamily: 'Gravitas'
            }, 'after hoverlabel styling restyle call');

            return Plotly.restyle(gd, 'hoverinfo', [['a', 'b+c', 'b']]);
        })
        .then(function() {
            check('Component A: 0.5', {
                bgcolor: 'rgb(31, 119, 180)',
                bordercolor: 'rgb(0, 0, 255)',
                fontColor: 'rgb(0, 0, 255)',
                fontSize: 13,
                fontFamily: 'Gravitas'
            }, 'after hoverlabel styling restyle call');
        })
        .then(done, done.fail);
    });

    it('should respond to hover interactions by', function() {
        var hoverCnt = 0;
        var unhoverCnt = 0;

        var hoverData, unhoverData;

        gd.on('plotly_hover', function(eventData) {
            hoverCnt++;
            hoverData = eventData.points[0];
        });

        gd.on('plotly_unhover', function(eventData) {
            unhoverCnt++;
            unhoverData = eventData.points[0];
        });

        mouseEvent('mousemove', blankPos[0], blankPos[1]);
        expect(hoverData).toBe(undefined, 'not firing on blank points');
        expect(unhoverData).toBe(undefined, 'not firing on blank points');

        mouseEvent('mousemove', pointPos[0], pointPos[1]);
        expect(hoverData).not.toBe(undefined, 'firing on data points');
        expect(Object.keys(hoverData).sort()).toEqual(SORTED_EVENT_KEYS, 'returning the correct event data keys');
        expect(hoverData.curveNumber).toEqual(0, 'returning the correct curve number');
        expect(hoverData.pointNumber).toEqual(0, 'returning the correct point number');

        mouseEvent('mouseout', pointPos[0], pointPos[1]);
        expect(unhoverData).not.toBe(undefined, 'firing on data points');
        expect(Object.keys(unhoverData).sort()).toEqual(SORTED_EVENT_KEYS, 'returning the correct event data keys');
        expect(unhoverData.curveNumber).toEqual(0, 'returning the correct curve number');
        expect(unhoverData.pointNumber).toEqual(0, 'returning the correct point number');

        expect(hoverCnt).toEqual(1);
        expect(unhoverCnt).toEqual(1);
    });

    it('should respond to click interactions by', function() {
        var ptData;

        gd.on('plotly_click', function(eventData) {
            ptData = eventData.points[0];
        });

        click(blankPos[0], blankPos[1]);
        expect(ptData).toBe(undefined, 'not firing on blank points');

        click(pointPos[0], pointPos[1]);
        expect(ptData).not.toBe(undefined, 'firing on data points');
        expect(Object.keys(ptData).sort()).toEqual(SORTED_EVENT_KEYS, 'returning the correct event data keys');
        expect(ptData.curveNumber).toEqual(0, 'returning the correct curve number');
        expect(ptData.pointNumber).toEqual(0, 'returning the correct point number');
    });
});

describe('ternary spikelines', function() {
    'use strict';

    var gd;

    var data = [{
        type: 'scatterternary',
        mode: 'markers',
        a: [49],
        b: [43],
        c: [8]
    }];

    var layout = {
        ternary: {
            sum: 100,
            aaxis: {showspikes: true, spikecolor: '#444', hoverformat: '.1f'},
            baxis: {showspikes: true, hoverformat: '.1f'},
            caxis: {showspikes: true, hoverformat: '.1f'},
        }
    };

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function hoverAt(xval, yval, subplot) {
        Lib.clearThrottle();
        Plotly.Fx.hover(gd, {xval: xval, yval: yval}, subplot || 'ternary');
    }

    it('draws toaxis spikes and labels for all three axes and removes them on unhover', function(done) {
        Plotly.newPlot(gd, data, layout).then(function() {
            // x = c - b = 8 - 43 = -35
            // y = a = 49
            hoverAt(-35, 49);

            var subplot = gd._fullLayout.ternary._subplot;
            var lines = gd.querySelectorAll('.ternary-spikes line');
            expect(lines.length).toBe(3);

            // spike intersections with each axis, expressed as fractions of subplot width/height.
            // fa = 49 / 100 = 0.49
            // fb = 43 / 100 = 0.43
            // fc = 8 / 100 = 0.08
            var axisEnds = [
                // [x fraction of subplot width, y fraction of subplot height]
                [0.245, 0.51], // aaxis: x = fa/2 = 0.245, y = 0.51
                [0.57, 1], // baxis: x = 1 - fb = 0.57, y = 1
                [0.54, 0.08] // caxis: x = (1 + fc) / 2 = 0.54, y = fc = 0.08
            ];

            // x1 = w * (fc + fa / 2)
            // y1 = h * (1 - fa)
            for(var i = 0; i < lines.length; i++) {
                expect(+lines[i].getAttribute('x1')).toBeCloseTo(subplot.w * 0.325, 5);
                expect(+lines[i].getAttribute('y1')).toBeCloseTo(subplot.h * 0.51, 5);
                expect(+lines[i].getAttribute('x2')).toBeCloseTo(subplot.w * axisEnds[i][0], 5);
                expect(+lines[i].getAttribute('y2')).toBeCloseTo(subplot.h * axisEnds[i][1], 5);
            }

            expect(Array.from(gd.querySelectorAll('.ternary-spikelabel text'), function(el) {
                return el.textContent;
            })).toEqual(['49.0', '43.0', '8.0']);

            var labels = gd.querySelectorAll('.ternary-spikelabel');

            for(var j = 0; j < labels.length; j++) {
                var transform = labels[j].transform.baseVal.consolidate().matrix;
                expect(transform.e).toBeCloseTo(+lines[j].getAttribute('x2'), 4);
                expect(transform.f).toBeCloseTo(+lines[j].getAttribute('y2'), 4);
            }

            Plotly.Fx.unhover(gd);
            expect(gd.querySelectorAll('.ternary-spikes').length).toBe(0);
        })
        .then(done, done.fail);
    });

    it('keeps redrawn spikes behind the hover label', function(done) {
        Plotly.newPlot(gd, data, layout).then(function() {
            hoverAt(-35, 49);
            expect(gd.querySelector('.hovertext')).not.toBeNull();

            hoverAt(-35, 49);

            var spikes = gd.querySelector('.ternary-spikes');
            var hoverLabel = gd.querySelector('.hovertext');
            expect(spikes.parentNode).toBe(hoverLabel.parentNode);
            expect(spikes.compareDocumentPosition(hoverLabel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        })
        .then(done, done.fail);
    });

    it('supports spikesnap "cursor" with axis minima and spikemode "across+marker"', function(done) {
        var options = Lib.extendDeep({}, layout, {
            ternary: {
                aaxis: {
                    min: 10,
                    spikesnap: 'cursor',
                    spikemode: 'across+marker',
                },
                // only observe A spike
                baxis: {min: 20, showspikes: false},
                caxis: {min: 5, showspikes: false},
            }
        });

        Plotly.newPlot(gd, data, options).then(function() {
            hoverAt(-10, 36);

            var subplot = gd._fullLayout.ternary._subplot;
            var line = gd.querySelector('.ternary-spikes line');
            expect(+line.getAttribute('x1')).toBeCloseTo(subplot.w * 0.8, 5);
            expect(+line.getAttribute('x2')).toBeCloseTo(subplot.w * 0.2, 5);
            expect(+line.getAttribute('y2')).toBeCloseTo(subplot.h * 0.6, 5);
            expect(gd.querySelectorAll('.ternary-spikes circle').length).toBe(1);
            expect(gd.querySelector('.ternary-spikelabel text').textContent).toBe('36.0');

            // this synthetic x/y axes position converts to an invalid ternary point.
            hoverAt(100, 90);
            expect(gd.querySelectorAll('.ternary-spikes').length).toBe(0);
        })
        .then(done, done.fail);
    });

    it('respects hoverdistance and spikedistance across spikesnap modes', function(done) {
        var options = Lib.extendDeep({}, layout, {
            hoverdistance: 1,
            spikedistance: 20,
            ternary: {
                aaxis: {spikesnap: 'hovered data'},
                baxis: {showspikes: false},
                caxis: {showspikes: false}
            }
        });

        var nearXVal;
        var farXVal;

        Plotly.newPlot(gd, data, options).then(function() {
            var subplot = gd._fullLayout.ternary._subplot;
            var pointPx = subplot.xaxis.c2p(-35);

            // keep the cursor outside hoverdistance but inside/outside spikedistance
            nearXVal = subplot.xaxis.p2c(pointPx + 15);
            farXVal = subplot.xaxis.p2c(pointPx + 30);

            hoverAt(nearXVal, 49);
            expect(gd.querySelectorAll('.hovertext').length).toBe(0);
            expect(gd.querySelectorAll('.ternary-spikes').length).toBe(0);

            return Plotly.relayout(gd, 'ternary.aaxis.spikesnap', 'data');
        })
        .then(function() {
            hoverAt(nearXVal, 49);
            expect(gd.querySelectorAll('.hovertext').length).toBe(0);
            expect(gd.querySelectorAll('.ternary-spikes line').length).toBe(1);

            return Plotly.relayout(gd, 'ternary.aaxis.spikesnap', 'cursor');
        })
        .then(function() {
            hoverAt(nearXVal, 49);
            expect(gd.querySelectorAll('.hovertext').length).toBe(0);
            expect(gd.querySelectorAll('.ternary-spikes line').length).toBe(1);

            hoverAt(farXVal, 49);
            expect(gd.querySelectorAll('.ternary-spikes').length).toBe(0);

            return Plotly.relayout(gd, 'spikedistance', 0);
        })
        .then(function() {
            hoverAt(nearXVal, 49);
            expect(gd.querySelectorAll('.ternary-spikes').length).toBe(0);
        })
        .then(done, done.fail);
    });

    it('clears spikes across ternary subplots and respects showspikes relayouts', function(done) {
        var traces = [
            data[0],
            Lib.extendDeep({}, data[0], {subplot: 'ternary2'})
        ];
        var options = Lib.extendDeep({}, layout, {
            ternary: {domain: {x: [0, 0.45]}},
            ternary2: {sum: 100, domain: {x: [0.55, 1]}}
        });

        Plotly.newPlot(gd, traces, options).then(function() {
            hoverAt(-35, 49, 'ternary');
            expect(gd.querySelectorAll('.ternary-spikes line').length).toBe(3);

            hoverAt(-35, 49, 'ternary2');
            expect(gd.querySelectorAll('.ternary-spikes').length).toBe(0);

            return Plotly.relayout(gd, 'ternary2.aaxis.showspikes', true);
        })
        .then(function() {
            hoverAt(-35, 49, 'ternary2');
            expect(gd.querySelectorAll('.ternary-spikes line').length).toBe(1);

            return Plotly.relayout(gd, 'ternary2.aaxis.showspikes', false);
        })
        .then(function() {
            hoverAt(-35, 49, 'ternary2');
            expect(gd.querySelectorAll('.ternary-spikes').length).toBe(0);
        })
        .then(done, done.fail);
    });

    it('clears ternary spikes when hovering a Cartesian subplot in the same figure', function(done) {
        var traces = [
            data[0],
            {type: 'scatter', mode: 'markers', x: [0], y: [0]}
        ];
        var options = Lib.extendDeep({}, layout, {
            ternary: {domain: {x: [0, 0.45]}},
            xaxis: {domain: [0.55, 1]},
            yaxis: {domain: [0, 1]}
        });

        Plotly.newPlot(gd, traces, options).then(function() {
            hoverAt(-35, 49, 'ternary');
            expect(gd.querySelectorAll('.ternary-spikes line').length).toBe(3);

            hoverAt(0, 0, 'xy');
            expect(gd.querySelectorAll('.ternary-spikes').length).toBe(0);
        })
        .then(done, done.fail);
    });

    it('uses the closest spike candidate across traces in the same ternary subplot', function(done) {
        var traces = [
            data[0],
            {
                type: 'scatterternary',
                mode: 'markers',
                a: [60],
                b: [25],
                c: [15]
            }
        ];
        var options = Lib.extendDeep({}, layout, {
            hoverdistance: 0, // no looking for data
            spikedistance: -1, // no cutoff (default)
            ternary: {
                aaxis: {spikesnap: 'data'},
                // only observe A spike
                baxis: {showspikes: false},
                caxis: {showspikes: false}
            }
        });

        Plotly.newPlot(gd, traces, options).then(function() {
            // x = c - b = 15 - 25 = -10
            // y = a = 60
            hoverAt(-10, 60);

            expect(gd.querySelectorAll('.hovertext').length).toBe(0);
            expect(gd.querySelectorAll('.ternary-spikes line').length).toBe(1);
            expect(gd.querySelector('.ternary-spikelabel text').textContent).toBe('60.0');
        })
        .then(done, done.fail);
    });
});

describe('ternary defaults', function() {
    'use strict';

    var layoutIn, layoutOut, fullData;

    beforeEach(function() {
        layoutOut = {
            font: { color: 'red' },
            _subplots: {ternary: ['ternary']}
        };

        // needs a ternary-ref in a trace in order to be detected
        fullData = [{ type: 'scatterternary', subplot: 'ternary' }];
    });

    it('should fill empty containers', function() {
        layoutIn = {};

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutIn).toEqual({ ternary: {} });
        expect(layoutOut.ternary.aaxis.type).toEqual('linear');
        expect(layoutOut.ternary.baxis.type).toEqual('linear');
        expect(layoutOut.ternary.caxis.type).toEqual('linear');
    });

    it('defaults spikes off and coerces each enabled axis independently', function() {
        layoutIn = {ternary: {
            aaxis: {showspikes: true},
            baxis: {showspikes: true, spikecolor: 'red', spikethickness: 2,
                spikedash: 'dot', spikemode: 'across+marker', spikesnap: 'cursor'},
            caxis: {spikecolor: 'blue'}
        }};
        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        var ternary = layoutOut.ternary;
        expect(ternary.aaxis.showspikes).toBe(true);
        expect(ternary.aaxis.spikesnap).toBe('hovered data');
        expect(ternary.aaxis.spikemode).toBe('toaxis');
        expect(ternary.aaxis.spikethickness).toBe(3);
        expect(ternary.aaxis.spikedash).toBe('dash');
        expect(ternary.baxis.spikecolor).toBe('red');
        expect(ternary.baxis.spikethickness).toBe(2);
        expect(ternary.baxis.spikedash).toBe('dot');
        expect(ternary.baxis.spikemode).toBe('across+marker');
        expect(ternary.baxis.spikesnap).toBe('cursor');
        expect(ternary.caxis.showspikes).toBe(false);
        expect(ternary.caxis.spikecolor).toBeUndefined();
    });

    it('should coerce \'min\' values to 0 and delete them for user data if they contradict', function() {
        layoutIn = {
            ternary: {
                aaxis: { min: 1 },
                baxis: { min: 1 },
                caxis: { min: 1 },
                sum: 2
            }
        };

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.ternary.aaxis.min).toEqual(0);
        expect(layoutOut.ternary.baxis.min).toEqual(0);
        expect(layoutOut.ternary.caxis.min).toEqual(0);
        expect(layoutOut.ternary.sum).toEqual(2);
        expect(layoutIn.ternary.aaxis.min).toBeUndefined();
        expect(layoutIn.ternary.baxis.min).toBeUndefined();
        expect(layoutIn.ternary.caxis.min).toBeUndefined();
    });

    it('should default \'title\' to Component + _name', function() {
        layoutIn = {};

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.ternary.aaxis.title.text).toEqual('Component A');
        expect(layoutOut.ternary.baxis.title.text).toEqual('Component B');
        expect(layoutOut.ternary.caxis.title.text).toEqual('Component C');
    });

    it('should default \'gricolor\' to 60% dark', function() {
        layoutIn = {
            ternary: {
                aaxis: { showgrid: true, color: 'red' },
                baxis: { showgrid: true },
                caxis: { gridcolor: 'black' },
                bgcolor: 'blue'
            },
            paper_bgcolor: 'green'
        };

        supplyLayoutDefaults(layoutIn, layoutOut, fullData);
        expect(layoutOut.ternary.aaxis.gridcolor).toEqual('rgb(102, 0, 153)');
        expect(layoutOut.ternary.baxis.gridcolor).toEqual('rgb(27, 27, 180)');
        expect(layoutOut.ternary.caxis.gridcolor).toEqual('black');
    });
});


describe('Test event property of interactions on a ternary plot:', function() {
    var mock = require('../../image/mocks/ternary_simple.json');

    var mockCopy, gd;

    var blankPos = [10, 10];
    var pointPos;

    beforeAll(function(done) {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
        Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
            pointPos = getClientPosition('path.point');
            destroyGraphDiv();
            done();
        });
    });

    beforeEach(function() {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
    });

    afterEach(destroyGraphDiv);

    describe('click events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout)
            .then(function() {
                futureData = null;

                gd.on('plotly_click', function(data) {
                    futureData = data;
                });
            })
            .then(done);
        });

        it('should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1]);
            expect(futureData).toBe(null);
        });

        it('should contain the correct fields', function() {
            click(pointPos[0], pointPos[1]);

            var pt = futureData.points[0];
            var evt = futureData.event;

            expect(Object.keys(pt).sort()).toEqual(SORTED_EVENT_KEYS);

            expect(pt.curveNumber).toBe(0, 'points[0].curveNumber');
            expect(typeof pt.data).toBe(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toBe(typeof {}, 'points[0].fullData');
            expect(pt.pointNumber).toBe(0, 'points[0].pointNumber');
            expect(typeof pt.xaxis).toBe(typeof {}, 'points[0].xaxis');
            expect(typeof pt.yaxis).toBe(typeof {}, 'points[0].yaxis');
            expect(pt.a).toBe(0.5, 'points[0].a');
            expect(pt.b).toBe(0.25, 'points[0].b');
            expect(pt.c).toBe(0.25, 'points[0].c');

            expect(evt.clientX).toBe(pointPos[0], 'event.clientX');
            expect(evt.clientY).toBe(pointPos[1], 'event.clientY');
        });
    });

    describe('modified click events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout)
            .then(function() {
                futureData = null;

                gd.on('plotly_click', function(data) {
                    futureData = data;
                });
            })
            .then(done);
        });

        var modClickOpts = {
            altKey: true,
            ctrlKey: true, // this makes it effectively into a right-click
            metaKey: true,
            shiftKey: true,
            button: 0,
            cancelContext: true
        };
        var rightClickOpts = {
            altKey: false,
            ctrlKey: false,
            metaKey: false,
            shiftKey: false,
            button: 2,
            cancelContext: true
        };

        [modClickOpts, rightClickOpts].forEach(function(clickOpts, i) {
            it('should not be triggered when not on data points', function() {
                click(blankPos[0], blankPos[1], clickOpts);
                expect(futureData).toBe(null, i);
            });

            it('should not be triggered when not canceling context', function() {
                click(pointPos[0], pointPos[1], Lib.extendFlat({}, clickOpts, {cancelContext: false}));
                expect(futureData).toBe(null, i);
            });

            it('should contain the correct fields', function() {
                click(pointPos[0], pointPos[1], clickOpts);

                var pt = futureData.points[0];
                var evt = futureData.event;

                expect(Object.keys(pt).sort()).toEqual(SORTED_EVENT_KEYS);

                expect(pt.curveNumber).toBe(0, 'points[0].curveNumber: ' + i);
                expect(typeof pt.data).toBe(typeof {}, 'points[0].data: ' + i);
                expect(typeof pt.fullData).toBe(typeof {}, 'points[0].fullData: ' + i);
                expect(pt.pointNumber).toBe(0, 'points[0].pointNumber: ' + i);
                expect(typeof pt.xaxis).toBe(typeof {}, 'points[0].xaxis: ' + i);
                expect(typeof pt.yaxis).toBe(typeof {}, 'points[0].yaxis: ' + i);
                expect(pt.a).toBe(0.5, 'points[0].a: ' + i);
                expect(pt.b).toBe(0.25, 'points[0].b: ' + i);
                expect(pt.c).toBe(0.25, 'points[0].c: ' + i);

                expect(evt.clientX).toBe(pointPos[0], 'event.clientX: ' + i);
                expect(evt.clientY).toBe(pointPos[1], 'event.clientY: ' + i);
                Object.getOwnPropertyNames(clickOpts).forEach(function(opt) {
                    if(opt !== 'cancelContext') {
                        expect(evt[opt]).toBe(clickOpts[opt], 'event.' + opt + ': ' + i);
                    }
                });
            });
        });
    });

    describe('hover events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout)
            .then(function() {
                futureData = null;

                gd.on('plotly_hover', function(data) {
                    futureData = data;
                });
            })
            .then(done);
        });

        it('should contain the correct fields', function() {
            mouseEvent('mousemove', blankPos[0], blankPos[1]);
            mouseEvent('mousemove', pointPos[0], pointPos[1]);

            var pt = futureData.points[0];
            var evt = futureData.event;
            var xaxes0 = futureData.xaxes[0];
            var xvals0 = futureData.xvals[0];
            var yaxes0 = futureData.yaxes[0];
            var yvals0 = futureData.yvals[0];

            expect(Object.keys(pt).sort()).toEqual(SORTED_EVENT_KEYS);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            expect(typeof pt.xaxis).toEqual(typeof {}, 'points[0].xaxis');
            expect(typeof pt.yaxis).toEqual(typeof {}, 'points[0].yaxis');
            expect(pt.a).toEqual(0.5, 'points[0].a');
            expect(pt.b).toEqual(0.25, 'points[0].b');
            expect(pt.c).toEqual(0.25, 'points[0].c');

            expect(xaxes0).toEqual(pt.xaxis, 'xaxes[0]');
            expect(xvals0).toEqual(-0.0016654247744483342, 'xaxes[0]');
            expect(yaxes0).toEqual(pt.yaxis, 'yaxes[0]');
            expect(yvals0).toEqual(0.5013, 'xaxes[0]');

            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
        });
    });

    describe('unhover events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout)
            .then(function() {
                futureData = null;

                gd.on('plotly_unhover', function(data) {
                    futureData = data;
                });
            })
            .then(done);
        });

        it('should contain the correct fields', function() {
            mouseEvent('mousemove', blankPos[0], blankPos[1]);
            mouseEvent('mousemove', pointPos[0], pointPos[1]);
            mouseEvent('mouseout', pointPos[0], pointPos[1]);

            var pt = futureData.points[0];
            var evt = futureData.event;

            expect(Object.keys(pt).sort()).toEqual(SORTED_EVENT_KEYS);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            expect(typeof pt.xaxis).toEqual(typeof {}, 'points[0].xaxis');
            expect(typeof pt.yaxis).toEqual(typeof {}, 'points[0].yaxis');
            expect(pt.a).toEqual(0.5, 'points[0].a');
            expect(pt.b).toEqual(0.25, 'points[0].b');
            expect(pt.c).toEqual(0.25, 'points[0].c');

            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
        });
    });
});
