var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;

var Plotly = require('@lib/index');
var Fx = require('@src/components/fx');
var Lib = require('@src/lib');
var Drawing = require('@src/components/drawing');

var HOVERMINTIME = require('@src/components/fx').constants.HOVERMINTIME;
var MINUS_SIGN = require('@src/constants/numerical').MINUS_SIGN;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var click = require('../assets/click');
var delay = require('../assets/delay');
var doubleClick = require('../assets/double_click');

var touchEvent = require('../assets/touch_event');
var negateIf = require('../assets/negate_if');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;
var assertElemRightTo = customAssertions.assertElemRightTo;
var assertElemTopsAligned = customAssertions.assertElemTopsAligned;
var assertElemInside = customAssertions.assertElemInside;

function touch(path, options) {
    var len = path.length;
    Lib.clearThrottle();
    touchEvent('touchstart', path[0][0], path[0][1], options);

    path.slice(1, len).forEach(function(pt) {
        Lib.clearThrottle();
        touchEvent('touchmove', pt[0], pt[1], options);
    });

    touchEvent('touchend', path[len - 1][0], path[len - 1][1], options);
    return;
}

describe('Fx.hover:', function() {
    var gd;

    beforeEach(function() { gd = createGraphDiv(); });

    afterEach(destroyGraphDiv);

    it('should warn when passing subplot ids that are not part of the graph', function(done) {
        spyOn(Lib, 'warn');

        var data = [
            {y: [1], hoverinfo: 'y'}
        ];

        var layout = {
            xaxis: {domain: [0, 0.5]},
            xaxis2: {anchor: 'y2', domain: [0.5, 1]},
            yaxis2: {anchor: 'x2'},
            width: 400,
            height: 200,
            margin: {l: 0, t: 0, r: 0, b: 0},
            showlegend: false
        };

        Plotly.newPlot(gd, data, layout)
        .then(function() {
            Fx.hover(gd, {xpx: 300, ypx: 100}, 'x2y2');
            expect(gd._hoverdata).toBe(undefined, 'did not generate hoverdata');
            expect(Lib.warn).toHaveBeenCalledWith('Unrecognized subplot: x2y2');
        })
        .then(done, done.fail);
    });
});

describe('hover info', function() {
    'use strict';

    var mock = require('@mocks/14.json');
    var evt = { xpx: 355, ypx: 150 };

    afterEach(destroyGraphDiv);

    describe('hover info', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            assertHoverLabelContent({
                nums: '1',
                axis: '0.388'
            });
        });
    });

    describe('hover info x', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].hoverinfo = 'x';

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover x', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            assertHoverLabelContent({axis: '0.388'});
        });
    });

    describe('hover info y', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].hoverinfo = 'y';

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover y', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            assertHoverLabelContent({nums: '1'});
        });
    });

    describe('hover info text', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].text = [];
        // we convert newlines to spaces
        // see https://github.com/plotly/plotly.js/issues/746
        mockCopy.data[0].text[17] = 'hover\ntext\n\rwith\r\nspaces\n\nnot\rnewlines';
        mockCopy.data[0].hoverinfo = 'text';

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover text', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            assertHoverLabelContent({
                nums: 'hover text  with spaces  not newlines'
            });
        });
    });

    describe('hover info text with 0', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].text = [];
        // we treat number 0 as valid text
        // see https://github.com/plotly/plotly.js/issues/2660
        mockCopy.data[0].text[17] = 0;
        mockCopy.data[0].hoverinfo = 'text';
        mockCopy.data[0].mode = 'lines+markers+text';

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover text', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toBe(0);
            expect(hoverTrace.pointNumber).toBe(17);
            expect(hoverTrace.x).toBe(0.388);
            expect(hoverTrace.y).toBe(1);
            expect(hoverTrace.text).toBe(0);

            var txs = d3Select(gd).selectAll('.textpoint text');

            expect(txs.size()).toBe(1);

            txs.each(function() {
                expect(d3Select(this).text()).toBe('0');
            });

            assertHoverLabelContent({
                nums: '0'
            });
        });
    });

    describe('hover info all', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].text = [];
        mockCopy.data[0].text[17] = 'hover text';
        mockCopy.data[0].hoverinfo = 'all';

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover all', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            assertHoverLabelContent({
                nums: '1\nhover text',
                name: 'PV learning ...',
                axis: '0.388'
            });
        });
    });

    describe('hover info with bad name', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].text = [];
        mockCopy.data[0].text[17] = 'hover text';
        mockCopy.data[0].hoverinfo = 'all';
        mockCopy.data[0].name = '<img src=x onerror=y>';
        mockCopy.data.push({
            x: [0.002, 0.004],
            y: [12.5, 16.25],
            mode: 'lines+markers',
            name: 'another trace'
        });

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('cleans the name', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            assertHoverLabelContent({
                nums: '1\nhover text',
                name: '',
                axis: '0.388'
            });
        });
    });

    describe('hover info y on log axis', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].hoverinfo = 'y';
        // we do support superscripts in hover, but it's annoying to write
        // out all the tspan stuff here.
        mockCopy.layout.yaxis.exponentformat = 'e';

        beforeEach(function(done) {
            for(var i = 0; i < mockCopy.data[0].y.length; i++) {
                mockCopy.data[0].y[i] *= 1e9;
            }

            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover y', function() {
            Fx.hover('graph', evt, 'xy');

            assertHoverLabelContent({nums: '1e+9'});
        });
    });

    describe('hover info y+text', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].text = [];
        mockCopy.data[0].text[17] = 'hover text';
        mockCopy.data[0].hoverinfo = 'y+text';

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover y+text', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            assertHoverLabelContent({
                nums: '1\nhover text'
            });
        });
    });

    describe('hover info x+text', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].text = [];
        mockCopy.data[0].text[17] = 'hover text';
        mockCopy.data[0].hoverinfo = 'x+text';

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover x+text', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            assertHoverLabelContent({
                nums: 'hover text',
                axis: '0.388'
            });
        });
    });

    describe('hover error x text (log axis positive)', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].error_x = { array: [] };
        mockCopy.data[0].error_x.array[17] = 1;

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover x+text', function() {
            Fx.hover('graph', evt, 'xy');

            assertHoverLabelContent({
                nums: '1',
                axis: '0.388 ± 1'
            });
        });
    });

    describe('hover error text (log axis 0)', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].error_x = { array: [] };
        mockCopy.data[0].error_x.array[17] = 0;

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover x+text', function() {
            Fx.hover('graph', evt, 'xy');

            assertHoverLabelContent({
                nums: '1',
                axis: '0.388'
            });
        });
    });

    describe('hover error text (log axis negative)', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].error_x = { array: [] };
        mockCopy.data[0].error_x.array[17] = -1;

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover x+text', function() {
            Fx.hover('graph', evt, 'xy');

            assertHoverLabelContent({
                nums: '1',
                axis: '0.388'
            });
        });
    });

    describe('hover info text with html', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].text = [];
        mockCopy.data[0].text[17] = 'hover<br>text';
        mockCopy.data[0].hoverinfo = 'text';

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('responds to hover text with html', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            assertHoverLabelContent({
                nums: 'hover\ntext'
            });
        });
    });

    describe('hover info skip', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].hoverinfo = 'skip';

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('does not hover if hover info is set to skip', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            expect(gd._hoverdata, undefined);
            assertHoverLabelContent({});
        });
    });

    describe('hover info none', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].hoverinfo = 'none';

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('does not render if hover is set to none', function() {
            var gd = document.getElementById('graph');
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(17);
            expect(hoverTrace.x).toEqual(0.388);
            expect(hoverTrace.y).toEqual(1);

            assertHoverLabelContent({});
        });
    });

    describe('\'closest\' hover info (superimposed case)', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        // superimposed traces
        mockCopy.data.push(Lib.extendDeep({}, mockCopy.data[0]));
        mockCopy.layout.hovermode = 'closest';

        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        it('render hover labels of the above trace', function() {
            Fx.hover('graph', evt, 'xy');

            expect(gd._hoverdata.length).toEqual(1);

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.fullData.index).toEqual(1);
            expect(hoverTrace.curveNumber).toEqual(1);
            expect(hoverTrace.pointNumber).toEqual(16);
            expect(hoverTrace.x).toEqual(0.33);
            expect(hoverTrace.y).toEqual(1.25);

            assertHoverLabelContent({
                nums: '(0.33, 1.25)',
                name: 'PV learning ...'
            });
        });

        it('render only non-hoverinfo \'none\' hover labels', function(done) {
            Plotly.restyle(gd, 'hoverinfo', ['none', 'name']).then(function() {
                Fx.hover('graph', evt, 'xy');

                expect(gd._hoverdata.length).toEqual(1);

                var hoverTrace = gd._hoverdata[0];

                expect(hoverTrace.fullData.index).toEqual(1);
                expect(hoverTrace.curveNumber).toEqual(1);
                expect(hoverTrace.pointNumber).toEqual(16);
                expect(hoverTrace.x).toEqual(0.33);
                expect(hoverTrace.y).toEqual(1.25);

                assertHoverLabelContent({
                    nums: 'PV learning ...'
                });
            })
            .then(done, done.fail);
        });
    });

    function _hover(gd, xpx, ypx) {
        Fx.hover(gd, { xpx: xpx, ypx: ypx }, 'xy');
        Lib.clearThrottle();
    }

    function _hoverNatural(gd, xpx, ypx) {
        var gdBB = gd.getBoundingClientRect();
        var dragger = gd.querySelector('.nsewdrag');
        var clientX = xpx + gdBB.left + gd._fullLayout._size.l;
        var clientY = ypx + gdBB.top + gd._fullLayout._size.t;

        Fx.hover(gd, { clientX: clientX, clientY: clientY, target: dragger}, 'xy');
        Lib.clearThrottle();
    }

    describe('hover label order for stacked traces with zeros', function() {
        var gd;
        beforeEach(function() {
            gd = createGraphDiv();
        });

        it('puts the top trace on top', function(done) {
            Plotly.newPlot(gd, [
                {y: [1, 2, 3], type: 'bar', name: 'a'},
                {y: [2, 0, 1], type: 'bar', name: 'b'},
                {y: [1, 0, 1], type: 'bar', name: 'c'},
                {y: [2, 1, 0], type: 'bar', name: 'd'}
            ], {
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0},
                barmode: 'stack'
            })
            .then(function() {
                _hover(gd, 250, 250);
                assertHoverLabelContent({
                    nums: ['2', '0', '0', '1'],
                    name: ['a', 'b', 'c', 'd'],
                    // a, b, c are all in the same place but keep their order
                    // d is included mostly as a sanity check
                    vOrder: [3, 2, 1, 0],
                    axis: '1'
                });

                // reverse the axis, labels should reverse
                return Plotly.relayout(gd, 'yaxis.range', gd.layout.yaxis.range.slice().reverse());
            })
            .then(function() {
                _hover(gd, 250, 250);
                assertHoverLabelContent({
                    nums: ['2', '0', '0', '1'],
                    name: ['a', 'b', 'c', 'd'],
                    vOrder: [0, 1, 2, 3],
                    axis: '1'
                });
            })
            .then(done, done.fail);
        });

        it('puts the right trace on the right', function(done) {
            Plotly.newPlot(gd, [
                {x: [1, 2, 3], type: 'bar', name: 'a', orientation: 'h'},
                {x: [2, 0, 1], type: 'bar', name: 'b', orientation: 'h'},
                {x: [1, 0, 1], type: 'bar', name: 'c', orientation: 'h'},
                {x: [2, 1, 0], type: 'bar', name: 'd', orientation: 'h'}
            ], {
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0},
                barmode: 'stack'
            })
            .then(function() {
                _hover(gd, 250, 250);
                assertHoverLabelContent({
                    nums: ['2', '0', '0', '1'],
                    name: ['a', 'b', 'c', 'd'],
                    // a, b, c are all in the same place but keep their order
                    // d is included mostly as a sanity check
                    hOrder: [3, 2, 1, 0],
                    axis: '1'
                });

                // reverse the axis, labels should reverse
                return Plotly.relayout(gd, 'xaxis.range', gd.layout.xaxis.range.slice().reverse());
            })
            .then(function() {
                _hover(gd, 250, 250);
                assertHoverLabelContent({
                    nums: ['2', '0', '0', '1'],
                    name: ['a', 'b', 'c', 'd'],
                    hOrder: [0, 1, 2, 3],
                    axis: '1'
                });
            })
            .then(done, done.fail);
        });
    });

    describe('hover info for x/y/z traces', function() {
        var gd;
        beforeEach(function() {
            gd = createGraphDiv();
        });

        it('should display correct label content', function(done) {
            Plotly.newPlot(gd, [{
                type: 'heatmap',
                y: [0, 1],
                z: [[1, 2, 3], [2, 2, 1]],
                name: 'one',
            }, {
                type: 'heatmap',
                y: [2, 3],
                z: [[1, 2, 3], [2, 2, 1]],
                name: 'two'
            }], {
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                _hover(gd, 250, 100);
                assertHoverLabelContent({
                    nums: 'x: 1\ny: 3\nz: 2',
                    name: 'two'
                });

                _hover(gd, 250, 300);
                assertHoverLabelContent({
                    nums: 'x: 1\ny: 1\nz: 2',
                    name: 'one'
                });
            })
            .then(function() {
                return Plotly.restyle(gd, 'hovertext', [
                    [['A', 'B', 'C'], ['X', 'Y', 'Z']]
                ], [1]);
            })
            .then(function() {
                _hover(gd, 250, 100);
                assertHoverLabelContent({
                    nums: 'x: 1\ny: 3\nz: 2\nY',
                    name: 'two'
                });
            })
            .then(done, done.fail);
        });

        it('should display correct label content with specified format - heatmap', function(done) {
            Plotly.newPlot(gd, [{
                type: 'heatmap',
                y: [0, 1],
                z: [[1.11111, 2.2222, 3.33333], [4.44444, 5.55555, 6.66666]],
                name: 'one',
                zhoverformat: '.2f',
                showscale: false
            }, {
                type: 'heatmap',
                y: [2, 3],
                z: [[1, 2, 3], [2, 2, 1]],
                name: 'two',
                showscale: false
            }], {
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                _hover(gd, 250, 100);
                assertHoverLabelContent({
                    nums: 'x: 1\ny: 3\nz: 2',
                    name: 'two'
                });

                _hover(gd, 250, 300);
                assertHoverLabelContent({
                    nums: 'x: 1\ny: 1\nz: 5.56',
                    name: 'one'
                });
            })
            .then(done, done.fail);
        });

        it('provides exponents correctly for z data', function(done) {
            function expFmt(val, exp) {
                return val + '×10\u200b<tspan style="font-size:70%" dy="-0.6em">' +
                    (exp < 0 ? MINUS_SIGN + -exp : exp) +
                    '</tspan><tspan dy="0.42em">\u200b</tspan>';
            }
            Plotly.newPlot(gd, [{
                type: 'heatmap',
                y: [0, 1, 2, 3],
                z: [
                    [-1.23456789e23, -1e10, -1e4],
                    [-1e-2, -1e-8, 0],
                    [1.23456789e-23, 1e-8, 1e-2],
                    [123.456789, 1.23456789e10, 1e23]
                ],
                showscale: false
            }], {
                width: 600,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                [
                    [expFmt(MINUS_SIGN + '1.234568', 23), MINUS_SIGN + '10B', MINUS_SIGN + '10k'],
                    [MINUS_SIGN + '0.01', MINUS_SIGN + '10n', '0'],
                    [expFmt('1.234568', -23), '10n', '0.01'],
                    ['123.4568', '12.34568B', expFmt('1', 23)]
                ]
                .forEach(function(row, y) {
                    row.forEach(function(zVal, x) {
                        _hover(gd, (x + 0.5) * 200, (3.5 - y) * 100);
                        assertHoverLabelContent({nums: 'x: ' + x + '\ny: ' + y + '\nz: ' + zVal}, zVal);
                    });
                });
            })
            .then(done, done.fail);
        });

        it('should display correct label content with specified format - contour', function(done) {
            Plotly.newPlot(gd, [{
                type: 'contour',
                y: [0, 1],
                z: [[1.11111, 2.2222, 3.33333], [4.44444, 5.55555, 6.66666]],
                name: 'one',
                zhoverformat: '.2f',
                showscale: false
            }, {
                type: 'contour',
                y: [2, 3],
                z: [[1, 2, 3], [2, 2, 1]],
                name: 'two',
                showscale: false
            }], {
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                _hover(gd, 250, 50);
                assertHoverLabelContent({
                    nums: 'x: 1\ny: 3\nz: 2',
                    name: 'two'
                });

                _hover(gd, 250, 300);
                assertHoverLabelContent({
                    nums: 'x: 1\ny: 1\nz: 5.56',
                    name: 'one'
                });
            })
            .then(function() {
                return Plotly.restyle(gd, 'hovertext', [
                    [['A', 'B', 'C'], ['X', 'Y', 'Z']]
                ]);
            })
            .then(function() {
                _hover(gd, 250, 50);
                assertHoverLabelContent({
                    nums: 'x: 1\ny: 3\nz: 2\nY',
                    name: 'two'
                });
            })
            .then(function() {
                return Plotly.restyle(gd, 'hovertemplate', '(%{x},%{y}) -- %{z}<extra>trace %{data.name}</extra>');
            })
            .then(function() {
                _hover(gd, 250, 50);
                assertHoverLabelContent({
                    nums: '(1,3) -- 2',
                    name: 'trace two'
                });

                _hover(gd, 250, 300);
                assertHoverLabelContent({
                    nums: '(1,1) -- 5.56',
                    name: 'trace one'
                });
            })
            .then(function() {
                return Plotly.restyle(gd, 'hoverlabel.namelength', 2);
            })
            .then(function() {
                _hover(gd, 250, 50);
                assertHoverLabelContent({
                    nums: '(1,3) -- 2',
                    name: 'tr'
                });

                _hover(gd, 250, 300);
                assertHoverLabelContent({
                    nums: '(1,1) -- 5.56',
                    name: 'tr'
                });
            })
            .then(function() {
                var nl = [[0, 0, 0], [0, 0, 0]];
                return Plotly.restyle(gd, 'hoverlabel.namelength', [nl, nl]);
            })
            .then(function() {
                _hover(gd, 250, 50);
                assertHoverLabelContent({
                    nums: '(1,3) -- 2',
                    name: ''
                });

                _hover(gd, 250, 300);
                assertHoverLabelContent({
                    nums: '(1,1) -- 5.56',
                    name: ''
                });
            })
            .then(function() {
                return Plotly.restyle(gd, 'hovertemplate', null);
            })
            .then(function() {
                _hover(gd, 250, 50);
                assertHoverLabelContent({
                    nums: 'x: 1\ny: 3\nz: 2\nY',
                    name: ''
                });

                _hover(gd, 250, 300);
                assertHoverLabelContent({
                    nums: 'x: 1\ny: 1\nz: 5.56\nY',
                    name: ''
                });
            })
            .then(done, done.fail);
        });

        it('should get the right content and color for contour constraints', function(done) {
            var contourConstraints = require('@mocks/contour_constraints.json');

            Plotly.newPlot(gd, contourConstraints)
            .then(function() {
                _hover(gd, 250, 250);
                assertHoverLabelContent({
                    nums: [
                        'x: 1\ny: 1\nz: 3.00', // custom zhoverformat
                        'x: 1\ny: 1\nz: 3',
                        'x: 1\ny: 1\nz: 10',
                        'x: 1\ny: 1\nz: 10',
                        'x: 1\ny: 1\nz: 10',
                        'x: 1\ny: 1\nz: 10',
                        'x: 1\ny: 1\nz: 10'
                    ],
                    name: ['[2, 4]', '=3.0001', '&gt;1', '&gt;0.25', ']6, 7[', '&lt;8', ']3, 4[']
                });
                var styles = [{
                    // This first one has custom styles. The others all inherit from trace styles.
                    bgcolor: 'rgb(200, 200, 200)',
                    bordercolor: 'rgb(0, 0, 100)',
                    fontSize: 20,
                    fontFamily: 'Arial',
                    fontColor: 'rgb(0, 100, 200)'
                }, {
                    bgcolor: 'rgb(255, 127, 14)',
                    bordercolor: 'rgb(68, 68, 68)',
                    fontSize: 13,
                    fontFamily: 'Arial',
                    fontColor: 'rgb(68, 68, 68)'
                }, {
                    bgcolor: 'rgb(0, 200, 0)',
                    bordercolor: 'rgb(255, 255, 255)',
                    fontSize: 13,
                    fontFamily: 'Arial',
                    fontColor: 'rgb(255, 255, 255)'
                }, {
                    bgcolor: 'rgb(150, 0, 0)',
                    bordercolor: 'rgb(255, 255, 255)',
                    fontSize: 13,
                    fontFamily: 'Arial',
                    fontColor: 'rgb(255, 255, 255)'
                }, {
                    bgcolor: 'rgb(150, 0, 200)',
                    bordercolor: 'rgb(255, 255, 255)',
                    fontSize: 13,
                    fontFamily: 'Arial',
                    fontColor: 'rgb(255, 255, 255)'
                }, {
                    bgcolor: 'rgb(140, 86, 75)',
                    bordercolor: 'rgb(255, 255, 255)',
                    fontSize: 13,
                    fontFamily: 'Arial',
                    fontColor: 'rgb(255, 255, 255)'
                }, {
                    bgcolor: 'rgb(227, 119, 194)',
                    bordercolor: 'rgb(68, 68, 68)',
                    fontSize: 13,
                    fontFamily: 'Arial',
                    fontColor: 'rgb(68, 68, 68)'
                }];
                d3SelectAll('g.hovertext').each(function(_, i) {
                    assertHoverLabelStyle(d3Select(this), styles[i]);
                });
            })
            .then(done, done.fail);
        });

        it('should display correct label content with specified format - histogram2dcontour', function(done) {
            Plotly.newPlot(gd, [{
                type: 'histogram2dcontour',
                x: [0, 1, 2, 0, 1, 2, 1],
                y: [0, 0, 0, 1, 1, 1, 1],
                z: [1.11111, 2.2222, 3.3333, 4.4444, 4.4444, 6.6666, 1.1111],
                histfunc: 'sum',
                name: 'one',
                zhoverformat: '.2f',
                showscale: false
            }, {
                type: 'histogram2dcontour',
                x: [0, 1, 2, 0, 1, 2, 1, 2, 0, 1, 2],
                y: [2, 2, 2, 3, 3, 3, 2, 2, 3, 3, 2],
                name: 'two',
                showscale: false
            }], {
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                _hover(gd, 250, 50);
                assertHoverLabelContent({
                    nums: 'x: 1\ny: 3\nz: 2',
                    name: 'two'
                });

                _hover(gd, 250, 270);
                assertHoverLabelContent({
                    nums: [
                        'x: 1\ny: 1\nz: 5.56',
                        'x: 1\ny: 1\nz: 0'
                    ],
                    name: [
                        'one',
                        'two'
                    ]
                });
            })
            .then(function() {
                return Plotly.restyle(gd, 'hovertemplate', 'f(%{x:.1f}, %{y:.1f})=%{z}<extra></extra>');
            })
            .then(function() {
                _hover(gd, 250, 50);
                assertHoverLabelContent({
                    nums: 'f(1.0, 3.0)=2',
                    name: ''
                });

                _hover(gd, 250, 270);
                assertHoverLabelContent({
                    nums: ['f(1.0, 1.0)=5.56', 'f(1.0, 1.0)=0'],
                    name: ['', '']
                });
            })
            .then(done, done.fail);
        });

        it('should display correct label - x/y/z heatmap|contour', function(done) {
            Plotly.newPlot(gd, [{
                type: 'heatmap',
                x: [1, 1, 2, 2],
                y: [1, 2, 1, 2],
                z: [1, 2, 3, 4],
                customdata: ['a', 'b', 'c', 'd'],
                ids: ['A', 'B', 'C', 'D'],
                hovertemplate: '%{customdata} | %{id}<extra>%{data.type}: %{pointNumber}</extra>'
            }], {
                width: 400,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                _hover(gd, 50, 50);
                assertHoverLabelContent({
                    nums: 'b | B',
                    name: 'heatmap: 1'
                });

                _hover(gd, 250, 300);
                assertHoverLabelContent({
                    nums: 'c | C',
                    name: 'heatmap: 2'
                });
            })
            .then(function() { return Plotly.restyle(gd, 'type', 'contour'); })
            .then(function() {
                _hover(gd, 50, 50);
                assertHoverLabelContent({
                    nums: 'b | B',
                    name: 'contour: 1'
                });

                _hover(gd, 250, 300);
                assertHoverLabelContent({
                    nums: 'c | C',
                    name: 'contour: 2'
                });
            })
            .then(done, done.fail);
        });
    });

    describe('hover info for negative data on a log axis', function() {
        it('shows negative data even though it is infinitely off-screen', function(done) {
            var gd = createGraphDiv();

            Plotly.newPlot(gd, [{x: [1, 2, 3], y: [1, -5, 10]}], {
                yaxis: {type: 'log'},
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                _hover(gd, 250, 200);
                assertHoverLabelContent({
                    nums: '\u22125', // unicode minus
                    axis: '2'
                });
            })
            .then(done, done.fail);
        });
    });

    describe('histogram hover info', function() {
        it('shows the data range when bins have multiple values', function(done) {
            var gd = createGraphDiv();

            Plotly.newPlot(gd, [{
                x: [0, 2, 3, 4, 5, 6, 7],
                xbins: {start: -0.5, end: 8.5, size: 3},
                type: 'histogram'
            }], {
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                var pts = null;
                gd.once('plotly_hover', function(e) { pts = e.points; });

                _hoverNatural(gd, 250, 200);
                assertHoverLabelContent({nums: '3', axis: '3 - 5'});
                if(pts === null) fail('no hover evt triggered');
                expect(pts.length).toBe(1);

                var pt = pts[0];
                expect(pt.curveNumber).toBe(0);
                expect(pt.binNumber).toBe(1);
                expect(pt.pointNumbers).toEqual([2, 3, 4]);
                expect(pt.x).toBe(4);
                expect(pt.y).toBe(3);
                expect(pt.data).toBe(gd.data[0]);
                expect(pt.fullData).toBe(gd._fullData[0]);
                expect(pt.xaxis).toBe(gd._fullLayout.xaxis);
                expect(pt.yaxis).toBe(gd._fullLayout.yaxis);
            })
            .then(function() {
                var pts = null;
                gd.once('plotly_hover', function(e) { pts = e.points; });

                _hoverNatural(gd, 250, 200);
                expect(pts).toBe(null, 'should not emit hover event on same pt');
            })
            .then(function() {
                var pts = null;
                gd.once('plotly_hover', function(e) { pts = e.points; });

                _hoverNatural(gd, 350, 200);
                assertHoverLabelContent({nums: '2', axis: '6 - 8'});
                expect(pts.length).toBe(1);

                var pt = pts[0];
                expect(pt.curveNumber).toBe(0);
                expect(pt.binNumber).toBe(2);
                expect(pt.pointNumbers).toEqual([5, 6]);
                expect(pt.x).toBe(7);
                expect(pt.y).toBe(2);
                expect(pt.data).toBe(gd.data[0]);
                expect(pt.fullData).toBe(gd._fullData[0]);
                expect(pt.xaxis).toBe(gd._fullLayout.xaxis);
                expect(pt.yaxis).toBe(gd._fullLayout.yaxis);
            })
            .then(done, done.fail);
        });

        it('shows the exact data when bins have single values', function(done) {
            var gd = createGraphDiv();

            Plotly.newPlot(gd, [{
                // even though the data aren't regularly spaced, each bin only has
                // one data value in it so we see exactly that value
                x: [0, 0, 3.3, 3.3, 3.3, 7, 7],
                xbins: {start: -0.5, end: 8.5, size: 3},
                type: 'histogram'
            }], {
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                _hover(gd, 250, 200);
                assertHoverLabelContent({
                    nums: '3',
                    axis: '3.3'
                });
            })
            .then(function() { return Plotly.restyle(gd, 'hovertext', 'LOOK'); })
            .then(function() {
                _hover(gd, 250, 200);
                assertHoverLabelContent({
                    nums: '3\nLOOK',
                    axis: '3.3'
                });
            })
            .then(done, done.fail);
        });

        it('will show a category range if you ask nicely', function(done) {
            var gd = createGraphDiv();

            Plotly.newPlot(gd, [{
                // even though the data aren't regularly spaced, each bin only has
                // one data value in it so we see exactly that value
                x: [
                    'bread', 'cheese', 'artichokes', 'soup', 'beans', 'nuts',
                    'pizza', 'potatoes', 'burgers', 'beans', 'beans', 'beans'
                ],
                xbins: {start: -0.5, end: 8.5, size: 3},
                type: 'histogram'
            }], {
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                _hover(gd, 250, 200);
                assertHoverLabelContent({
                    nums: '6',
                    axis: 'soup - nuts'
                });
            })
            .then(done, done.fail);
        });
    });

    ['candlestick', 'ohlc'].forEach(function(type) {
        describe(type + ' hoverinfo', function() {
            var gd;

            function financeMock(traceUpdates, layoutUpdates) {
                return {
                    data: [Lib.extendFlat({}, {
                        type: type,
                        x: ['2011-01-01', '2011-01-02', '2011-01-03'],
                        open: [1, 2, 3],
                        high: [3, 4, 5],
                        low: [0, 1, 2],
                        close: [0, 3, 2]
                    }, traceUpdates || {})],
                    layout: Lib.extendDeep({}, {
                        width: 400,
                        height: 400,
                        margin: {l: 50, r: 50, t: 50, b: 50}
                    }, layoutUpdates || {})
                };
            }

            beforeEach(function() {
                gd = createGraphDiv();
            });

            it('has the right basic and event behavior', function(done) {
                var pts;
                Plotly.newPlot(gd, financeMock({
                    customdata: [11, 22, 33]
                }))
                .then(function() {
                    gd.on('plotly_hover', function(e) { pts = e.points; });

                    _hoverNatural(gd, 150, 150);
                    assertHoverLabelContent({
                        nums: 'open: 2\nhigh: 4\nlow: 1\nclose: 3  ▲',
                        axis: 'Jan 2, 2011'
                    });
                })
                .then(function() {
                    expect(pts).toBeDefined();
                    expect(pts.length).toBe(1);
                    expect(pts[0]).toEqual(jasmine.objectContaining({
                        x: '2011-01-02',
                        open: 2,
                        high: 4,
                        low: 1,
                        close: 3,
                        customdata: 22,
                        curveNumber: 0,
                        pointNumber: 1,
                        data: gd.data[0],
                        fullData: gd._fullData[0],
                        xaxis: gd._fullLayout.xaxis,
                        yaxis: gd._fullLayout.yaxis
                    }));

                    return Plotly.relayout(gd, {hovermode: 'closest'});
                })
                .then(function() {
                    _hoverNatural(gd, 150, 150);
                    assertHoverLabelContent({
                        nums: 'Jan 2, 2011\nopen: 2\nhigh: 4\nlow: 1\nclose: 3  ▲'
                    });
                })
                .then(done, done.fail);
            });

            it('shows correct labels in split mode', function(done) {
                var pts;
                Plotly.newPlot(gd, financeMock({
                    customdata: [11, 22, 33],
                    hoverlabel: {
                        split: true
                    }
                }))
                .then(function() {
                    gd.on('plotly_hover', function(e) { pts = e.points; });

                    _hoverNatural(gd, 150, 150);
                    assertHoverLabelContent({
                        nums: ['high: 4', 'open: 2', 'close: 3', 'low: 1'],
                        name: ['', '', '', ''],
                        axis: 'Jan 2, 2011'
                    });
                })
                .then(function() {
                    expect(pts).toBeDefined();
                    expect(pts.length).toBe(4);
                    expect(pts[0]).toEqual(jasmine.objectContaining({
                        x: '2011-01-02',
                        high: 4,
                        customdata: 22,
                    }));
                    expect(pts[1]).toEqual(jasmine.objectContaining({
                        x: '2011-01-02',
                        open: 2,
                        customdata: 22,
                    }));
                    expect(pts[2]).toEqual(jasmine.objectContaining({
                        x: '2011-01-02',
                        close: 3,
                        customdata: 22,
                    }));
                    expect(pts[3]).toEqual(jasmine.objectContaining({
                        x: '2011-01-02',
                        low: 1,
                        customdata: 22,
                    }));
                })
                .then(function() {
                    _hoverNatural(gd, 200, 150);
                    assertHoverLabelContent({
                        nums: ['high: 5', 'open: 3', 'close: 2\nlow: 2'],
                        name: ['', '', ''],
                        axis: 'Jan 3, 2011'
                    });
                })
                .then(done, done.fail);
            });

            it('shows text iff text is in hoverinfo', function(done) {
                Plotly.newPlot(gd, financeMock({text: ['A', 'B', 'C']}))
                .then(function() {
                    _hover(gd, 150, 150);
                    assertHoverLabelContent({
                        nums: 'open: 2\nhigh: 4\nlow: 1\nclose: 3  ▲\nB',
                        axis: 'Jan 2, 2011'
                    });

                    return Plotly.restyle(gd, {hoverinfo: 'x+text'});
                })
                .then(function() {
                    _hover(gd, 150, 150);
                    assertHoverLabelContent({
                        nums: 'B',
                        axis: 'Jan 2, 2011'
                    });

                    return Plotly.restyle(gd, {hoverinfo: 'x+y'});
                })
                .then(function() {
                    _hover(gd, 150, 150);
                    assertHoverLabelContent({
                        nums: 'open: 2\nhigh: 4\nlow: 1\nclose: 3  ▲',
                        axis: 'Jan 2, 2011'
                    });
                })
                .then(done, done.fail);
            });
        });
    });

    describe('hoverformat', function() {
        var data = [{
            x: [1, 2, 3],
            y: [0.12345, 0.23456, 0.34567]
        }];
        var layout = {
            yaxis: { showticklabels: true, hoverformat: ',.2r' },
            width: 600,
            height: 400
        };

        beforeEach(function() {
            this.gd = createGraphDiv();
        });

        it('should display the correct format when ticklabels true', function(done) {
            Plotly.newPlot(this.gd, data, layout)
            .then(function() {
                mouseEvent('mousemove', 303, 213);

                assertHoverLabelContent({
                    nums: '0.23',
                    axis: '2'
                });
            })
            .then(done, done.fail);
        });

        it('should display the correct format when ticklabels false', function(done) {
            layout.yaxis.showticklabels = false;
            Plotly.newPlot(this.gd, data, layout)
            .then(function() {
                mouseEvent('mousemove', 303, 213);

                assertHoverLabelContent({
                    nums: '0.23',
                    axis: '2'
                });
            })
            .then(done, done.fail);
        });
    });

    describe('textmode', function() {
        var data = [{
            x: [1, 2, 3, 4],
            y: [2, 3, 4, 5],
            mode: 'text',
            hoverinfo: 'text',
            text: ['test', null, 42, undefined]
        }];
        var layout = {
            width: 600,
            height: 400
        };

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), data, layout).then(done);
        });

        it('should show text labels', function() {
            mouseEvent('mousemove', 108, 303);
            assertHoverLabelContent({
                nums: 'test'
            });
        });

        it('should show number labels', function() {
            mouseEvent('mousemove', 363, 173);
            assertHoverLabelContent({
                nums: '42'
            });
        });

        it('should not show null text labels', function() {
            mouseEvent('mousemove', 229, 239);
            assertHoverLabelContent({});
        });

        it('should not show undefined text labels', function() {
            mouseEvent('mousemove', 493, 108);
            assertHoverLabelContent({});
        });
    });

    describe('hover events', function() {
        var data = [{x: [1, 2, 3], y: [1, 3, 2], type: 'bar'}];
        var layout = {width: 600, height: 400};
        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.newPlot(gd, data, layout).then(done);
        });

        it('should skip the hover event if explicitly instructed', function(done) {
            var hoverHandler = jasmine.createSpy();
            gd.on('plotly_hover', hoverHandler);

            var gdBB = gd.getBoundingClientRect();
            var event = {clientX: gdBB.left + 300, clientY: gdBB.top + 200};

            Promise.resolve().then(function() {
                Fx.hover(gd, event, 'xy', true);
            })
            .then(function() {
                expect(hoverHandler).not.toHaveBeenCalled();
            })
            .then(done, done.fail);
        });

        it('should emit events only if the event looks user-driven', function(done) {
            var hoverHandler = jasmine.createSpy();
            gd.on('plotly_hover', hoverHandler);

            var gdBB = gd.getBoundingClientRect();
            var event = {clientX: gdBB.left + 300, clientY: gdBB.top + 200};

            Promise.resolve().then(function() {
                Fx.hover(gd, event, 'xy');
            })
            .then(delay(HOVERMINTIME * 1.1))
            .then(function() {
                Fx.unhover(gd);
            })
            .then(function() {
                expect(hoverHandler).not.toHaveBeenCalled();
                var dragger = gd.querySelector('.nsewdrag');

                Fx.hover(gd, Lib.extendFlat({target: dragger}, event), 'xy');
            })
            .then(function() {
                expect(hoverHandler).toHaveBeenCalledTimes(1);
            })
            .then(done, done.fail);
        });
    });

    describe('overflowing hover labels', function() {
        var trace = {y: [1, 2, 3], text: ['', 'a<br>b<br>c', '']};
        var data = [trace, trace, trace, trace, trace, trace, trace];
        var layout = {
            width: 600, height: 600, showlegend: false,
            margin: {l: 100, r: 100, t: 100, b: 100},
            hovermode: 'x'
        };

        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.newPlot(gd, data, layout).then(done);
        });

        function labelCount() {
            return d3Select(gd).selectAll('g.hovertext').size();
        }

        it('shows as many labels as will fit on the div, not on the subplot', function(done) {
            _hoverNatural(gd, 200, 200);

            expect(labelCount()).toBe(7);

            Plotly.relayout(gd, {'yaxis.domain': [0.48, 0.52]})
            .then(function() {
                _hoverNatural(gd, 150, 200);
                _hoverNatural(gd, 200, 200);

                expect(labelCount()).toBe(7);
            })
            .then(done, done.fail);
        });
    });

    describe('alignment while avoiding overlaps:', function() {
        var gd;

        beforeEach(function() { gd = createGraphDiv(); });

        function hoverInfoNodes(traceName) {
            var g = d3SelectAll('g.hoverlayer g.hovertext').filter(function() {
                return !d3Select(this).select('[data-unformatted="' + traceName + '"]').empty();
            });

            return {
                primaryText: g.select('text:not([data-unformatted="' + traceName + '"])').node(),
                primaryBox: g.select('path').node(),
                secondaryText: g.select('[data-unformatted="' + traceName + '"]').node(),
                secondaryBox: g.select('rect').node()
            };
        }

        function ensureCentered(hoverInfoNodes) {
            expect(hoverInfoNodes.primaryText.getAttribute('text-anchor')).toBe('middle');
            expect(hoverInfoNodes.secondaryText.getAttribute('text-anchor')).toBe('middle');
            return hoverInfoNodes;
        }

        function assertLabelsInsideBoxes(nodes, msgPrefix) {
            var msgPrefixFmt = msgPrefix ? '[' + msgPrefix + '] ' : '';

            assertElemInside(nodes.primaryText, nodes.primaryBox,
              msgPrefixFmt + 'Primary text inside box');
            assertElemInside(nodes.secondaryText, nodes.secondaryBox,
              msgPrefixFmt + 'Secondary text inside box');
        }

        function assertSecondaryRightToPrimaryBox(nodes, msgPrefix) {
            var msgPrefixFmt = msgPrefix ? '[' + msgPrefix + '] ' : '';

            assertElemRightTo(nodes.secondaryBox, nodes.primaryBox,
              msgPrefixFmt + 'Secondary box right to primary box');
            assertElemTopsAligned(nodes.secondaryBox, nodes.primaryBox,
              msgPrefixFmt + 'Top edges of primary and secondary boxes aligned');
        }

        function calcLineOverlap(minA, maxA, minB, maxB) {
            expect(minA).toBeLessThan(maxA);
            expect(minB).toBeLessThan(maxB);

            var overlap = Math.min(maxA, maxB) - Math.max(minA, minB);
            return Math.max(0, overlap);
        }

        it('centered-aligned, should render labels inside boxes', function(done) {
            var trace1 = {
                x: ['giraffes'],
                y: [5],
                name: 'LA Zoo',
                type: 'bar',
                text: ['Way too long hover info!']
            };
            var trace2 = {
                x: ['giraffes'],
                y: [5],
                name: 'SF Zoo',
                type: 'bar',
                text: ['San Francisco']
            };
            var data = [trace1, trace2];
            var layout = {width: 600, height: 300, barmode: 'stack'};

            Plotly.newPlot(gd, data, layout)
            .then(function() { _hover(gd, 300, 150); })
            .then(function() {
                var nodes = ensureCentered(hoverInfoNodes('LA Zoo'));
                assertLabelsInsideBoxes(nodes);
                assertSecondaryRightToPrimaryBox(nodes);
            })
            .then(done, done.fail);
        });

        it('centered-aligned, should stack nicely upon each other', function(done) {
            var trace1 = {
                x: ['giraffes'],
                y: [5],
                name: 'LA Zoo',
                type: 'bar',
                text: ['Way too long hover info!']
            };
            var trace2 = {
                x: ['giraffes'],
                y: [5],
                name: 'SF Zoo',
                type: 'bar',
                text: ['Way too looooong hover info!']
            };
            var trace3 = {
                x: ['giraffes'],
                y: [5],
                name: 'NY Zoo',
                type: 'bar',
                text: ['New York']
            };
            var data = [trace1, trace2, trace3];
            var layout = {width: 600, height: 300};

            Plotly.newPlot(gd, data, layout)
            .then(function() { _hover(gd, 300, 150); })
            .then(function() {
                var nodesLA = ensureCentered(hoverInfoNodes('LA Zoo'));
                var nodesSF = ensureCentered(hoverInfoNodes('SF Zoo'));

                // Ensure layout correct
                assertLabelsInsideBoxes(nodesLA, 'LA Zoo');
                assertLabelsInsideBoxes(nodesSF, 'SF Zoo');
                assertSecondaryRightToPrimaryBox(nodesLA, 'LA Zoo');
                assertSecondaryRightToPrimaryBox(nodesSF, 'SF Zoo');

                // Ensure stacking, finally
                var boxLABB = nodesLA.primaryBox.getBoundingClientRect();
                var boxSFBB = nodesSF.primaryBox.getBoundingClientRect();

                // Be robust against floating point arithmetic and subtle future layout changes
                expect(calcLineOverlap(boxLABB.top, boxLABB.bottom, boxSFBB.top, boxSFBB.bottom))
                  .toBeWithin(0, 1);
            })
            .then(done, done.fail);
        });

        it('should stack multi-line trace-name labels nicely', function(done) {
            var name = 'Multi<br>line<br>trace<br>name';
            var name2 = 'Multi<br>line<br>trace<br>name2';

            Plotly.newPlot(gd, [{
                y: [1, 2, 1],
                name: name,
                hoverlabel: {namelength: -1},
                hoverinfo: 'x+y+name'
            }, {
                y: [1, 2, 1],
                name: name2,
                hoverinfo: 'x+y+name',
                hoverlabel: {namelength: -1}
            }], {
                width: 600,
                height: 300
            })
            .then(function() { _hoverNatural(gd, 209, 12); })
            .then(function() {
                var nodes = hoverInfoNodes(name);
                var nodes2 = hoverInfoNodes(name2);

                assertLabelsInsideBoxes(nodes, 'trace 0');
                assertLabelsInsideBoxes(nodes2, 'trace 2');
                assertSecondaryRightToPrimaryBox(nodes, 'trace 0');
                assertSecondaryRightToPrimaryBox(nodes2, 'trace 2');

                var primaryBB = nodes.primaryBox.getBoundingClientRect();
                var primaryBB2 = nodes2.primaryBox.getBoundingClientRect();
                expect(calcLineOverlap(primaryBB.top, primaryBB.bottom, primaryBB2.top, primaryBB2.bottom))
                  .toBeWithin(0, 1);

                // there's a bit of a gap in the secondary as they do have
                // a border (for now)
                var secondaryBB = nodes.secondaryBox.getBoundingClientRect();
                var secondaryBB2 = nodes2.secondaryBox.getBoundingClientRect();
                expect(calcLineOverlap(secondaryBB.top, secondaryBB.bottom, secondaryBB2.top, secondaryBB2.bottom))
                  .toBeWithin(2, 1);
            })
            .then(done, done.fail);
        });

        it('should avoid overlaps on *too close* pts are filtered out', function(done) {
            Plotly.newPlot(gd, [
                {name: 'A', x: [9, 10], y: [9, 10]},
                {name: 'B', x: [8, 9], y: [9, 10]},
                {name: 'C', x: [9, 10], y: [10, 11]}
            ], {
                xaxis: {range: [0, 100]},
                yaxis: {range: [0, 100]},
                width: 700,
                height: 450
            })
            .then(function() { _hover(gd, 67, 239); })
            .then(function() {
                var nodesA = hoverInfoNodes('A');
                var nodesC = hoverInfoNodes('C');

                // Ensure layout correct
                assertLabelsInsideBoxes(nodesA, 'A');
                assertLabelsInsideBoxes(nodesC, 'C');
                assertSecondaryRightToPrimaryBox(nodesA, 'A');
                assertSecondaryRightToPrimaryBox(nodesC, 'C');

                // Ensure stacking, finally
                var boxA = nodesA.primaryBox.getBoundingClientRect();
                var boxC = nodesC.primaryBox.getBoundingClientRect();

                // Be robust against floating point arithmetic and subtle future layout changes
                expect(calcLineOverlap(boxA.top, boxA.bottom, boxC.top, boxC.bottom))
                  .toBeWithin(0, 1);
            })
            .then(done, done.fail);
        });
    });

    describe('constraints info graph viewport', function() {
        var gd;

        beforeEach(function() { gd = createGraphDiv(); });

        it('hovermode:x common label should fit in the graph div width', function(done) {
            function _assert(msg, exp) {
                return function() {
                    var label = d3Select('g.axistext');
                    if(label.node()) {
                        expect(label.text()).toBe(exp.txt, 'common label text| ' + msg);
                        expect(Drawing.getTranslate(label).x)
                            .toBeWithin(exp.lx, 5, 'common label translate-x| ' + msg);

                        var startOfPath = label.select('path').attr('d').split('L')[0];
                        expect(startOfPath).not.toBe('M0,0', 'offset start of label path| ' + msg);
                    } else {
                        fail('fail to generate common hover label');
                    }
                };
            }

            function _hoverLeft() { return _hover(gd, 30, 300); }

            function _hoverRight() { return _hover(gd, 370, 300); }

            Plotly.newPlot(gd, [{
                type: 'bar',
                x: ['2019-01-01', '2019-06-01', '2020-01-01'],
                y: [2, 5, 10]
            }], {
                xaxis: {range: ['2019-02-06', '2019-12-01']},
                margin: {l: 0, r: 0},
                width: 400,
                height: 400
            })
            .then(_hoverLeft)
            .then(_assert('left-edge hover', {txt: 'Jan 1, 2019', lx: 37}))
            .then(_hoverRight)
            .then(_assert('right-edge hover', {txt: 'Jan 1, 2020', lx: 362}))
            .then(function() { return Plotly.relayout(gd, 'xaxis.side', 'top'); })
            .then(_hoverLeft)
            .then(_assert('left-edge hover (side:top)', {txt: 'Jan 1, 2019', lx: 37}))
            .then(_hoverRight)
            .then(_assert('right-edge hover (side:top)', {txt: 'Jan 1, 2020', lx: 362}))
            .then(done, done.fail);
        });

        it('hovermode:y common label should shift and clip text start into graph div', function(done) {
            function _assert(msg, exp) {
                return function() {
                    var label = d3Select('g.axistext');
                    if(label.node()) {
                        var ltext = label.select('text');
                        expect(ltext.text()).toBe(exp.txt, 'common label text| ' + msg);
                        expect(ltext.attr('x')).toBeWithin(exp.ltx, 5, 'common label text x| ' + msg);

                        negateIf(exp.clip, expect(ltext.attr('clip-path'))).toBe(null, 'text clip url| ' + msg);

                        var fullLayout = gd._fullLayout;
                        var clipId = 'clip' + fullLayout._uid + 'commonlabely';
                        var clipPath = d3Select('#' + clipId);
                        negateIf(exp.clip, expect(clipPath.node())).toBe(null, 'text clip path|' + msg);

                        if(exp.tspanX) {
                            var tspans = label.selectAll('tspan');
                            if(tspans.size()) {
                                tspans.each(function(d, i) {
                                    var s = d3Select(this);
                                    expect(s.attr('x')).toBeWithin(exp.tspanX[i], 5, i + '- tspan shift| ' + msg);
                                });
                            } else {
                                fail('fail to generate tspans in hover label');
                            }
                        }
                    } else {
                        fail('fail to generate common hover label');
                    }
                };
            }

            function _hoverWayLong() { return _hover(gd, 135, 100); }

            function _hoverA() { return _hover(gd, 135, 20); }

            Plotly.newPlot(gd, [{
                type: 'bar',
                orientation: 'h',
                y: ['Looong label', 'Loooooger label', 'Waay loooong label', 'a'],
                x: [2, 5, 10, 2]
            }], {
                width: 400,
                height: 400
            })
            .then(_hoverWayLong)
            .then(_assert('on way long label', {txt: 'Waay loooong label', clip: true, ltx: 38}))
            .then(_hoverA)
            .then(_assert('on "a" label', {txt: 'a', clip: false, ltx: -9}))
            .then(function() {
                return Plotly.restyle(gd, {
                    y: [['Looong label', 'Loooooger label', 'SHORT!<br>Waay loooong label', 'a']]
                });
            })
            .then(_hoverWayLong)
            .then(_assert('on way long label (multi-line case)', {
                txt: 'SHORT!Waay loooong label',
                clip: true,
                ltx: 38,
                tspanX: [-11, 38]
            }))
            .then(done, done.fail);
        });
    });

    describe('hovertemplate', function() {
        var mockCopy;

        beforeEach(function(done) {
            mockCopy = Lib.extendDeep({}, mock);
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        afterEach(function() {
            Plotly.purge('graph');
            destroyGraphDiv();
        });

        it('should format labels according to a template string', function(done) {
            var gd = document.getElementById('graph');
            Plotly.restyle(gd, 'hovertemplate', '%{y:$.2f}<extra>trace 0</extra>')
            .then(function() {
                Fx.hover('graph', evt, 'xy');

                var hoverTrace = gd._hoverdata[0];

                expect(hoverTrace.curveNumber).toEqual(0);
                expect(hoverTrace.pointNumber).toEqual(17);
                expect(hoverTrace.x).toEqual(0.388);
                expect(hoverTrace.y).toEqual(1);

                assertHoverLabelContent({
                    nums: '$1.00',
                    name: 'trace 0',
                    axis: '0.388'
                });
            })
            .then(done, done.fail);
        });

        it('should format labels according to a template string and locale', function(done) {
            var gd = document.getElementById('graph');
            mockCopy.layout.separators = undefined;
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout, {
                locale: 'fr-eu',
                locales: {
                    'fr-eu': {
                        format: {
                            currency: ['€', ''],
                            decimal: ',',
                            thousands: ' ',
                            grouping: [3]
                        }
                    }
                }
            })
            .then(function() {
                return Plotly.restyle(gd, 'hovertemplate', '%{y:$010,.2f}<extra>trace 0</extra>');
            })
            .then(function() {
                Fx.hover('graph', evt, 'xy');

                var hoverTrace = gd._hoverdata[0];

                expect(hoverTrace.curveNumber).toEqual(0);
                expect(hoverTrace.pointNumber).toEqual(17);
                expect(hoverTrace.x).toEqual(0.388);
                expect(hoverTrace.y).toEqual(1);

                assertHoverLabelContent({
                    nums: '€000 001,00',
                    name: 'trace 0',
                    axis: '0,388'
                });
            })
            .then(done, done.fail);
        });

        it('should format secondary label with extra tag', function(done) {
            var gd = document.getElementById('graph');
            Plotly.restyle(gd, 'hovertemplate', '<extra>trace 20 %{y:$.2f}</extra>')
            .then(function() {
                Fx.hover('graph', evt, 'xy');

                var hoverTrace = gd._hoverdata[0];

                expect(hoverTrace.curveNumber).toEqual(0);
                expect(hoverTrace.pointNumber).toEqual(17);
                expect(hoverTrace.x).toEqual(0.388);
                expect(hoverTrace.y).toEqual(1);

                assertHoverLabelContent({
                    nums: '',
                    name: 'trace 20 $1.00',
                    axis: '0.388'
                });
            })
            .then(done, done.fail);
        });

        it('should support pseudo-html', function(done) {
            var gd = document.getElementById('graph');
            Plotly.restyle(gd, 'hovertemplate', '<b>%{y:$.2f}</b><br>%{fullData.name}<extra></extra>')
            .then(function() {
                Fx.hover('graph', evt, 'xy');

                var hoverTrace = gd._hoverdata[0];

                expect(hoverTrace.curveNumber).toEqual(0);
                expect(hoverTrace.pointNumber).toEqual(17);
                expect(hoverTrace.x).toEqual(0.388);
                expect(hoverTrace.y).toEqual(1);

                assertHoverLabelContent({
                    nums: '<tspan style="font-weight:bold">$1.00</tspan>\nPV learning curve.txt',
                    name: '',
                    axis: '0.388'
                });
            })
            .then(done, done.fail);
        });

        it('should support array', function(done) {
            var gd = document.getElementById('graph');
            var templates = [];
            for(var i = 0; i < mockCopy.data[0].y.length; i++) {
                templates[i] = 'hovertemplate ' + i + ':%{y:$.2f}<extra></extra>';
            }
            Plotly.restyle(gd, 'hovertemplate', [templates])
            .then(function() {
                Fx.hover('graph', evt, 'xy');

                var hoverTrace = gd._hoverdata[0];

                expect(hoverTrace.curveNumber).toEqual(0);
                expect(hoverTrace.pointNumber).toEqual(17);
                expect(hoverTrace.x).toEqual(0.388);
                expect(hoverTrace.y).toEqual(1);

                assertHoverLabelContent({
                    nums: 'hovertemplate 17:$1.00',
                    name: '',
                    axis: '0.388'
                });
            })
            .then(done, done.fail);
        });

        it('should contain the axis names', function(done) {
            var gd = document.getElementById('graph');
            Plotly.restyle(gd, 'hovertemplate',
              '%{yaxis.title.text}:%{y:$.2f}<br>%{xaxis.title.text}:%{x:0.4f}<extra></extra>')
            .then(function() {
                Fx.hover('graph', evt, 'xy');

                var hoverTrace = gd._hoverdata[0];

                expect(hoverTrace.curveNumber).toEqual(0);
                expect(hoverTrace.pointNumber).toEqual(17);
                expect(hoverTrace.x).toEqual(0.388);
                expect(hoverTrace.y).toEqual(1);

                assertHoverLabelContent({
                    nums: 'Cost ($/W​<tspan style="font-size:70%" dy="0.3em">P</tspan><tspan dy="-0.21em">​</tspan>):$1.00\nCumulative Production (GW):0.3880',
                    name: '',
                    axis: '0.388'
                });
            })
            .then(done, done.fail);
        });

        it('should work with layout.meta references', function(done) {
            var gd = document.getElementById('graph');

            Plotly.update(gd,
                {hovertemplate: 'TRACE -- %{meta[0]}<extra>%{meta[1]}</extra>'},
                {meta: ['A', '$$$']}
            ).then(function() {
                Fx.hover('graph', evt, 'xy');

                assertHoverLabelContent({
                    nums: 'TRACE -- A',
                    name: '$$$',
                    axis: '0.388'
                });
            })
            .then(done, done.fail);
        });

        it('should work with trace meta references', function(done) {
            var gd = document.getElementById('graph');

            Plotly.update(gd, {
                meta: {yname: 'Yy', xname: 'Xx'},
                hovertemplate: 'TRACE -- %{meta.yname}<extra>%{meta.xname}</extra>'
            })
            .then(function() {
                Fx.hover('graph', evt, 'xy');

                assertHoverLabelContent({
                    nums: 'TRACE -- Yy',
                    name: 'Xx',
                    axis: '0.388'
                });
            })
            .then(done, done.fail);
        });
    });

    it('should work with trace.name linked to layout.meta', function(done) {
        var gd = createGraphDiv();

        Plotly.newPlot(gd, [{
            y: [1, 1, 1],
            name: '%{meta[0]}',
            marker: {size: 40}
        }, {
            y: [1]
        }], {
            meta: ['yo!'],
            width: 400,
            height: 400
        })
        .then(function() { _hoverNatural(gd, 200, 200); })
        .then(function() {
            assertHoverLabelContent({
                nums: '1',
                name: 'yo!',
                axis: '2'
            });
        })
        .then(done, done.fail);
    });

    it('should fallback to regular hover content when hoveron does not support hovertemplate', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('@mocks/scatter_fill_self_next.json'));

        fig.data.forEach(function(trace) {
            trace.hoveron = 'points+fills';
            trace.hovertemplate = '%{x} | %{y}';
        });

        fig.layout.hovermode = 'closest';
        fig.layout.showlegend = false;
        fig.layout.margin = {t: 0, b: 0, l: 0, r: 0};

        Plotly.newPlot(gd, fig)
        .then(function() { _hoverNatural(gd, 180, 200); })
        .then(function() {
            assertHoverLabelContent({
                nums: 'trace 1',
                name: ''
            }, 'hovering on a fill');
        })
        .then(function() { _hoverNatural(gd, 50, 95); })
        .then(function() {
            assertHoverLabelContent({
                nums: '0 | 5',
                name: 'trace 1'
            }, 'hovering on a pt');
        })
        .then(done, done.fail);
    });

    it('should honor *hoverlabel.align', function(done) {
        var gd = createGraphDiv();

        function _assert(msg, exp) {
            var tx = d3Select('g.hovertext').select('text');
            expect(tx.attr('text-anchor')).toBe(exp.textAnchor, 'text anchor|' + msg);
            expect(Number(tx.attr('x'))).toBeWithin(exp.posX, 3, 'x position|' + msg);
        }

        Plotly.newPlot(gd, [{
            y: [1, 2, 1],
            text: 'LONG TEXT'
        }], {
            xaxis: {range: [0, 2]},
            margin: {l: 0, t: 0, b: 0, r: 0},
            hovermode: 'closest',
            width: 400,
            height: 400
        })
        .then(function() { _hoverNatural(gd, 0, 395); })
        .then(function() { _assert('base left pt', {textAnchor: 'start', posX: 9}); })
        .then(function() { _hoverNatural(gd, 395, 395); })
        .then(function() { _assert('base right pt', {textAnchor: 'end', posX: -9}); })
        .then(function() {
            return Plotly.relayout(gd, 'hoverlabel.align', 'left');
        })
        .then(function() { _hoverNatural(gd, 0, 395); })
        .then(function() { _assert('align:left left pt', {textAnchor: 'start', posX: 9}); })
        .then(function() { _hoverNatural(gd, 395, 395); })
        .then(function() { _assert('align:left right pt', {textAnchor: 'start', posX: -84.73}); })
        .then(function() {
            return Plotly.restyle(gd, 'hoverlabel.align', 'right');
        })
        .then(function() { _hoverNatural(gd, 0, 395); })
        .then(function() { _assert('align:right left pt', {textAnchor: 'end', posX: 84.73}); })
        .then(function() { _hoverNatural(gd, 395, 395); })
        .then(function() { _assert('align:right right pt', {textAnchor: 'end', posX: -9}); })
        .then(function() {
            return Plotly.restyle(gd, 'hoverlabel.align', [['right', 'auto', 'left']]);
        })
        .then(function() { _hoverNatural(gd, 0, 395); })
        .then(function() { _assert('arrayOk align:right left pt', {textAnchor: 'end', posX: 84.73}); })
        .then(function() { _hoverNatural(gd, 395, 395); })
        .then(function() { _assert('arrayOk align:left right pt', {textAnchor: 'start', posX: -84.73}); })
        .then(done, done.fail);
    });

    it('should honor *hoverlabel.align (centered label case)', function(done) {
        var gd = createGraphDiv();

        function _assert(msg, exp) {
            var tx = d3Select('g.hovertext').select('text.nums');
            expect(tx.attr('text-anchor')).toBe(exp.textAnchor, 'text anchor|' + msg);
            expect(Number(tx.attr('x'))).toBeWithin(exp.posX, 3, 'x position|' + msg);
            delete gd._hoverdata;
        }

        Plotly.newPlot(gd, [{
            x: ['giraffes'],
            y: [5],
            name: 'LA Zoo',
            type: 'bar',
            text: ['Way tooooo long hover info!'],
            hoverinfo: 'all'
        }], {
            margin: {l: 0, t: 0, b: 0, r: 0},
            hovermode: 'closest',
            width: 400,
            height: 400
        })
        .then(function() { _hoverNatural(gd, 200, 200); })
        .then(function() { _assert('base', {textAnchor: 'middle', posX: -24.3}); })
        .then(function() {
            return Plotly.relayout(gd, 'hoverlabel.align', 'left');
        })
        .then(function() { _hoverNatural(gd, 200, 200); })
        .then(function() { _assert('align:left', {textAnchor: 'start', posX: -105.7}); })
        .then(function() {
            return Plotly.restyle(gd, 'hoverlabel.align', 'right');
        })
        .then(function() { _hoverNatural(gd, 200, 200); })
        .then(function() { _assert('align:right', {textAnchor: 'end', posX: 57}); })
        .then(done, done.fail);
    });
});

describe('hover info on stacked subplots', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    describe('hover info on stacked subplots with shared x-axis', function() {
        var mock = Lib.extendDeep({},
            require('@mocks/stacked_coupled_subplots.json'),
            {data: [
                // Tweak the mock so the higher subplot sometimes has points
                // higher *within the subplot*, sometimes lower.
                // This was the problem in #2370
                {}, {y: [100, 120, 100]}
            ]});

        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.newPlot(gd, mock.data, mock.layout).then(done);
        });

        function _check(xval, ptSpec1, ptSpec2) {
            Lib.clearThrottle();
            Plotly.Fx.hover(gd, {xval: xval}, ['xy', 'xy2', 'xy3']);

            expect(gd._hoverdata.length).toBe(2);

            expect(gd._hoverdata[0]).toEqual(jasmine.objectContaining(
                {
                    curveNumber: ptSpec1[0],
                    pointNumber: ptSpec1[1],
                    x: xval,
                    y: ptSpec1[2]
                }));

            expect(gd._hoverdata[1]).toEqual(jasmine.objectContaining(
                {
                    curveNumber: ptSpec2[0],
                    pointNumber: ptSpec2[1],
                    x: xval,
                    y: ptSpec2[2]
                }));

            assertHoverLabelContent({
                // There should be 2 pts being hovered over,
                // in two different traces, one in each plot.
                nums: [String(ptSpec1[2]), String(ptSpec2[2])],
                name: [ptSpec1[3], ptSpec2[3]],
                // There should be a single label on the x-axis with the shared x value
                axis: String(xval)
            });

            // ensure the hover label bounding boxes don't overlap, except a little margin of 5 px
            // testing #2370
            var bBoxes = [];
            d3SelectAll('g.hovertext').each(function() {
                bBoxes.push(this.getBoundingClientRect());
            });
            expect(bBoxes.length).toBe(2);
            var disjointY = bBoxes[0].top >= bBoxes[1].bottom - 5 || bBoxes[1].top >= bBoxes[0].bottom - 5;
            expect(disjointY).toBe(true, bBoxes.map(function(bb) { return {top: bb.top, bottom: bb.bottom}; }));
        }

        it('responds to hover and keeps the labels from crossing', function() {
            _check(2, [0, 2, 12, 'trace 0'], [1, 0, 100, 'trace 1']);
            _check(3, [1, 1, 120, 'trace 1'], [2, 0, 1000, 'trace 2']);
            _check(4, [1, 2, 100, 'trace 1'], [2, 1, 1100, 'trace 2']);
        });
    });

    describe('hover info on stacked subplots with shared y-axis', function() {
        var mock = Lib.extendDeep(require('@mocks/stacked_subplots_shared_yaxis.json'));
        mock.data[0].name = 'Who put the bomp in the bomp bah bomp bah bomp';
        mock.data[0].hoverlabel = {namelength: -1};
        mock.data[1].name = 'Who put the ram in the rama lama ding dong';
        mock.data[1].hoverlabel = {namelength: [2, 4]};
        mock.data[2].name = 'Who put the bop in the bop shoo bop shoo bop';
        mock.layout.hoverlabel = {namelength: 10};

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mock.data, mock.layout).then(done);
        });

        it('responds to hover', function() {
            var gd = document.getElementById('graph');
            Plotly.Fx.hover(gd, {yval: 0}, ['xy', 'x2y', 'x3y']);

            expect(gd._hoverdata.length).toEqual(3);

            expect(gd._hoverdata[0]).toEqual(jasmine.objectContaining(
                {
                    curveNumber: 0,
                    pointNumber: 0,
                    x: 1,
                    y: 0
                }));

            expect(gd._hoverdata[1]).toEqual(jasmine.objectContaining(
                {
                    curveNumber: 1,
                    pointNumber: 0,
                    x: 2.1,
                    y: 0
                }));

            expect(gd._hoverdata[2]).toEqual(jasmine.objectContaining(
                {
                    curveNumber: 2,
                    pointNumber: 0,
                    x: 3,
                    y: 0
                }));


            assertHoverLabelContent({
                // There should be three points being hovered over, in three different traces,
                // one in each plot.
                nums: ['1', '2.1', '3'],
                name: ['Who put the bomp in the bomp bah bomp bah bomp', 'Wh', 'Who put...'],
                // There should be a single label on the y-axis with the shared y value, 0.
                axis: '0'
            });
        });
    });
});

describe('hover on many lines+bars', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    it('shows hover info for both traces', function(done) {
        // see https://github.com/plotly/plotly.js/issues/780
        var values = new Array(1000);
        var values2 = new Array(values.length);
        for(var i = 0; i < values.length; i++) {
            values[i] = i;
            values2[i] = i * 2;
        }

        var gd = createGraphDiv();
        Plotly.newPlot(gd, [
            {y: values2},
            {y: values, type: 'bar'}
        ], {
            width: 400,
            height: 400,
            margin: {l: 100, r: 100, t: 100, b: 100}
        })
        .then(function() {
            Lib.clearThrottle();
            mouseEvent('mousemove', 200, 100);
            Lib.clearThrottle();

            expect(d3Select(gd).selectAll('g.hovertext').size()).toBe(2);
            expect(d3Select(gd).selectAll('g.axistext').size()).toBe(1);
        })
        .then(done, done.fail);
    });
});

describe('hover info on overlaid subplots', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    it('should respond to hover', function(done) {
        var mock = require('@mocks/autorange-tozero-rangemode.json');

        Plotly.newPlot(createGraphDiv(), mock.data, mock.layout).then(function() {
            mouseEvent('mousemove', 768, 345);

            assertHoverLabelContent({
                nums: ['0.35', '2,352.5'],
                name: ['Take Rate', 'Revenue'],
                axis: '1'
            });
        })
        .then(done, done.fail);
    });
});

describe('hover after resizing', function() {
    var gd;
    afterEach(destroyGraphDiv);

    function _click(pos) {
        return new Promise(function(resolve) {
            click(pos[0], pos[1]);

            setTimeout(function() {
                resolve();
            }, HOVERMINTIME);
        });
    }

    function check(pos, expectation, msg) {
        Lib.clearThrottle();
        mouseEvent('mousemove', pos[0], pos[1]);
        assertHoverLabelContent({
            nums: expectation[0],
            name: expectation[1],
            axis: expectation[2]
        }, msg);
    }

    it('should work', function(done) {
        gd = createGraphDiv();

        var data = [{ y: [2, 1, 2] }];
        var layout = { width: 600, height: 500 };

        var pos0 = [305, 403];
        var pos1 = [401, 122];

        Plotly.newPlot(gd, data, layout).then(function() {
            // to test https://github.com/plotly/plotly.js/issues/1044
            return _click(pos0);
        })
        .then(function() {
            return check(pos0, ['1', null, '1'], 'before resize, showing pt label');
        })
        .then(function() {
            return check(pos1, [null, null, null], 'before resize, not showing blank spot');
        })
        .then(function() {
            return Plotly.relayout(gd, 'width', 500);
        })
        .then(function() {
            return check(pos0, [null, null, null], 'after resize, not showing blank spot');
        })
        .then(function() {
            return check(pos1, ['2', null, '2'], 'after resize, showing pt label');
        })
        .then(function() {
            return Plotly.relayout(gd, 'width', 600);
        })
        .then(function() {
            return check(pos0, ['1', null, '1'], 'back to initial, showing pt label');
        })
        .then(function() {
            return check(pos1, [null, null, null], 'back to initial, not showing blank spot');
        })
        .then(done, done.fail);
    });
});

describe('hover on fill', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    function assertLabelsCorrect(mousePos, labelPos, labelText) {
        Lib.clearThrottle();
        mouseEvent('mousemove', mousePos[0], mousePos[1]);

        var hoverText = d3SelectAll('g.hovertext');
        expect(hoverText.size()).toEqual(1);
        expect(hoverText.text()).toEqual(labelText);

        var transformParts = hoverText.attr('transform').split('(');
        expect(transformParts[0]).toEqual('translate');
        var transformCoords = transformParts[1].split(')')[0].split(',');
        expect(+transformCoords[0]).toBeCloseTo(labelPos[0], -1.2, labelText + ':x');
        expect(+transformCoords[1]).toBeCloseTo(labelPos[1], -1.2, labelText + ':y');
    }

    it('should always show one label in the right place', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/scatter_fill_self_next.json'));
        mock.data.forEach(function(trace) { trace.hoveron = 'fills'; });

        Plotly.newPlot(createGraphDiv(), mock.data, mock.layout).then(function() {
            assertLabelsCorrect([242, 142], [252, 133.8], 'trace 2');
            assertLabelsCorrect([242, 292], [233, 210], 'trace 1');
            assertLabelsCorrect([147, 252], [158.925, 248.1], 'trace 0');
        })
        .then(done, done.fail);
    });

    it('should always show one label in the right place (symmetric fill edge case)', function(done) {
        var gd = createGraphDiv();

        Plotly.newPlot(gd, [{
            x: [6, 7, 8, 7, 6],
            y: [5, 4, 5, 6, 5],
            fill: 'tonext',
            hoveron: 'fills'
        }], {
            width: 500,
            height: 500,
            margin: {l: 50, t: 50, r: 50, b: 50}
        })
        .then(function() {
            assertLabelsCorrect([200, 200], [73.75, 250], 'trace 0');

            return Plotly.restyle(gd, {
                x: [[6, 7, 8, 7]],
                y: [[5, 4, 5, 6]]
            });
        })
        .then(function() {
            // gives same results w/o closing point
            assertLabelsCorrect([200, 200], [73.75, 250], 'trace 0');
        })
        .then(done, done.fail);
    });

    it('should work for scatterternary too', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/ternary_fill.json'));
        var gd = createGraphDiv();

        Plotly.newPlot(gd, mock.data, mock.layout).then(function() {
            expect(gd._fullLayout.hovermode).toBe('closest');

            // hover over a point when that's closest, even if you're over
            // a fill, because by default we have hoveron='points+fills'
            assertLabelsCorrect([237, 150], [240.0, 144],
                'trace 2Component A: 0.8Component B: 0.1Component C: 0.1');

            // the rest are hovers over fills
            assertLabelsCorrect([237, 170], [247.7, 166], 'trace 2');
            assertLabelsCorrect([237, 218], [266.75, 265], 'trace 1');
            assertLabelsCorrect([237, 240], [247.7, 254], 'trace 0');

            // zoom in to test clipping of large out-of-viewport shapes
            return Plotly.relayout(gd, {
                'ternary.aaxis.min': 0.5,
                'ternary.baxis.min': 0.25
            });
        }).then(function() {
            // this particular one has a hover label disconnected from the shape itself
            // so if we ever fix this, the test will have to be fixed too.
            assertLabelsCorrect([295, 218], [275.1, 166], 'trace 2');

            // trigger an autoscale redraw, which goes through dragElement
            return doubleClick(237, 251);
        }).then(function() {
            // then make sure we can still select a *different* item afterward
            assertLabelsCorrect([237, 218], [266.75, 265], 'trace 1');
        })
        .then(done, done.fail);
    });

    it('should act like closest mode on ternary when cartesian is in compare mode', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/ternary_fill.json'));
        var gd = createGraphDiv();

        mock.data.push({y: [7, 8, 9]});
        mock.layout.xaxis = {domain: [0.8, 1], visible: false};
        mock.layout.yaxis = {domain: [0.8, 1], visible: false};

        Plotly.newPlot(gd, mock.data, mock.layout).then(function() {
            expect(gd._fullLayout.hovermode).toBe('x');

            // hover over a point when that's closest, even if you're over
            // a fill, because by default we have hoveron='points+fills'
            assertLabelsCorrect([237, 150], [240.0, 144],
                'trace 2Component A: 0.8Component B: 0.1Component C: 0.1');

            // hovers over fills
            assertLabelsCorrect([237, 170], [247.7, 166], 'trace 2');

            // hover on the cartesian trace in the corner
            assertLabelsCorrect([363, 122], [367, 122], 'trace 38');
        })
        .then(done, done.fail);
    });
});

describe('Hover on multicategory axes', function() {
    var gd;
    var eventData;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function _hover(x, y) {
        delete gd._hoverdata;
        Lib.clearThrottle();
        mouseEvent('mousemove', x, y);
    }

    it('should work for bar traces', function(done) {
        Plotly.newPlot(gd, [{
            type: 'bar',
            x: [['2018', '2018', '2019', '2019'], ['a', 'b', 'a', 'b']],
            y: [1, 2, -1, 3]
        }], {
            bargap: 0,
            width: 400,
            height: 400
        })
        .then(function() {
            gd.on('plotly_hover', function(d) {
                eventData = d.points[0];
            });
        })
        .then(function() { _hover(200, 200); })
        .then(function() {
            assertHoverLabelContent({ nums: '−1', axis: '2019 - a' });
            expect(eventData.x).toEqual(['2019', 'a']);
        })
        .then(function() {
            return Plotly.update(gd,
                {hovertemplate: 'Sample: %{x[1]}<br>Year: %{x[0]}<extra></extra>'},
                {hovermode: 'closest'}
            );
        })
        .then(function() { _hover(140, 200); })
        .then(function() {
            assertHoverLabelContent({ nums: 'Sample: b\nYear: 2018' });
            expect(eventData.x).toEqual(['2018', 'b']);
        })
        .then(done, done.fail);
    });

    it('should work on heatmap traces', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/heatmap_multicategory.json'));
        fig.data = [fig.data[0]];
        fig.layout.width = 500;
        fig.layout.height = 500;

        Plotly.newPlot(gd, fig)
        .then(function() {
            gd.on('plotly_hover', function(d) {
                eventData = d.points[0];
            });
        })
        .then(function() { _hover(200, 200); })
        .then(function() {
            assertHoverLabelContent({
                nums: 'x: 2017 - q3\ny: Group 3 - A\nz: 2.303'
            });
            expect(eventData.x).toEqual(['2017', 'q3']);
        })
        .then(function() {
            return Plotly.restyle(gd, 'hovertemplate', '%{z} @ %{x} | %{y}');
        })
        .then(function() { _hover(200, 200); })
        .then(function() {
            assertHoverLabelContent({
                nums: '2.303 @ 2017 - q3 | Group 3 - A',
                name: 'w/ 2d z'
            });
            expect(eventData.x).toEqual(['2017', 'q3']);
        })
        .then(done, done.fail);
    });
});

describe('hover on traces with (x|y)period positioning', function() {
    'use strict';

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function _hover(x, y) {
        delete gd._hoverdata;
        Lib.clearThrottle();
        mouseEvent('mousemove', x, y);
    }

    it('shows hover info for scatter, bar, waterfall, funnel, heatmap and contour traces', function(done) {
        Plotly.newPlot(gd, require('@mocks/period_positioning.json'))
        .then(function() { _hover(110, 390); })
        .then(function() {
            assertHoverLabelContent({
                name: 'scatter',
                nums: '(Jan 2001, 1)'
            });
        })
        .then(function() { _hover(290, 285); })
        .then(function() {
            assertHoverLabelContent({
                name: 'scatter',
                nums: '(Jan 2004, 4)'
            });
        })
        .then(function() { _hover(110, 410); })
        .then(function() {
            assertHoverLabelContent({
                name: 'bar (v)',
                nums: '(Jan 2001, 1)'
            });
        })
        .then(function() { _hover(290, 410); })
        .then(function() {
            assertHoverLabelContent({
                name: 'bar (v)',
                nums: '(Jan 2004, 4)'
            });
        })
        .then(function() { _hover(100, 230); })
        .then(function() {
            assertHoverLabelContent({
                name: 'bar (h)',
                nums: '(1, Jan 2001)'
            });
        })
        .then(function() { _hover(100, 120); })
        .then(function() {
            assertHoverLabelContent({
                name: 'bar (h)',
                nums: '(4, Jan 2004)'
            });
        })
        .then(function() { _hover(135, 230); })
        .then(function() {
            assertHoverLabelContent({
                name: 'scatter2',
                nums: '(1, Jan 2001)'
            });
        })
        .then(function() { _hover(305, 120); })
        .then(function() {
            assertHoverLabelContent({
                name: 'scatter2',
                nums: '(4, Jan 2004)'
            });
        })
        .then(function() { _hover(385, 355); })
        .then(function() {
            assertHoverLabelContent({
                name: 'waterfall',
                nums: [
                    '(Jan 2001, 4)',
                    '4 ▲',
                    'Initial: 0'
                ].join('\n')
            });
        })
        .then(function() { _hover(565, 355); })
        .then(function() {
            assertHoverLabelContent({
                name: 'waterfall',
                nums: [
                    '(Jan 2004, 2)',
                    '(1) ▼',
                    'Initial: 3'
                ].join('\n')
            });
        })
        .then(function() { _hover(475, 225); })
        .then(function() {
            assertHoverLabelContent({
                name: 'funnel',
                nums: [
                    '(1, Jan 2004)',
                    '25% of initial',
                    '50% of previous',
                    '10% of total'
                ].join('\n')
            });
        })
        .then(function() { _hover(475, 115); })
        .then(function() {
            assertHoverLabelContent({
                name: 'funnel',
                nums: [
                    '(4, Jan 2001)',
                    '100% of initial',
                    '100% of previous',
                    '40% of total'
                ].join('\n')
            });
        })
        .then(function() { _hover(665, 365); })
        .then(function() {
            assertHoverLabelContent({
                name: 'heatmap',
                nums: [
                    'x: Jan 2001',
                    'y: Jan 2002',
                    'z: 1'
                ].join('\n')
            });
        })
        .then(function() { _hover(800, 150); })
        .then(function() {
            assertHoverLabelContent({
                name: 'contour',
                nums: [
                    'x: Jan 2003',
                    'y: Jan 2003',
                    'z: 0'
                ].join('\n')
            });
        })

        .then(done, done.fail);
    });

    it('shows hover info for box, ohlc, candlestick traces', function(done) {
        Plotly.newPlot(gd, require('@mocks/period_positioning2.json'))
        .then(function() { _hover(110, 390); })
        .then(function() {
            assertHoverLabelContent({
                name: 'ohlc',
                nums: [
                    'Jan 2001',
                    'open: 1',
                    'high: 2',
                    'low: 0',
                    'close: 0.5  ▼'
                ].join('\n')
            });
        })
        .then(function() { _hover(290, 285); })
        .then(function() {
            assertHoverLabelContent({
                name: 'ohlc',
                nums: [
                    'Jan 2004',
                    'open: 4',
                    'high: 8',
                    'low: 0',
                    'close: 2  ▼'
                ].join('\n')
            });
        })
        .then(function() { _hover(290, 120); })
        .then(function() {
            assertHoverLabelContent({
                name: 'candlestick',
                nums: [
                    'Jan 2004',
                    'open: 4',
                    'high: 8',
                    'low: 0',
                    'close: 2  ▼'
                ].join('\n')
            });
        })
        .then(function() { _hover(385, 355); })
        .then(function() {
            assertHoverLabelContent({
                name: ['', '', '', 'box (v)', ''],
                nums: [
                    '(Jan 2001, min: 2)',
                    '(Jan 2001, q1: 4)',
                    '(Jan 2001, q3: 8)',
                    '(Jan 2001, median: 6)',
                    '(Jan 2001, max: 10)',
                ]
            });
        })
        .then(function() { _hover(475, 120); })
        .then(function() {
            assertHoverLabelContent({
                name: ['', '', '', '', 'box (h)'],
                nums: [
                    '(max: 8, Jan 2004)',
                    '(min: 0, Jan 2004)',
                    '(q1: 2, Jan 2004)',
                    '(q3: 6, Jan 2004)',
                    '(median: 4, Jan 2004)'
                ]
            });
        })

        .then(done, done.fail);
    });

    it('shows hover info and hovertemplate for bar and scatter traces using (start | middle | end) alignments and different periods', function(done) {
        Plotly.newPlot(gd, require('@mocks/period_positioning4.json'))
        .then(function() { _hover(65, 425); })
        .then(function() {
            assertHoverLabelContent({
                name: 'start (M1)',
                nums: '(Jan 1, 2001, 1)'
            });
        })
        .then(function() { _hover(65, 395); })
        .then(function() {
            assertHoverLabelContent({
                name: 'start (M1)',
                nums: '(Jan 15, 2001, 2)'
            });
        })
        .then(function() { _hover(100, 425); })
        .then(function() {
            assertHoverLabelContent({
                name: 'middle (M1)',
                nums: '(Jan 1, 2001, 1)'
            });
        })
        .then(function() { _hover(100, 395); })
        .then(function() {
            assertHoverLabelContent({
                name: 'middle (M1)',
                nums: '(Jan 15, 2001, 2)'
            });
        })
        .then(function() { _hover(135, 425); })
        .then(function() {
            assertHoverLabelContent({
                name: 'end (M1)',
                nums: '(Jan 1, 2001, 1)'
            });
        })
        .then(function() { _hover(135, 395); })
        .then(function() {
            assertHoverLabelContent({
                name: 'end (M1)',
                nums: '(Jan 15, 2001, 2)'
            });
        })

        .then(function() { _hover(65, 205); })
        .then(function() {
            assertHoverLabelContent({
                name: 'start (M2)',
                nums: '(Jan 1, 2001, 1)'
            });
        })
        .then(function() { _hover(65, 175); })
        .then(function() {
            assertHoverLabelContent({
                name: 'start (M2)',
                nums: '(Feb 1, 2001, 2)'
            });
        })
        .then(function() { _hover(100, 205); })
        .then(function() {
            assertHoverLabelContent({
                name: 'middle (M2)',
                nums: '(Jan 1, 2001, 1)'
            });
        })
        .then(function() { _hover(100, 175); })
        .then(function() {
            assertHoverLabelContent({
                name: 'middle (M2)',
                nums: '(Feb 1, 2001, 2)'
            });
        })
        .then(function() { _hover(135, 205); })
        .then(function() {
            assertHoverLabelContent({
                name: 'end (M2)',
                nums: '(Jan 1, 2001, 1)'
            });
        })
        .then(function() { _hover(135, 175); })
        .then(function() {
            assertHoverLabelContent({
                name: 'end (M2)',
                nums: '(Feb 1, 2001, 2)'
            });
        })

        .then(function() { _hover(345, 425); })
        .then(function() {
            assertHoverLabelContent({
                name: 'start (M3)',
                nums: '(Q1, 1)'
            });
        })
        .then(function() { _hover(345, 395); })
        .then(function() {
            assertHoverLabelContent({
                name: 'start (M3)',
                nums: '(Q1, 2)'
            });
        })
        .then(function() { _hover(380, 425); })
        .then(function() {
            assertHoverLabelContent({
                name: 'middle (M3)',
                nums: '(Q1, 1)'
            });
        })
        .then(function() { _hover(380, 395); })
        .then(function() {
            assertHoverLabelContent({
                name: 'middle (M3)',
                nums: '(Q1, 2)'
            });
        })
        .then(function() { _hover(415, 425); })
        .then(function() {
            assertHoverLabelContent({
                name: 'end (M3)',
                nums: '(Q1, 1)'
            });
        })
        .then(function() { _hover(415, 395); })
        .then(function() {
            assertHoverLabelContent({
                name: 'end (M3)',
                nums: '(Q1, 2)'
            });
        })

        .then(function() { _hover(630, 425); })
        .then(function() {
            assertHoverLabelContent({
                name: 'start (M12)',
                nums: '(Jan 2001, 1)'
            });
        })
        .then(function() { _hover(630, 395); })
        .then(function() {
            assertHoverLabelContent({
                name: 'start (M12)',
                nums: '(Jul 2001, 2)'
            });
        })
        .then(function() { _hover(665, 425); })
        .then(function() {
            assertHoverLabelContent({
                name: 'middle (M12)',
                nums: '(Jan 2001, 1)'
            });
        })
        .then(function() { _hover(665, 395); })
        .then(function() {
            assertHoverLabelContent({
                name: 'middle (M12)',
                nums: '(Jul 2001, 2)'
            });
        })
        .then(function() { _hover(700, 425); })
        .then(function() {
            assertHoverLabelContent({
                name: 'end (M12)',
                nums: '(Jan 2001, 1)'
            });
        })
        .then(function() { _hover(700, 395); })
        .then(function() {
            assertHoverLabelContent({
                name: 'end (M12)',
                nums: '(Jul 2001, 2)'
            });
        })

        .then(function() { _hover(630, 205); })
        .then(function() {
            assertHoverLabelContent({
                name: 'start (W1)',
                nums: '(W01, 1)'
            });
        })
        .then(function() { _hover(630, 175); })
        .then(function() {
            assertHoverLabelContent({
                name: 'start (W1)',
                nums: '(W01, 2)'
            });
        })
        .then(function() { _hover(665, 205); })
        .then(function() {
            assertHoverLabelContent({
                name: 'middle (W1)',
                nums: 'Monday, 1'
            });
        })
        .then(function() { _hover(665, 175); })
        .then(function() {
            assertHoverLabelContent({
                name: 'middle (W1)',
                nums: 'Friday, 2'
            });
        })
        .then(function() { _hover(700, 205); })
        .then(function() {
            assertHoverLabelContent({
                name: 'end (W1)',
                nums: '(W01, 1)'
            });
        })
        .then(function() { _hover(700, 175); })
        .then(function() {
            assertHoverLabelContent({
                name: 'end (W1)',
                nums: '(W01, 2)'
            });
        })

        .then(done, done.fail);
    });
});

describe('Hover on axes with rangebreaks', function() {
    var gd;
    var eventData;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function _hover(x, y) {
        delete gd._hoverdata;
        Lib.clearThrottle();
        mouseEvent('mousemove', x, y);
    }

    function _assert(msg, exp, noHoverLabel) {
        if(!noHoverLabel) assertHoverLabelContent({ nums: exp.nums, axis: exp.axis }, msg + '| hover label');
        expect(eventData.x).toBe(exp.x, 'event data x');
        expect(eventData.y).toBe(exp.y, 'event data y');
    }

    it('should work when rangebreaks are present on x-axis', function(done) {
        Plotly.newPlot(gd, [{
            mode: 'lines',  // i.e. no autorange padding
            x: [
                '1970-01-01 00:00:00.000',
                '1970-01-01 00:00:00.010',
                '1970-01-01 00:00:00.050',
                '1970-01-01 00:00:00.090',
                '1970-01-01 00:00:00.095',
                '1970-01-01 00:00:00.100',
                '1970-01-01 00:00:00.150',
                '1970-01-01 00:00:00.190',
                '1970-01-01 00:00:00.200'
            ]
        }], {
            xaxis: {
                rangebreaks: [
                    {bounds: [
                        '1970-01-01 00:00:00.011',
                        '1970-01-01 00:00:00.089'
                    ]},
                    {bounds: [
                        '1970-01-01 00:00:00.101',
                        '1970-01-01 00:00:00.189'
                    ]}
                ]
            },
            width: 400,
            height: 400,
            margin: {l: 10, t: 10, b: 10, r: 10},
            hovermode: 'x'
        })
        .then(function() {
            gd.on('plotly_hover', function(d) {
                eventData = d.points[0];
            });
        })
        .then(function() { _hover(11, 11); })
        .then(function() {
            _assert('leftmost interval', {
                nums: '0',
                axis: 'Jan 1, 1970',
                x: '1970-01-01',
                y: 0
            });
        })
        .then(function() { _hover(200, 200); })
        .then(function() {
            _assert('middle interval', {
                nums: '4',
                axis: 'Jan 1, 1970, 00:00:00.095',
                x: '1970-01-01 00:00:00.095',
                y: 4
            });
        })
        .then(function() { _hover(388, 388); })
        .then(function() {
            _assert('rightmost interval', {
                nums: '8',
                axis: 'Jan 1, 1970, 00:00:00.2',
                x: '1970-01-01 00:00:00.2',
                y: 8
            });
        })
        .then(done, done.fail);
    });

    it('should work when rangebreaks are present on x-axis (reversed range)', function(done) {
        Plotly.newPlot(gd, [{
            mode: 'lines',  // i.e. no autorange padding
            x: [
                '1970-01-01 00:00:00.000',
                '1970-01-01 00:00:00.010',
                '1970-01-01 00:00:00.050',
                '1970-01-01 00:00:00.090',
                '1970-01-01 00:00:00.095',
                '1970-01-01 00:00:00.100',
                '1970-01-01 00:00:00.150',
                '1970-01-01 00:00:00.190',
                '1970-01-01 00:00:00.200'
            ]
        }], {
            xaxis: {
                autorange: 'reversed',
                rangebreaks: [
                    {bounds: [
                        '1970-01-01 00:00:00.011',
                        '1970-01-01 00:00:00.089'
                    ]},
                    {bounds: [
                        '1970-01-01 00:00:00.101',
                        '1970-01-01 00:00:00.189'
                    ]}
                ]
            },
            width: 400,
            height: 400,
            margin: {l: 10, t: 10, b: 10, r: 10},
            hovermode: 'x'
        })
        .then(function() {
            gd.on('plotly_hover', function(d) {
                eventData = d.points[0];
            });
        })
        .then(function() { _hover(11, 11); })
        .then(function() {
            _assert('leftmost interval', {
                nums: '8',
                axis: 'Jan 1, 1970, 00:00:00.2',
                x: '1970-01-01 00:00:00.2',
                y: 8
            });
        })
        .then(function() { _hover(200, 200); })
        .then(function() {
            _assert('middle interval', {
                nums: '4',
                axis: 'Jan 1, 1970, 00:00:00.095',
                x: '1970-01-01 00:00:00.095',
                y: 4
            });
        })
        .then(function() { _hover(388, 388); })
        .then(function() {
            _assert('rightmost interval', {
                nums: '0',
                axis: 'Jan 1, 1970',
                x: '1970-01-01',
                y: 0
            });
        })
        .then(done, done.fail);
    });

    it('should work when rangebreaks are present on y-axis using hovermode x (case of bar and autorange reversed)', function(done) {
        Plotly.newPlot(gd, [{
            type: 'bar',
            orientation: 'h',
            y: [
                '1970-01-01 00:00:00.000',
                '1970-01-01 00:00:00.010',
                '1970-01-01 00:00:00.050',
                '1970-01-01 00:00:00.090',
                '1970-01-01 00:00:00.095',
                '1970-01-01 00:00:00.100',
                '1970-01-01 00:00:00.150',
                '1970-01-01 00:00:00.190',
                '1970-01-01 00:00:00.200'
            ],
            x: [0, 1, 2, 3, 4, 5, 6, 7, 8]
        }], {
            yaxis: {
                autorange: 'reversed',
                rangebreaks: [
                    {bounds: [
                        '1970-01-01 00:00:00.011',
                        '1970-01-01 00:00:00.089'
                    ]},
                    {bounds: [
                        '1970-01-01 00:00:00.101',
                        '1970-01-01 00:00:00.189'
                    ]}
                ]
            },
            width: 400,
            height: 400,
            margin: {l: 10, t: 10, b: 10, r: 10},
            hovermode: 'x'
        })
        .then(function() {
            gd.on('plotly_hover', function(d) {
                eventData = d.points[0];
            });
        })
        .then(function() { _hover(50, 350); })
        .then(function() {
            _assert('1st test', {
                axis: '1',
                nums: 'Jan 1, 1970, 00:00:00.01',
                y: '1970-01-01 00:00:00.01',
                x: 1
            });
        })
        .then(function() { _hover(200, 200); })
        .then(function() {
            _assert('2nd test', {
                axis: '5',
                nums: 'Jan 1, 1970, 00:00:00.1',
                y: '1970-01-01 00:00:00.1',
                x: 5
            });
        })
        .then(function() { _hover(250, 150); }) // hover over break
        .then(function() {
            _assert('3rd test', {
                // previous values
                y: '1970-01-01 00:00:00.1',
                x: 5
            }, 'noHoverLabel');
        })
        .then(function() { _hover(350, 50); })
        .then(function() {
            _assert('4th test', {
                axis: '8',
                nums: 'Jan 1, 1970, 00:00:00.2',
                y: '1970-01-01 00:00:00.2',
                x: 8
            });
        })
        .then(done, done.fail);
    });

    it('should work when rangebreaks are present on y-axis', function(done) {
        Plotly.newPlot(gd, [{
            mode: 'lines',  // i.e. no autorange padding
            y: [
                '1970-01-01 00:00:00.000',
                '1970-01-01 00:00:00.010',
                '1970-01-01 00:00:00.050',
                '1970-01-01 00:00:00.090',
                '1970-01-01 00:00:00.095',
                '1970-01-01 00:00:00.100',
                '1970-01-01 00:00:00.150',
                '1970-01-01 00:00:00.190',
                '1970-01-01 00:00:00.200'
            ]
        }], {
            yaxis: {
                rangebreaks: [
                    {bounds: [
                        '1970-01-01 00:00:00.011',
                        '1970-01-01 00:00:00.089'
                    ]},
                    {bounds: [
                        '1970-01-01 00:00:00.101',
                        '1970-01-01 00:00:00.189'
                    ]}
                ]
            },
            width: 400,
            height: 400,
            margin: {l: 10, t: 10, b: 10, r: 10},
            hovermode: 'y'
        })
        .then(function() {
            gd.on('plotly_hover', function(d) {
                eventData = d.points[0];
            });
        })
        .then(function() { _hover(388, 30); })
        .then(function() {
            _assert('topmost interval', {
                nums: '8',
                axis: 'Jan 1, 1970, 00:00:00.2',
                x: 8,
                y: '1970-01-01 00:00:00.2'
            });
        })
        .then(function() { _hover(200, 200); })
        .then(function() {
            _assert('middle interval', {
                nums: '4',
                axis: 'Jan 1, 1970, 00:00:00.095',
                x: 4,
                y: '1970-01-01 00:00:00.095'
            });
        })
        .then(function() { _hover(11, 370); })
        .then(function() {
            _assert('bottom interval', {
                nums: '0',
                axis: 'Jan 1, 1970',
                x: 0,
                y: '1970-01-01'
            });
        })
        .then(done, done.fail);
    });

    it('should work when rangebreaks are present on y-axis (reversed range)', function(done) {
        Plotly.newPlot(gd, [{
            mode: 'lines',  // i.e. no autorange padding
            y: [
                '1970-01-01 00:00:00.000',
                '1970-01-01 00:00:00.010',
                '1970-01-01 00:00:00.050',
                '1970-01-01 00:00:00.090',
                '1970-01-01 00:00:00.095',
                '1970-01-01 00:00:00.100',
                '1970-01-01 00:00:00.150',
                '1970-01-01 00:00:00.190',
                '1970-01-01 00:00:00.200'
            ]
        }], {
            yaxis: {
                autorange: 'reversed',
                rangebreaks: [
                    {bounds: [
                        '1970-01-01 00:00:00.011',
                        '1970-01-01 00:00:00.089'
                    ]},
                    {bounds: [
                        '1970-01-01 00:00:00.101',
                        '1970-01-01 00:00:00.189'
                    ]}
                ]
            },
            width: 400,
            height: 400,
            margin: {l: 10, t: 10, b: 10, r: 10},
            hovermode: 'y'
        })
        .then(function() {
            gd.on('plotly_hover', function(d) {
                eventData = d.points[0];
            });
        })
        .then(function() { _hover(388, 30); })
        .then(function() {
            _assert('topmost interval', {
                nums: '0',
                axis: 'Jan 1, 1970',
                x: 0,
                y: '1970-01-01'
            });
        })
        .then(function() { _hover(200, 200); })
        .then(function() {
            _assert('middle interval', {
                nums: '4',
                axis: 'Jan 1, 1970, 00:00:00.095',
                x: 4,
                y: '1970-01-01 00:00:00.095'
            });
        })
        .then(function() { _hover(11, 370); })
        .then(function() {
            _assert('bottom interval', {
                nums: '8',
                axis: 'Jan 1, 1970, 00:00:00.2',
                x: 8,
                y: '1970-01-01 00:00:00.2'
            });
        })
        .then(done, done.fail);
    });
});

describe('hover updates', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    function assertLabelsCorrect(mousePos, labelPos, labelText, msg) {
        Lib.clearThrottle();

        if(mousePos) {
            mouseEvent('mousemove', mousePos[0], mousePos[1]);
        }

        var hoverText = d3SelectAll('g.hovertext');
        if(labelPos) {
            expect(hoverText.size()).toBe(1, msg);
            expect(hoverText.text()).toBe(labelText, msg);

            var transformParts = hoverText.attr('transform').split('(');
            expect(transformParts[0]).toBe('translate', msg);
            var transformCoords = transformParts[1].split(')')[0].split(',');
            expect(+transformCoords[0]).toBeCloseTo(labelPos[0], -1, labelText + ':x ' + msg);
            expect(+transformCoords[1]).toBeCloseTo(labelPos[1], -1, labelText + ':y ' + msg);
        } else {
            expect(hoverText.size()).toEqual(0);
        }
    }

    it('should update the labels on animation', function(done) {
        var mock = {
            data: [
                {x: [0.5], y: [0.5], showlegend: false},
                {x: [0], y: [0], showlegend: false},
            ],
            layout: {
                margin: {t: 0, r: 0, b: 0, l: 0},
                width: 200,
                height: 200,
                xaxis: {range: [0, 1]},
                yaxis: {range: [0, 1]},
            }
        };

        var gd = createGraphDiv();
        Plotly.newPlot(gd, mock).then(function() {
            // The label text gets concatenated together when queried. Such is life.
            assertLabelsCorrect([100, 100], [103, 100], 'trace 00.5', 'animation/update 0');
        }).then(function() {
            return Plotly.animate(gd, [{
                data: [{x: [0], y: [0]}, {x: [0.5], y: [0.5]}],
                traces: [0, 1],
            }], {frame: {redraw: false, duration: 0}});
        })
        .then(delay(HOVERMINTIME))
        .then(function() {
            // No mouse event this time. Just change the data and check the label.
            // Ditto on concatenation. This is "trace 1" + "0.5"
            assertLabelsCorrect(null, [103, 100], 'trace 10.5', 'animation/update 1');

            // Restyle to move the point out of the window:
            return Plotly.relayout(gd, {'xaxis.range': [2, 3]});
        }).then(function() {
            // Assert label removed:
            assertLabelsCorrect(null, null, null, 'animation/update 2');

            // Move back to the original xaxis range:
            return Plotly.relayout(gd, {'xaxis.range': [0, 1]});
        }).then(function() {
            // Assert label restored:
            assertLabelsCorrect(null, [103, 100], 'trace 10.5', 'animation/update 3');
        })
        .then(done, done.fail);
    });

    it('should not trigger infinite loop of plotly_unhover events', function(done) {
        var gd = createGraphDiv();
        var colors0 = ['#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000'];

        function unhover() {
            Lib.clearThrottle();
            mouseEvent('mousemove', 394, 285);
        }

        var hoverCnt = 0;
        var unHoverCnt = 0;

        Plotly.newPlot(gd, [{
            mode: 'markers',
            x: [1, 2, 3, 4, 5, 6, 7],
            y: [1, 2, 3, 2, 3, 4, 3],
            marker: {
                size: 16,
                color: colors0.slice()
            }
        }], { width: 700, height: 450 })
        .then(function() {
            gd.on('plotly_hover', function(eventData) {
                hoverCnt++;

                var pt = eventData.points[0];
                Plotly.restyle(gd, 'marker.color[' + pt.pointNumber + ']', 'red');
            });

            gd.on('plotly_unhover', function() {
                unHoverCnt++;

                Plotly.restyle(gd, 'marker.color', [colors0.slice()]);
            });

            assertLabelsCorrect([351, 251], [358, 272], '2', 'events 0');

            unhover();
            expect(hoverCnt).toEqual(1);
            expect(unHoverCnt).toEqual(1);

            assertLabelsCorrect([420, 100], [435, 198], '3', 'events 1');

            unhover();
            expect(hoverCnt).toEqual(2);
            expect(unHoverCnt).toEqual(2);
        })
        .then(done);
    });

    it('should not attempt to rehover over exiting subplots', function(done) {
        spyOn(Fx, 'hover').and.callThrough();

        var data = [
            {y: [1], hoverinfo: 'y'},
            {y: [2], hoverinfo: 'y', xaxis: 'x2', yaxis: 'y2'}
        ];

        var data2 = [
            {y: [1], hoverinfo: 'y'}
        ];

        var layout = {
            xaxis: {domain: [0, 0.5]},
            xaxis2: {anchor: 'y2', domain: [0.5, 1]},
            yaxis2: {anchor: 'x2'},
            width: 400,
            height: 200,
            margin: {l: 0, t: 0, r: 0, b: 0},
            showlegend: false
        };

        var gd = createGraphDiv();
        var onPt2 = [300, 100];
        var offPt2 = [250, 100];

        Plotly.react(gd, data, layout)
        .then(function() {
            assertLabelsCorrect(onPt2, [303, 100], '2', 'after 1st draw [on-pt]');
            assertLabelsCorrect(offPt2, null, null, 'after 1st draw [off-pt]');
            expect(Fx.hover).toHaveBeenCalledTimes(2);
        })
        .then(function() {
            var promise = Plotly.react(gd, data2, layout);
            assertLabelsCorrect(onPt2, null, null, '2', 'before react() resolves [on-pt]');
            assertLabelsCorrect(offPt2, null, null, 'before react() resolves [off-pt]');
            // N.B. no calls from Plots.rehover() as x2y2 subplot got removed!
            expect(Fx.hover).toHaveBeenCalledTimes(2);
            return promise;
        })
        .then(function() {
            expect(Fx.hover).toHaveBeenCalledTimes(2);
            assertLabelsCorrect(onPt2, null, null, '2', 'after react() resolves [on-pt]');
            assertLabelsCorrect(offPt2, null, null, 'after react() resolves [off-pt]');
            expect(Fx.hover).toHaveBeenCalledTimes(2);
        })
        .then(done, done.fail);
    });

    it('drag should trigger unhover', function(done) {
        var data = [{y: [1]}];

        var layout = {
            hovermode: 'x',
            width: 400,
            height: 200,
            margin: {l: 0, t: 0, r: 0, b: 0},
            showlegend: false
        };

        var gd = createGraphDiv();

        var hoverHandler = jasmine.createSpy('hover');
        var unhoverHandler = jasmine.createSpy('unhover');

        var hoverPt = [200, 100];
        var dragPt = [210, 100];

        function hover() {
            mouseEvent('mousemove', hoverPt[0], hoverPt[1]);
            Lib.clearThrottle();
        }

        function drag() {
            mouseEvent('mousedown', hoverPt[0], hoverPt[1]);
            mouseEvent('mousemove', dragPt[0], dragPt[1]);
            mouseEvent('mouseup', dragPt[0], dragPt[1]);
            Lib.clearThrottle();
        }

        Plotly.react(gd, data, layout)
            .then(function() {
                gd.on('plotly_hover', hoverHandler);
                gd.on('plotly_unhover', unhoverHandler);
            })
            .then(hover)
            .then(function() {
                expect(hoverHandler).toHaveBeenCalled();
                expect(unhoverHandler).not.toHaveBeenCalled();
            })
            .then(drag)
            .then(function() {
                expect(hoverHandler).toHaveBeenCalled();
                expect(unhoverHandler).toHaveBeenCalled();
            })
            .then(done, done.fail);
    });
});

describe('Test hover label custom styling:', function() {
    afterEach(destroyGraphDiv);

    function assertLabel(className, expectation) {
        var g = d3Select('g.' + className);

        if(expectation === null) {
            expect(g.size()).toBe(0);
        } else {
            assertHoverLabelStyle(g, {
                bgcolor: expectation.path[0],
                bordercolor: expectation.path[1],
                fontSize: expectation.text[0],
                fontFamily: expectation.text[1],
                fontColor: expectation.text[2]
            },
            '',
            {hovertext: 'text.nums', axistext: 'text'}[className]);
        }
    }

    function assertPtLabel(expectation) {
        assertLabel('hovertext', expectation);
    }

    function assertCommonLabel(expectation) {
        assertLabel('axistext', expectation);
    }

    function _hover(gd, opts) {
        Fx.hover(gd, opts);
        Lib.clearThrottle();
    }

    it('should work for x/y cartesian traces', function(done) {
        var gd = createGraphDiv();

        Plotly.newPlot(gd, [{
            x: [1, 2, 3],
            y: [1, 2, 1],
            marker: {
                color: ['yellow', 'black', 'cyan']
            },
            hoverlabel: {
                font: {
                    color: ['red', 'green', 'blue'],
                    size: 20
                }
            }
        }], {
            hovermode: 'x',
            hoverlabel: { bgcolor: 'white' }
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[0] });

            assertPtLabel({
                path: ['rgb(255, 255, 255)', 'rgb(68, 68, 68)'],
                text: [20, 'Arial', 'rgb(255, 0, 0)']
            });
            assertCommonLabel({
                path: ['rgb(255, 255, 255)', 'rgb(68, 68, 68)'],
                text: [13, 'Arial', 'rgb(68, 68, 68)']
            });
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[1] });

            assertPtLabel({
                path: ['rgb(255, 255, 255)', 'rgb(68, 68, 68)'],
                text: [20, 'Arial', 'rgb(0, 128, 0)']
            });
            assertCommonLabel({
                path: ['rgb(255, 255, 255)', 'rgb(68, 68, 68)'],
                text: [13, 'Arial', 'rgb(68, 68, 68)']
            });
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[2] });

            assertPtLabel({
                path: ['rgb(255, 255, 255)', 'rgb(68, 68, 68)'],
                text: [20, 'Arial', 'rgb(0, 0, 255)']
            });
            assertCommonLabel({
                path: ['rgb(255, 255, 255)', 'rgb(68, 68, 68)'],
                text: [13, 'Arial', 'rgb(68, 68, 68)']
            });

            // test arrayOk case
            return Plotly.restyle(gd, 'hoverinfo', [['skip', 'name', 'x']]);
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[0] });

            assertPtLabel(null);
            assertCommonLabel(null);
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[1] });

            assertPtLabel({
                path: ['rgb(255, 255, 255)', 'rgb(68, 68, 68)'],
                text: [20, 'Arial', 'rgb(0, 128, 0)']
            });
            assertCommonLabel(null);
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[2] });

            assertPtLabel(null);
            assertCommonLabel({
                path: ['rgb(255, 255, 255)', 'rgb(68, 68, 68)'],
                text: [13, 'Arial', 'rgb(68, 68, 68)']
            });

            // test base case
            return Plotly.update(gd, {
                hoverlabel: null,
                // all these items should be display as 'all'
                hoverinfo: [['i+dont+what+im+doing', null, undefined]]
            }, {
                hoverlabel: null
            });
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[0] });

            assertPtLabel({
                path: ['rgb(255, 255, 0)', 'rgb(68, 68, 68)'],
                text: [13, 'Arial', 'rgb(68, 68, 68)']
            });
            assertCommonLabel({
                path: ['rgb(68, 68, 68)', 'rgb(255, 255, 255)'],
                text: [13, 'Arial', 'rgb(255, 255, 255)']
            });
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[1] });

            assertPtLabel({
                path: ['rgb(0, 0, 0)', 'rgb(255, 255, 255)'],
                text: [13, 'Arial', 'rgb(255, 255, 255)']
            });
            assertCommonLabel({
                path: ['rgb(68, 68, 68)', 'rgb(255, 255, 255)'],
                text: [13, 'Arial', 'rgb(255, 255, 255)']
            });
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[2] });

            assertPtLabel({
                path: ['rgb(0, 255, 255)', 'rgb(68, 68, 68)'],
                text: [13, 'Arial', 'rgb(68, 68, 68)']
            });
            assertCommonLabel({
                path: ['rgb(68, 68, 68)', 'rgb(255, 255, 255)'],
                text: [13, 'Arial', 'rgb(255, 255, 255)']
            });

            // test insufficient arrayOk case
            return Plotly.restyle(gd, 'hoverinfo', [['none']]);
        })
        .then(function() {
            expect(gd.calcdata[0].map(function(o) { return o.hi; })).toEqual(
                ['none', 'x+y+z+text', 'x+y+z+text'],
                'should fill calcdata item with correct default'
            );

            _hover(gd, { xval: gd._fullData[0].x[0] });

            assertPtLabel(null);
            assertCommonLabel(null);
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[1] });

            assertPtLabel({
                path: ['rgb(0, 0, 0)', 'rgb(255, 255, 255)'],
                text: [13, 'Arial', 'rgb(255, 255, 255)']
            });
            assertCommonLabel({
                path: ['rgb(68, 68, 68)', 'rgb(255, 255, 255)'],
                text: [13, 'Arial', 'rgb(255, 255, 255)']
            });
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[2] });

            assertPtLabel({
                path: ['rgb(0, 255, 255)', 'rgb(68, 68, 68)'],
                text: [13, 'Arial', 'rgb(68, 68, 68)']
            });
            assertCommonLabel({
                path: ['rgb(68, 68, 68)', 'rgb(255, 255, 255)'],
                text: [13, 'Arial', 'rgb(255, 255, 255)']
            });
        })
        .then(done, done.fail);
    });

    it('should work for x/y cartesian traces (multi-trace case)', function(done) {
        var gd = createGraphDiv();

        function assertNameLabel(expectation) {
            var g = d3SelectAll('g.hovertext > text.name');

            if(expectation === null) {
                expect(g.size()).toBe(0);
            } else {
                g.each(function(_, i) {
                    var textStyle = window.getComputedStyle(this);
                    expect(textStyle.fill).toBe(expectation.color[i]);
                });
            }
        }

        Plotly.newPlot(gd, [{
            x: [1, 2, 3],
            y: [1, 2, 1],
        }, {
            x: [1, 2, 3],
            y: [4, 5, 4],
        }], {
            hovermode: 'x',
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[0] });
            assertNameLabel({
                color: ['rgb(31, 119, 180)', 'rgb(255, 127, 14)']
            });
            return Plotly.restyle(gd, 'marker.color', ['red', 'blue']);
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[0] });
            assertNameLabel({
                color: ['rgb(255, 0, 0)', 'rgb(0, 0, 255)']
            });
            return Plotly.relayout(gd, 'hoverlabel.bgcolor', 'white');
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[0] });
            // should not affect the name font color
            assertNameLabel({
                color: ['rgb(255, 0, 0)', 'rgb(0, 0, 255)']
            });
            return Plotly.restyle(gd, 'marker.color', ['rgba(255,0,0,0.1)', 'rgba(0,0,255,0.1)']);
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[0] });
            // should blend with plot_bgcolor
            assertNameLabel({
                color: ['rgb(255, 179, 179)', 'rgb(179, 179, 255)']
            });
            return Plotly.restyle(gd, 'marker.color', ['rgba(255,0,0,0)', 'rgba(0,0,255,0)']);
        })
        .then(function() {
            _hover(gd, { xval: gd._fullData[0].x[0] });
            // uses default line color when opacity=0
            assertNameLabel({
                color: ['rgb(68, 68, 68)', 'rgb(68, 68, 68)']
            });
        })
        .then(done, done.fail);
    });

    it('should work for 2d z cartesian traces', function(done) {
        var gd = createGraphDiv();

        Plotly.newPlot(gd, [{
            type: 'heatmap',
            x: [1, 2],
            y: [1, 2],
            z: [[1, 2], [2, 3]],
            hoverlabel: {
                font: {
                    color: 'red',
                    size: [[10, 20], [21, 11]]
                }
            }
        }], {
            hoverlabel: {
                bordercolor: 'blue',
                font: { family: 'Gravitas'}
            }
        })
        .then(function() {
            _hover(gd, { xval: 1, yval: 1 });

            assertPtLabel({
                path: ['rgb(68, 68, 68)', 'rgb(0, 0, 255)'],
                text: [10, 'Gravitas', 'rgb(255, 0, 0)']
            });
        })
        .then(function() {
            _hover(gd, { xval: 2, yval: 1 });

            assertPtLabel({
                path: ['rgb(68, 68, 68)', 'rgb(0, 0, 255)'],
                text: [20, 'Gravitas', 'rgb(255, 0, 0)']
            });
        })
        .then(function() {
            _hover(gd, { xval: 1, yval: 2 });

            assertPtLabel({
                path: ['rgb(68, 68, 68)', 'rgb(0, 0, 255)'],
                text: [21, 'Gravitas', 'rgb(255, 0, 0)']
            });
        })
        .then(function() {
            _hover(gd, { xval: 2, yval: 2 });

            assertPtLabel({
                path: ['rgb(68, 68, 68)', 'rgb(0, 0, 255)'],
                text: [11, 'Gravitas', 'rgb(255, 0, 0)']
            });
        })
        .then(done, done.fail);
    });
});

describe('hover distance', function() {
    'use strict';

    var mock = require('@mocks/19.json');

    afterEach(destroyGraphDiv);

    describe('closest hovermode', function() {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.hovermode = 'closest';

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('does not render if distance to the point is larger than default (>20)', function() {
            var gd = document.getElementById('graph');
            var evt = { xpx: 475, ypx: 175 };
            Fx.hover('graph', evt, 'xy');

            expect(gd._hoverdata).toEqual(undefined);
        });

        it('render if distance to the point is less than default (<20)', function() {
            var gd = document.getElementById('graph');
            var evt = { xpx: 475, ypx: 155 };
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(1);
            expect(hoverTrace.x).toEqual(2);
            expect(hoverTrace.y).toEqual(3);

            assertHoverLabelContent({
                nums: '(2, 3)',
                name: 'trace 0'
            });
        });

        it('responds to hoverdistance change', function(done) {
            var gd = document.getElementById('graph');
            var evt = { xpx: 475, ypx: 180 };
            Plotly.relayout(gd, 'hoverdistance', 30)
            .then(function() {
                Fx.hover('graph', evt, 'xy');

                var hoverTrace = gd._hoverdata[0];

                expect(hoverTrace.curveNumber).toEqual(0);
                expect(hoverTrace.pointNumber).toEqual(1);
                expect(hoverTrace.x).toEqual(2);
                expect(hoverTrace.y).toEqual(3);

                assertHoverLabelContent({
                    nums: '(2, 3)',
                    name: 'trace 0'
                });
            })
            .then(done, done.fail);
        });

        it('correctly responds to setting the hoverdistance to -1 by increasing ' +
            'the range of search for points to hover to Infinity', function(done) {
            var gd = document.getElementById('graph');
            var evt = { xpx: 475, ypx: 180 };
            Plotly.relayout(gd, 'hoverdistance', -1)
            .then(function() {
                Fx.hover('graph', evt, 'xy');

                var hoverTrace = gd._hoverdata[0];

                expect(hoverTrace.curveNumber).toEqual(0);
                expect(hoverTrace.pointNumber).toEqual(1);
                expect(hoverTrace.x).toEqual(2);
                expect(hoverTrace.y).toEqual(3);

                assertHoverLabelContent({
                    nums: '(2, 3)',
                    name: 'trace 0'
                });
            })
            .then(done, done.fail);
        });
    });

    describe('x hovermode', function() {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.hovermode = 'x';

        beforeEach(function(done) {
            Plotly.newPlot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('does not render if distance to the point is larger than default (>20)', function() {
            var gd = document.getElementById('graph');
            var evt = { xpx: 450, ypx: 155 };
            Fx.hover('graph', evt, 'xy');

            expect(gd._hoverdata).toEqual(undefined);
        });

        it('render if distance to the point is less than default (<20)', function() {
            var gd = document.getElementById('graph');
            var evt = { xpx: 475, ypx: 155 };
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(1);
            expect(hoverTrace.x).toEqual(2);
            expect(hoverTrace.y).toEqual(3);

            assertHoverLabelContent({
                nums: '3',
                axis: '2',
                name: 'trace 0'
            });
        });

        it('responds to hoverdistance change from 10 to 30 (part 1)', function(done) {
            var gd = document.getElementById('graph');
            var evt = { xpx: 450, ypx: 155 };
            Plotly.relayout(gd, 'hoverdistance', 10)
            .then(function() {
                Fx.hover('graph', evt, 'xy');

                expect(gd._hoverdata).toEqual(undefined);
            })
            .then(done, done.fail);
        });

        it('responds to hoverdistance change from 10 to 30 (part 2)', function(done) {
            var gd = document.getElementById('graph');
            var evt = { xpx: 450, ypx: 155 };
            Plotly.relayout(gd, 'hoverdistance', 30)
            .then(function() {
                Fx.hover('graph', evt, 'xy');

                var hoverTrace = gd._hoverdata[0];

                expect(hoverTrace.curveNumber).toEqual(0);
                expect(hoverTrace.pointNumber).toEqual(1);
                expect(hoverTrace.x).toEqual(2);
                expect(hoverTrace.y).toEqual(3);

                assertHoverLabelContent({
                    nums: '3',
                    axis: '2',
                    name: 'trace 0'
                });
            })
            .then(done, done.fail);
        });

        it('responds to hoverdistance change from default to 0 (part 1)', function() {
            var gd = document.getElementById('graph');
            var evt = { xpx: 475, ypx: 155 };
            Fx.hover('graph', evt, 'xy');

            var hoverTrace = gd._hoverdata[0];

            expect(hoverTrace.curveNumber).toEqual(0);
            expect(hoverTrace.pointNumber).toEqual(1);
            expect(hoverTrace.x).toEqual(2);
            expect(hoverTrace.y).toEqual(3);

            assertHoverLabelContent({
                nums: '3',
                axis: '2',
                name: 'trace 0'
            });
        });

        it('responds to hoverdistance change from default to 0 (part 2)', function(done) {
            var gd = document.getElementById('graph');
            var evt = { xpx: 475, ypx: 155 };
            Plotly.relayout(gd, 'hoverdistance', 0)
            .then(function() {
                Fx.hover('graph', evt, 'xy');

                expect(gd._hoverdata).toEqual(undefined);
            })
            .then(done, done.fail);
        });

        it('responds to setting the hoverdistance to -1 by increasing ' +
        'the range of search for points to hover to Infinity (part 1)', function() {
            var gd = document.getElementById('graph');
            var evt = { xpx: 450, ypx: 155 };
            Fx.hover('graph', evt, 'xy');

            expect(gd._hoverdata).toEqual(undefined);
        });

        it('responds to setting the hoverdistance to -1 by increasing ' +
            'the range of search for points to hover to Infinity (part 2)', function(done) {
            var gd = document.getElementById('graph');
            var evt = { xpx: 450, ypx: 155 };
            Plotly.relayout(gd, 'hoverdistance', -1)
            .then(function() {
                Fx.hover('graph', evt, 'xy');

                var hoverTrace = gd._hoverdata[0];

                expect(hoverTrace.curveNumber).toEqual(0);
                expect(hoverTrace.pointNumber).toEqual(1);
                expect(hoverTrace.x).toEqual(2);
                expect(hoverTrace.y).toEqual(3);

                assertHoverLabelContent({
                    nums: '(2, 3)',
                    name: 'trace 0'
                });
            })
            .then(done, done.fail);
        });
    });

    describe('compare', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('selects all points at the same position on a linear axis', function(done) {
            var x = [0, 1, 2];
            var mock = {
                data: [{type: 'bar', x: x, y: [4, 5, 6]}, {x: x, y: [5, 6, 7]}],
                layout: {width: 400, height: 400, xaxis: {type: 'linear'}}
            };

            Plotly.newPlot(gd, mock)
                .then(function(gd) {
                    Fx.hover(gd, {xpx: 65});

                    expect(gd._hoverdata.length).toEqual(2);
                })
                .then(done, done.fail);
        });

        it('selects all points at the same position on a log axis', function(done) {
            var x = [0, 1, 2];
            var mock = {
                data: [{type: 'bar', x: x, y: [4, 5, 6]}, {x: x, y: [5, 6, 7]}],
                layout: {width: 400, height: 400, xaxis: {type: 'log'}}
            };

            Plotly.newPlot(gd, mock)
                .then(function(gd) {
                    Fx.hover(gd, {xpx: 65});

                    expect(gd._hoverdata.length).toEqual(2);
                })
                .then(done, done.fail);
        });

        it('selects all points at the same position on a category axis', function(done) {
            var x = ['a', 'b', 'c'];
            var mock = {
                data: [{type: 'bar', x: x, y: [4, 5, 6]}, {x: x, y: [5, 6, 7]}],
                layout: {width: 400, height: 400, xaxis: {type: 'category'}}
            };

            Plotly.newPlot(gd, mock)
                .then(function(gd) {
                    Fx.hover(gd, {xpx: 65});

                    expect(gd._hoverdata.length).toEqual(2);
                })
                .then(done, done.fail);
        });

        it('selects all points at the same position on a date axis', function(done) {
            var x = ['2018', '2019', '2020'];
            var mock = {
                data: [{type: 'bar', x: x, y: [4, 5, 6]}, {x: x, y: [5, 6, 7]}],
                layout: {width: 400, height: 400, xaxis: {type: 'date'}}
            };

            Plotly.newPlot(gd, mock)
                .then(function(gd) {
                    Fx.hover(gd, {xpx: 65});

                    expect(gd._hoverdata.length).toEqual(2);
                })
                .then(done, done.fail);
        });
    });
});

describe('hover label rotation:', function() {
    var gd;

    function _hover(gd, opts) {
        Fx.hover(gd, opts);
        Lib.clearThrottle();
    }

    describe('when a single pt is picked', function() {
        afterAll(destroyGraphDiv);

        beforeAll(function(done) {
            gd = createGraphDiv();

            Plotly.newPlot(gd, [{
                type: 'bar',
                orientation: 'h',
                y: [0, 1, 2],
                x: [1, 2, 1]
            }, {
                type: 'bar',
                orientation: 'h',
                y: [3, 4, 5],
                x: [1, 2, 1]
            }], {
                hovermode: 'y'
            })
            .then(done, done.fail);
        });

        it('should rotate labels under *hovermode:y*', function() {
            _hover(gd, { xval: 2, yval: 1 });
            assertHoverLabelContent({
                nums: '2',
                name: 'trace 0',
                axis: '1',
                // N.B. could be changed to be made consistent with 'closest'
                isRotated: true
            });
        });

        it('should not rotate labels under *hovermode:closest*', function(done) {
            Plotly.relayout(gd, 'hovermode', 'closest')
            .then(function() {
                _hover(gd, { xval: 1.9, yval: 1 });
                assertHoverLabelContent({
                    nums: '(2, 1)',
                    name: 'trace 0',
                    axis: '',
                    isRotated: false
                });
            })
            .then(done, done.fail);
        });
    });

    describe('when multiple pts are picked', function() {
        afterAll(destroyGraphDiv);

        beforeAll(function(done) {
            gd = createGraphDiv();

            Plotly.newPlot(gd, [{
                type: 'bar',
                orientation: 'h',
                y: [0, 1, 2],
                x: [1, 2, 1]
            }, {
                type: 'bar',
                orientation: 'h',
                y: [0, 1, 2],
                x: [1, 2, 1]
            }], {
                hovermode: 'y'
            })
            .then(done, done.fail);
        });

        it('should rotate labels under *hovermode:y*', function() {
            _hover(gd, { xval: 2, yval: 1 });
            assertHoverLabelContent({
                nums: ['2', '2'],
                name: ['trace 0', 'trace 1'],
                axis: '1',
                isRotated: true
            });
        });

        it('should not rotate labels under *hovermode:closest*', function(done) {
            Plotly.relayout(gd, 'hovermode', 'closest')
            .then(function() {
                _hover(gd, { xval: 1.9, yval: 1 });
                assertHoverLabelContent({
                    nums: '(2, 1)',
                    // N.B. only showing the 'top' trace
                    name: 'trace 1',
                    axis: '',
                    isRotated: false
                });
            })
            .then(done, done.fail);
        });
    });
});

describe('hovermode defaults to', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('\'closest\' for cartesian plots if clickmode includes \'select\'', function(done) {
        Plotly.newPlot(gd, [{ x: [1, 2, 3], y: [4, 5, 6] }], { clickmode: 'event+select' })
          .then(function() {
              expect(gd._fullLayout.hovermode).toBe('closest');
          })
          .then(done, done.fail);
    });

    it('\'x\' for horizontal cartesian plots if clickmode lacks \'select\'', function(done) {
        Plotly.newPlot(gd, [{ x: [1, 2, 3], y: [4, 5, 6], type: 'bar', orientation: 'h' }], { clickmode: 'event' })
          .then(function() {
              expect(gd._fullLayout.hovermode).toBe('y');
          })
          .then(done, done.fail);
    });

    it('\'y\' for vertical cartesian plots if clickmode lacks \'select\'', function(done) {
        Plotly.newPlot(gd, [{ x: [1, 2, 3], y: [4, 5, 6], type: 'bar', orientation: 'v' }], { clickmode: 'event' })
          .then(function() {
              expect(gd._fullLayout.hovermode).toBe('x');
          })
          .then(done, done.fail);
    });

    it('\'closest\' for a non-cartesian plot', function(done) {
        var mock = require('@mocks/polar_scatter.json');
        expect(mock.layout.hovermode).toBeUndefined();

        Plotly.newPlot(gd, mock.data, mock.layout)
          .then(function() {
              expect(gd._fullLayout.hovermode).toBe('closest');
          })
          .then(done, done.fail);
    });
});

describe('hover labels z-position', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);
    var mock = require('@mocks/14.json');

    it('is above the modebar', function(done) {
        Plotly.newPlot(gd, mock).then(function() {
            var infolayer = document.getElementsByClassName('infolayer');
            var modebar = document.getElementsByClassName('modebar-container');
            var hoverlayer = document.getElementsByClassName('hoverlayer');

            expect(infolayer.length).toBe(1);
            expect(modebar.length).toBe(1);
            expect(hoverlayer.length).toBe(1);

            var compareMask = infolayer[0].compareDocumentPosition(modebar[0]);
            expect(compareMask).toBe(Node.DOCUMENT_POSITION_FOLLOWING, '.modebar-container appears after the .infolayer');

            compareMask = modebar[0].compareDocumentPosition(hoverlayer[0]);
            expect(compareMask).toBe(Node.DOCUMENT_POSITION_FOLLOWING, '.hoverlayer appears after the .modebar');
        })
        .then(done, done.fail);
    });
});

describe('touch devices', function() {
    afterEach(destroyGraphDiv);

    ['pan', 'zoom'].forEach(function(type) {
        describe('dragmode:' + type, function() {
            var data = [{x: [1, 2, 3], y: [1, 3, 2], type: 'bar'}];
            var layout = {width: 600, height: 400, dragmode: type};
            var gd;

            beforeEach(function(done) {
                gd = createGraphDiv();
                Plotly.newPlot(gd, data, layout).then(done);
            });

            it('emits click events', function(done) {
                var hoverHandler = jasmine.createSpy('hover');
                var clickHandler = jasmine.createSpy('click');
                gd.on('plotly_hover', hoverHandler);
                gd.on('plotly_click', clickHandler);

                var gdBB = gd.getBoundingClientRect();
                var touchPoint = [[gdBB.left + 300, gdBB.top + 200]];

                Promise.resolve()
                    .then(function() {
                        touch(touchPoint);
                    })
                    .then(delay(HOVERMINTIME * 1.1))
                    .then(function() {
                        expect(clickHandler).toHaveBeenCalled();
                        expect(hoverHandler).not.toHaveBeenCalled();
                    })
                    .then(done, done.fail);
            });
        });
    });
});

describe('dragmode: false', function() {
    var data = [{x: [1, 2, 3], y: [1, 3, 2], type: 'bar'}];
    var layout = {width: 600, height: 400, dragmode: false};
    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();
        Plotly.newPlot(gd, data, layout).then(done);
    });
    afterEach(destroyGraphDiv);

    it('should emit hover events on mousemove', function(done) {
        var hoverHandler = jasmine.createSpy('hover');
        gd.on('plotly_hover', hoverHandler);
        Promise.resolve()
            .then(function() {
                mouseEvent('mousemove', 105, 300);
                mouseEvent('mousemove', 108, 303);
            })
            .then(delay(HOVERMINTIME * 1.1))
            .then(function() {
                expect(hoverHandler).toHaveBeenCalled();
            })
            .then(done, done.fail);
    });
});

describe('hovermode: (x|y)unified', function() {
    var gd;
    var mock = {
        'data': [
          {'y': [0, 3, 6, 4, 10, 2, 3, 5, 4, 0, 5]},
          {'y': [0, 4, 7, 8, 10, 6, 3, 3, 4, 0, 5], }
        ], 'layout': {'showlegend': false, 'hovermode': 'x unified'}};

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function _hover(gd, opts) {
        Fx.hover(gd, opts);
        Lib.clearThrottle();
    }

    function getHoverLabel() {
        var hoverLayer = d3Select('g.hoverlayer');
        return hoverLayer.select('g.legend');
    }

    function assertElementCount(selector, size) {
        var g = d3SelectAll(selector);
        expect(g.size()).toBe(size);
    }

    function assertLabel(expectation) {
        var hover = getHoverLabel();
        var title = hover.select('text.legendtitletext');
        var traces = hover.selectAll('g.traces');

        if(expectation.title) {
            expect(title.text()).toBe(expectation.title);
        }

        expect(traces.size()).toBe(expectation.items.length, 'has the incorrect number of items');
        traces.each(function(_, i) {
            var e = d3Select(this);
            expect(e.select('text').text()).toBe(expectation.items[i]);
        });
    }

    function assertRectColor(color, bordercolor) {
        var hover = getHoverLabel();
        var bg = hover.select('rect.bg');
        if(color) expect(bg.node().style.fill).toBe(color);
        if(bordercolor) expect(bg.node().style.stroke).toBe(bordercolor);
    }

    function assertSymbol(exp) {
        var hover = getHoverLabel();
        var traces = hover.selectAll('g.traces');
        expect(traces.size()).toBe(exp.length);

        traces.each(function(d, i) {
            var pts = d3Select(this).selectAll('g.legendpoints path');
            pts.each(function() {
                var node = d3Select(this).node();
                expect(node.style.fill).toBe(exp[i][0], 'wrong fill for point ' + i);
                expect(node.style.strokeWidth).toBe(exp[i][1], 'wrong stroke-width for point ' + i);
                expect(node.style.stroke).toBe(exp[i][2], 'wrong stroke for point ' + i);
            });
        });
    }

    function assertFont(fontFamily, fontSize, fontColor) {
        var hover = getHoverLabel();
        var text = hover.select('text.legendtext');
        var node = text.node();

        var textStyle = window.getComputedStyle(node);
        expect(textStyle.fontFamily.split(',')[0]).toBe(fontFamily, 'wrong font family');
        expect(textStyle.fontSize).toBe(fontSize, 'wrong font size');
        expect(textStyle.fill).toBe(fontColor, 'wrong font color');
    }

    it('set smart defaults for spikeline in x unified', function(done) {
        Plotly.newPlot(gd, [{y: [4, 6, 5]}], {'hovermode': 'x unified', 'xaxis': {'color': 'red'}})
            .then(function(gd) {
                expect(gd._fullLayout.hovermode).toBe('x unified');
                var ax = gd._fullLayout.xaxis;
                expect(ax.showspike).toBeTrue;
                expect(ax.spikemode).toBe('across');
                expect(ax.spikethickness).toBe(1.5);
                expect(ax.spikedash).toBe('dot');
                expect(ax.spikecolor).toBe('red');
                expect(ax.spikesnap).toBe('hovered data');
                expect(gd._fullLayout.yaxis.showspike).toBeFalse;
            })
            .then(done, done.fail);
    });

    it('set smart defaults for spikeline in y unified', function(done) {
        Plotly.newPlot(gd, [{y: [4, 6, 5]}], {'hovermode': 'y unified', 'yaxis': {'color': 'red'}})
            .then(function(gd) {
                expect(gd._fullLayout.hovermode).toBe('y unified');
                var ax = gd._fullLayout.yaxis;
                expect(ax.showspike).toBeTrue;
                expect(ax.spikemode).toBe('across');
                expect(ax.spikethickness).toBe(1.5);
                expect(ax.spikedash).toBe('dot');
                expect(ax.spikecolor).toBe('red');
                expect(ax.spikesnap).toBe('hovered data');
                expect(gd._fullLayout.yaxis.showspike).toBeFalse;
            })
            .then(done, done.fail);
    });

    it('x unified should work for x/y cartesian traces', function(done) {
        var mockCopy = Lib.extendDeep({}, mock);
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertLabel({title: '3', items: ['trace 0 : 4', 'trace 1 : 8']});
            })
            .then(done, done.fail);
    });

    it('y unified should work for x/y cartesian traces', function(done) {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.hovermode = 'y unified';
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, { yval: 6 });

                assertLabel({title: '6', items: ['trace 0 : 2', 'trace 1 : 5']});
            })
            .then(done, done.fail);
    });

    it('unified hover modes should work for x/y cartesian traces via template', function(done) {
        var mockCopy = Lib.extendDeep({}, mock);
        delete mockCopy.layout.hovermode;
        mockCopy.layout.template = {
            layout: {
                hovermode: 'y unified'
            }
        };
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                expect(gd._fullLayout.hovermode).toBe('y unified');
                var ax = gd._fullLayout.yaxis;
                expect(ax.showspike).toBeTrue;
                expect(ax.spikemode).toBe('across');
                expect(ax.spikethickness).toBe(1.5);
                expect(ax.spikedash).toBe('dot');
                expect(ax.spikecolor).toBe('#444');
                expect(ax.spikesnap).toBe('hovered data');
                expect(gd._fullLayout.xaxis.showspike).toBeFalse;

                _hover(gd, { yval: 6 });

                assertLabel({title: '6', items: ['trace 0 : 2', 'trace 1 : 5']});
            })
            .then(done, done.fail);
    });

    it('x unified should work for x/y cartesian traces with legendgroup', function(done) {
        var mockLegendGroup = require('@mocks/legendgroup.json');
        var mockCopy = Lib.extendDeep({}, mockLegendGroup);
        mockCopy.layout.hovermode = 'x unified';
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertLabel({title: '3', items: [
                    'trace 0 : 2',
                    'trace 1 : median: 1',
                    'trace 3 : 2',
                    'trace 2 : 2',
                    'trace 5 : 2',
                    'trace 4 : 1'
                ]});
            })
            .then(done, done.fail);
    });

    it('shares filtering logic with compare mode x', function(done) {
        var mock = require('@mocks/27.json');
        var mockCopy = Lib.extendDeep({}, mock);

        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, { xval: '2002' });
                assertElementCount('g.hovertext', 2);

                return Plotly.relayout(gd, 'hovermode', 'x unified');
            })
            .then(function() {
                _hover(gd, { xval: '2002' });
                assertLabel({title: '2002.042', items: [
                    'Market income : 0.5537845',
                    'Market incom... : 0.4420997'
                ]});
            })
            .then(done, done.fail);
    });

    it('should have the same traceorder as the legend', function(done) {
        var mock = require('@mocks/stacked_area.json');
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.hovermode = 'x unified';
        var expectation = ['top : 1', 'middle : 6', 'bottom : 0'];
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertLabel({title: '3', items: expectation});
                return Plotly.relayout(gd, 'legend.traceorder', 'normal');
            })
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertLabel({title: '3', items: expectation.reverse()});
            })
            .then(done, done.fail);
    });

    it('should order items based on trace index as in the legend', function(done) {
        var mock = require('@mocks/29.json');
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.hovermode = 'x unified';
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, {curveNumber: 0});

                assertLabel({title: 'Apr 13, 2014, 15:21:11', items: [
                    'Outdoor (wun... : (Apr 13, 2014, 15:26:12, 69.4)',
                    '1st Floor (N... : (Apr 13, 2014, 15:21:15, 74.8)',
                    '2nd Floor (R... : 73.625',
                    'Attic (Ardui... : (Apr 13, 2014, 15:26:34, 98.49)'
                ]});
            })
            .then(done, done.fail);
    });

    it('should work for finance traces', function(done) {
        var mockOhlc = require('@mocks/finance_multicategory.json');
        var mockCopy = Lib.extendDeep({}, mockOhlc);
        mockCopy.layout.hovermode = 'x unified';
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, {curveNumber: 0, pointNumber: 0});

                assertLabel({title: 'Group 2 - b', items: [
                    'ohlc : open: 12high: 17low: 9close: 13  ▲',
                    'candlestick : open: 22high: 27low: 19close: 23  ▲'
                ]});
            })
            .then(done, done.fail);
    });

    it('should work for "legend_horizontal_autowrap"', function(done) {
        var mock = require('@mocks/legend_horizontal_autowrap.json');
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.hovermode = 'x unified';
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, {xval: 1});

                assertElementCount('g.hoverlayer g.legend', 1);
                assertElementCount('g.hoverlayer g.traces', 20);
            })
            .then(done, done.fail);
    });

    it('should style scatter symbols accordingly', function(done) {
        var mock = require('@mocks/marker_colorscale_template.json');
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.hovermode = 'x unified';
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, {xval: 1});
                assertLabel({title: '1', items: ['2']});
                assertSymbol([['rgb(33, 145, 140)', '0px', '']]);
            })
            .then(function() {
                _hover(gd, {xval: 2});
                assertLabel({title: '2', items: ['3']});
                assertSymbol([['rgb(253, 231, 37)', '0px', '']]);
            })
            .then(done, done.fail);
    });

    it('should style bar symbols accordingly', function(done) {
        var mock = require('@mocks/bar-marker-line-colorscales.json');
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.hovermode = 'x unified';
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, {xval: 10});
                assertLabel({title: '10', items: ['10']});
                assertSymbol([['rgb(94, 216, 43)', '4px', 'rgb(197, 232, 190)']]);
            })
            .then(function() {
                _hover(gd, {xval: 20});
                assertLabel({title: '20', items: ['20']});
                assertSymbol([['rgb(168, 140, 33)', '4px', 'rgb(111, 193, 115)']]);
            })
            .then(done, done.fail);
    });

    it('should style funnel symbols accordingly', function(done) {
        var mock = require('@mocks/funnel_custom.json');
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.hovermode = 'x unified';
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, {xval: 1});

                assertSymbol([
                  ['rgb(0, 255, 0)', '0px', ''],
                  ['rgb(255, 255, 0)', '5px', 'rgb(0, 0, 127)']
                ]);
            })
            .then(done, done.fail);
    });

    it('should style waterfall symbols correctly', function(done) {
        var mock = require('@mocks/waterfall_custom.json');
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.hovermode = 'x unified';
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, {xval: 4});
                assertSymbol([
                  ['rgb(255, 65, 54)', '0px', '']
                ]);
                return Plotly.restyle(gd, {
                    'decreasing.marker.line.width': 5,
                    'decreasing.marker.line.color': 'violet'
                });
            })
            .then(function(gd) {
                _hover(gd, {xval: 4});
                assertSymbol([
                  ['rgb(255, 65, 54)', '5px', 'rgb(238, 130, 238)']
                ]);
            })
            .then(done, done.fail);
    });

    it('label should have bgcolor/bordercolor from hoverlabel or legend or paper_bgcolor', function(done) {
        var mockCopy = Lib.extendDeep({}, mock);
        var bgcolor = [
            'rgb(10, 10, 10)',
            'rgb(20, 20, 20)',
            'rgb(30, 30, 30)',
            'rgb(40, 40, 40)'
        ];

        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertRectColor('rgb(255, 255, 255)', 'rgb(68, 68, 68)');

                // Set paper_bgcolor
                return Plotly.relayout(gd, 'paper_bgcolor', bgcolor[0]);
            })
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertRectColor(bgcolor[0]);

                // Set legend.bgcolor which should win over paper_bgcolor
                return Plotly.relayout(gd, {
                    'showlegend': true,
                    'legend.bgcolor': bgcolor[1],
                    'legend.bordercolor': bgcolor[1]
                });
            })
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertRectColor(bgcolor[1], bgcolor[1]);

                // Set hoverlabel.bgcolor which should win over legend.bgcolor
                return Plotly.relayout(gd, {
                    'hoverlabel.bgcolor': bgcolor[2],
                    'hoverlabel.bordercolor': bgcolor[2]
                });
            })
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertRectColor(bgcolor[2], bgcolor[2]);

                // Check that a legend.bgcolor defined in template works
                delete mockCopy.layout;
                mockCopy.layout = {
                    hovermode: 'x unified',
                    template: { layout: { legend: { bgcolor: bgcolor[1], bordercolor: bgcolor[1] } } }
                };

                return Plotly.newPlot(gd, mockCopy);
            })
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertRectColor(bgcolor[1], bgcolor[1]);

                // Check that a hoverlabel.bgcolor defined in template wins
                delete mockCopy.layout;
                mockCopy.layout = {
                    hovermode: 'x unified',
                    template: { layout: { hoverlabel: { bgcolor: bgcolor[3], bordercolor: bgcolor[3] } } },
                    legend: { bgcolor: bgcolor[1], bordercolor: bgcolor[1] }
                };

                return Plotly.newPlot(gd, mockCopy);
            })
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertRectColor(bgcolor[3], bgcolor[3]);
            })
            .then(done, done.fail);
    });

    it('should use hoverlabel.font or legend.font or layout.font', function(done) {
        var mockCopy = Lib.extendDeep({}, mock);

        // Set layout.font
        mockCopy.layout.font = {size: 20, family: 'Mono', color: 'rgb(10, 10, 10)'};
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, { xval: 3});

                assertFont('Mono', '20px', 'rgb(10, 10, 10)');

                // Set legend.font which should win over layout font
                return Plotly.relayout(gd, {
                    'showlegend': true,
                    'legend.font.size': 15,
                    'legend.font.family': 'Helvetica',
                    'legend.font.color': 'rgb(20, 20, 20)'
                });
            })
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertFont('Helvetica', '15px', 'rgb(20, 20, 20)');

                // Set hoverlabel.font which should win over legend.font
                return Plotly.relayout(gd, {
                    'hoverlabel.font.size': 22,
                    'hoverlabel.font.family': 'Arial',
                    'hoverlabel.font.color': 'rgb(30, 30, 30)'
                });
            })
            .then(function() {
                _hover(gd, { xval: 3 });

                assertFont('Arial', '22px', 'rgb(30, 30, 30)');

                // Check that a legend.font defined in template wins
                delete mockCopy.layout;
                mockCopy.layout = {
                    hovermode: 'x unified',
                    template: { layout: { legend: {font: {size: 5, family: 'Mono', color: 'rgb(5, 5, 5)'}}}},
                };

                return Plotly.newPlot(gd, mockCopy);
            })
            .then(function() {
                _hover(gd, { xval: 3 });

                assertFont('Mono', '5px', 'rgb(5, 5, 5)');

                // Finally, check that a hoverlabel.font defined in template wins
                delete mockCopy.layout;
                mockCopy.layout = {
                    hovermode: 'x unified',
                    template: { layout: { hoverlabel: { font: {family: 'Mono', size: 30, color: 'red'}}}},
                    legend: {font: {size: 20, family: 'Mono', color: 'rgb(10, 10, 10)'}}
                };

                return Plotly.newPlot(gd, mockCopy);
            })
            .then(function() {
                _hover(gd, { xval: 3 });

                assertFont('Mono', '30px', 'rgb(255, 0, 0)');
            })
            .then(done, done.fail);
    });

    it('should work with hovertemplate', function(done) {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.data[0].hovertemplate = 'hovertemplate: %{y:0.2f}';
        mockCopy.data[1].hovertemplate = '<extra>name</extra>%{x:0.2f} %{y:0.2f}';
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertLabel({title: '3', items: [
                    'trace 0 : hovertemplate: 4.00',
                    'name : 3.00 8.00'
                ]});

                return Plotly.restyle(gd, 'hovertemplate', '<extra></extra>%{y:0.2f}');
            })
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertLabel({title: '3', items: [
                    '4.00',
                    '8.00'
                ]});
            })
            .then(done, done.fail);
    });

    it('on relayout, it deletes existing hover', function(done) {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.hovermode = 'x';
        Plotly.newPlot(gd, mockCopy)
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertElementCount('g.hovertext', 2);
                assertElementCount('g.legend', 0);

                return Plotly.relayout(gd, 'hovermode', 'x unified');
            })
            .then(function(gd) {
                _hover(gd, { xval: 3 });

                assertElementCount('g.hovertext', 0);
                assertElementCount('g.legend', 1);
            })
            .then(done, done.fail);
    });
});
