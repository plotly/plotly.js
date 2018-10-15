var d3 = require('d3');

var Plotly = require('@lib/index');
var Fx = require('@src/components/fx');
var Lib = require('@src/lib');
var HOVERMINTIME = require('@src/components/fx').constants.HOVERMINTIME;
var MINUS_SIGN = require('@src/constants/numerical').MINUS_SIGN;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var click = require('../assets/click');
var delay = require('../assets/delay');
var doubleClick = require('../assets/double_click');
var failTest = require('../assets/fail_test');
var touchEvent = require('../assets/touch_event');

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

describe('hover info', function() {
    'use strict';

    var mock = require('@mocks/14.json');
    var evt = { xpx: 355, ypx: 150 };

    afterEach(destroyGraphDiv);

    describe('hover info', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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

            var txs = d3.select(gd).selectAll('.textpoint text');

            expect(txs.size()).toBe(1);

            txs.each(function() {
                expect(d3.select(this).text()).toBe('0');
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
                name: '&lt;img src=x o...',
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

            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
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
            .then(done);
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
            Plotly.plot(gd, [
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
            .catch(failTest)
            .then(done);
        });

        it('puts the right trace on the right', function(done) {
            Plotly.plot(gd, [
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
            .catch(failTest)
            .then(done);
        });
    });

    describe('hover info for x/y/z traces', function() {
        var gd;
        beforeEach(function() {
            gd = createGraphDiv();
        });

        it('should display correct label content', function(done) {
            Plotly.plot(gd, [{
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
            .catch(failTest)
            .then(done);
        });

        it('should display correct label content with specified format - heatmap', function(done) {
            Plotly.plot(gd, [{
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
            .catch(failTest)
            .then(done);
        });

        it('provides exponents correctly for z data', function(done) {
            function expFmt(val, exp) {
                return val + '×10\u200b<tspan style="font-size:70%" dy="-0.6em">' +
                    (exp < 0 ? MINUS_SIGN + -exp : exp) +
                    '</tspan><tspan dy="0.42em">\u200b</tspan>';
            }
            Plotly.plot(gd, [{
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
            .catch(failTest)
            .then(done);
        });

        it('should display correct label content with specified format - contour', function(done) {
            Plotly.plot(gd, [{
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
            .catch(failTest)
            .then(done);
        });

        it('should get the right content and color for contour constraints', function(done) {
            var contourConstraints = require('@mocks/contour_constraints.json');

            Plotly.plot(gd, contourConstraints)
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
                d3.selectAll('g.hovertext').each(function(_, i) {
                    assertHoverLabelStyle(d3.select(this), styles[i]);
                });
            })
            .catch(failTest)
            .then(done);
        });

        it('should display correct label content with specified format - histogram2d', function(done) {
            Plotly.plot(gd, [{
                type: 'histogram2d',
                x: [0, 1, 2, 0, 1, 2, 1],
                y: [0, 0, 0, 1, 1, 1, 1],
                z: [1.11111, 2.2222, 3.3333, 4.4444, 4.4444, 6.6666, 1.1111],
                histfunc: 'sum',
                name: 'one',
                zhoverformat: '.2f',
                showscale: false
            }, {
                type: 'histogram2d',
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
            .catch(failTest)
            .then(done);
        });

        it('should display correct label content with specified format - histogram2dcontour', function(done) {
            Plotly.plot(gd, [{
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
                    nums: 'x: 1\ny: 1\nz: 5.56',
                    name: 'one'
                });
            })
            .catch(failTest)
            .then(done);
        });
    });

    describe('hover info for negative data on a log axis', function() {
        it('shows negative data even though it is infinitely off-screen', function(done) {
            var gd = createGraphDiv();

            Plotly.plot(gd, [{x: [1, 2, 3], y: [1, -5, 10]}], {
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
            .catch(failTest)
            .then(done);
        });
    });

    describe('histogram hover info', function() {
        it('shows the data range when bins have multiple values', function(done) {
            var gd = createGraphDiv();
            var pts;

            Plotly.plot(gd, [{
                x: [0, 2, 3, 4, 5, 6, 7],
                xbins: {start: -0.5, end: 8.5, size: 3},
                type: 'histogram'
            }], {
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                gd.on('plotly_hover', function(e) { pts = e.points; });

                _hoverNatural(gd, 250, 200);
                assertHoverLabelContent({
                    nums: '3',
                    axis: '3 - 5'
                });
            })
            .then(function() {
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
            .catch(failTest)
            .then(done);
        });

        it('shows the exact data when bins have single values', function(done) {
            var gd = createGraphDiv();

            Plotly.plot(gd, [{
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
            .catch(failTest)
            .then(done);
        });

        it('will show a category range if you ask nicely', function(done) {
            var gd = createGraphDiv();

            Plotly.plot(gd, [{
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
            .catch(failTest)
            .then(done);
        });
    });

    describe('histogram2d hover info', function() {
        it('shows the data range when bins have multiple values', function(done) {
            var gd = createGraphDiv();

            Plotly.plot(gd, [{
                x: [0, 2, 3, 4, 5, 6, 7],
                y: [1, 3, 4, 5, 6, 7, 8],
                xbins: {start: -0.5, end: 8.5, size: 3},
                ybins: {start: 0.5, end: 9.5, size: 3},
                type: 'histogram2d'
            }], {
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                _hover(gd, 250, 200);
                assertHoverLabelContent({
                    nums: 'x: 3 - 5\ny: 4 - 6\nz: 3'
                });
            })
            .catch(failTest)
            .then(done);
        });

        it('shows the exact data when bins have single values', function(done) {
            var gd = createGraphDiv();

            Plotly.plot(gd, [{
                x: [0, 0, 3.3, 3.3, 3.3, 7, 7],
                y: [2, 2, 4.2, 4.2, 4.2, 8.8, 8.8],
                xbins: {start: -0.5, end: 8.5, size: 3},
                ybins: {start: 0.5, end: 9.5, size: 3},
                type: 'histogram2d'
            }], {
                width: 500,
                height: 400,
                margin: {l: 0, t: 0, r: 0, b: 0}
            })
            .then(function() {
                _hover(gd, 250, 200);
                assertHoverLabelContent({
                    nums: 'x: 3.3\ny: 4.2\nz: 3'
                });
            })
            .catch(failTest)
            .then(done);
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
                Plotly.plot(gd, financeMock({
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
                .catch(failTest)
                .then(done);
            });

            it('shows correct labels in split mode', function(done) {
                var pts;
                Plotly.plot(gd, financeMock({
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
                .catch(failTest)
                .then(done);
            });

            it('shows text iff text is in hoverinfo', function(done) {
                Plotly.plot(gd, financeMock({text: ['A', 'B', 'C']}))
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
                .catch(failTest)
                .then(done);
            });
        });
    });

    describe('hoverformat', function() {
        var data = [{
                x: [1, 2, 3],
                y: [0.12345, 0.23456, 0.34567]
            }],
            layout = {
                yaxis: { showticklabels: true, hoverformat: ',.2r' },
                width: 600,
                height: 400
            };

        beforeEach(function() {
            this.gd = createGraphDiv();
        });

        it('should display the correct format when ticklabels true', function() {
            Plotly.plot(this.gd, data, layout);
            mouseEvent('mousemove', 303, 213);

            assertHoverLabelContent({
                nums: '0.23',
                axis: '2'
            });
        });

        it('should display the correct format when ticklabels false', function() {
            layout.yaxis.showticklabels = false;
            Plotly.plot(this.gd, data, layout);
            mouseEvent('mousemove', 303, 213);

            assertHoverLabelContent({
                nums: '0.23',
                axis: '2'
            });
        });
    });

    describe('textmode', function() {
        var data = [{
                x: [1, 2, 3, 4],
                y: [2, 3, 4, 5],
                mode: 'text',
                hoverinfo: 'text',
                text: ['test', null, 42, undefined]
            }],
            layout = {
                width: 600,
                height: 400
            };

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), data, layout).then(done);
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
            Plotly.plot(gd, data, layout).then(done);
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
            .catch(failTest)
            .then(done);
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
            .catch(failTest)
            .then(done);
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
            Plotly.plot(gd, data, layout).then(done);
        });

        function labelCount() {
            return d3.select(gd).selectAll('g.hovertext').size();
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
            .catch(failTest)
            .then(done);
        });

    });

    function hoverInfoNodes(traceName) {
        var g = d3.selectAll('g.hoverlayer g.hovertext').filter(function() {
            return !d3.select(this).select('[data-unformatted="' + traceName + '"]').empty();
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

    describe('centered', function() {
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

        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.plot(gd, data, layout).then(done);
        });

        it('renders labels inside boxes', function() {
            _hover(gd, 300, 150);

            var nodes = ensureCentered(hoverInfoNodes('LA Zoo'));
            assertLabelsInsideBoxes(nodes);
        });

        it('renders secondary info box right to primary info box', function() {
            _hover(gd, 300, 150);

            var nodes = ensureCentered(hoverInfoNodes('LA Zoo'));
            assertSecondaryRightToPrimaryBox(nodes);
        });
    });

    describe('centered', function() {
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

        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();
            Plotly.plot(gd, data, layout).then(done);
        });

        function calcLineOverlap(minA, maxA, minB, maxB) {
            expect(minA).toBeLessThan(maxA);
            expect(minB).toBeLessThan(maxB);

            var overlap = Math.min(maxA, maxB) - Math.max(minA, minB);
            return Math.max(0, overlap);
        }

        it('stacks nicely upon each other', function() {
            _hover(gd, 300, 150);

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
            expect(calcLineOverlap(boxLABB.top, boxLABB.bottom, boxSFBB.top, boxSFBB.bottom))
              .toBeWithin(0, 1); // Be robust against floating point arithmetic and subtle future layout changes
        });
    });

    describe('hovertemplate', function() {
        var mockCopy = Lib.extendDeep({}, mock);

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
        });

        it('should format labels according to a template string', function() {
            var gd = document.getElementById('graph');
            Plotly.restyle(gd, 'data[0].hovertemplate', '%{y:$.2f}').then(function() {
                Fx.hover('graph', evt, 'xy');

                var hoverTrace = gd._hoverdata[0];

                expect(hoverTrace.curveNumber).toEqual(0);
                expect(hoverTrace.pointNumber).toEqual(17);
                expect(hoverTrace.x).toEqual(0.388);
                expect(hoverTrace.y).toEqual(1);

                assertHoverLabelContent({
                    nums: '$1.00',
                    axis: '0.388'
                });
            });
        });
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
            Plotly.plot(gd, mock.data, mock.layout).then(done);
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
            d3.selectAll('g.hovertext').each(function() {
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
            Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(done);
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

            expect(d3.select(gd).selectAll('g.hovertext').size()).toBe(2);
            expect(d3.select(gd).selectAll('g.axistext').size()).toBe(1);
        })
        .catch(failTest)
        .then(done);
    });
});


describe('hover info on overlaid subplots', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    it('should respond to hover', function(done) {
        var mock = require('@mocks/autorange-tozero-rangemode.json');

        Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(function() {
            mouseEvent('mousemove', 768, 345);

            assertHoverLabelContent({
                nums: ['0.35', '2,352.5'],
                name: ['Take Rate', 'Revenue'],
                axis: '1'
            });
        })
        .then(done);
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

        Plotly.plot(gd, data, layout).then(function() {
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
        .then(done);
    });
});

describe('hover on fill', function() {
    'use strict';

    afterEach(destroyGraphDiv);

    function assertLabelsCorrect(mousePos, labelPos, labelText) {
        Lib.clearThrottle();
        mouseEvent('mousemove', mousePos[0], mousePos[1]);

        var hoverText = d3.selectAll('g.hovertext');
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

        Plotly.plot(createGraphDiv(), mock.data, mock.layout).then(function() {
            assertLabelsCorrect([242, 142], [252, 133.8], 'trace 2');
            assertLabelsCorrect([242, 292], [233, 210], 'trace 1');
            assertLabelsCorrect([147, 252], [158.925, 248.1], 'trace 0');
        }).then(done);
    });

    it('should always show one label in the right place (symmetric fill edge case)', function(done) {
        var gd = createGraphDiv();

        Plotly.plot(gd, [{
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
        .catch(failTest)
        .then(done);
    });

    it('should work for scatterternary too', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/ternary_fill.json'));
        var gd = createGraphDiv();

        Plotly.plot(gd, mock.data, mock.layout).then(function() {
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
        .catch(failTest)
        .then(done);
    });

    it('should act like closest mode on ternary when cartesian is in compare mode', function(done) {
        var mock = Lib.extendDeep({}, require('@mocks/ternary_fill.json'));
        var gd = createGraphDiv();

        mock.data.push({y: [7, 8, 9]});
        mock.layout.xaxis = {domain: [0.8, 1], visible: false};
        mock.layout.yaxis = {domain: [0.8, 1], visible: false};

        Plotly.plot(gd, mock.data, mock.layout).then(function() {
            expect(gd._fullLayout.hovermode).toBe('x');

            // hover over a point when that's closest, even if you're over
            // a fill, because by default we have hoveron='points+fills'
            assertLabelsCorrect([237, 150], [240.0, 144],
                'trace 2Component A: 0.8Component B: 0.1Component C: 0.1');

            // hovers over fills
            assertLabelsCorrect([237, 170], [247.7, 166], 'trace 2');

            // hover on the cartesian trace in the corner
            assertLabelsCorrect([363, 122], [363, 122], 'trace 38');
        })
        .catch(failTest)
        .then(done);
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

        var hoverText = d3.selectAll('g.hovertext');
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
        Plotly.plot(gd, mock).then(function() {
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
        .catch(failTest)
        .then(done);
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

        Plotly.plot(gd, [{
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
});

describe('Test hover label custom styling:', function() {
    afterEach(destroyGraphDiv);

    function assertLabel(className, expectation) {
        var g = d3.select('g.' + className);

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

        Plotly.plot(gd, [{
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
        .catch(failTest)
        .then(done);
    });

    it('should work for x/y cartesian traces (multi-trace case)', function(done) {
        var gd = createGraphDiv();

        function assertNameLabel(expectation) {
            var g = d3.selectAll('g.hovertext > text.name');

            if(expectation === null) {
                expect(g.size()).toBe(0);
            } else {
                g.each(function(_, i) {
                    var textStyle = window.getComputedStyle(this);
                    expect(textStyle.fill).toBe(expectation.color[i]);
                });
            }
        }

        Plotly.plot(gd, [{
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
        .catch(failTest)
        .then(done);
    });

    it('should work for 2d z cartesian traces', function(done) {
        var gd = createGraphDiv();

        Plotly.plot(gd, [{
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
        .catch(failTest)
        .then(done);
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
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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

        it('responds to hoverdistance change', function() {
            var gd = document.getElementById('graph');
            var evt = { xpx: 475, ypx: 180 };
            Plotly.relayout(gd, 'hoverdistance', 30);

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

        it('correctly responds to setting the hoverdistance to -1 by increasing ' +
            'the range of search for points to hover to Infinity', function() {
            var gd = document.getElementById('graph');
            var evt = { xpx: 475, ypx: 180 };
            Plotly.relayout(gd, 'hoverdistance', -1);

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
    });

    describe('x hovermode', function() {
        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.hovermode = 'x';

        beforeEach(function(done) {
            Plotly.plot(createGraphDiv(), mockCopy.data, mockCopy.layout).then(done);
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

        it('responds to hoverdistance change from 10 to 30 (part 1)', function() {
            var gd = document.getElementById('graph');
            var evt = { xpx: 450, ypx: 155 };
            Plotly.relayout(gd, 'hoverdistance', 10);

            Fx.hover('graph', evt, 'xy');

            expect(gd._hoverdata).toEqual(undefined);
        });

        it('responds to hoverdistance change from 10 to 30 (part 2)', function() {
            var gd = document.getElementById('graph');
            var evt = { xpx: 450, ypx: 155 };
            Plotly.relayout(gd, 'hoverdistance', 30);

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

        it('responds to hoverdistance change from default to 0 (part 2)', function() {
            var gd = document.getElementById('graph');
            var evt = { xpx: 475, ypx: 155 };
            Plotly.relayout(gd, 'hoverdistance', 0);

            Fx.hover('graph', evt, 'xy');

            expect(gd._hoverdata).toEqual(undefined);
        });

        it('responds to setting the hoverdistance to -1 by increasing ' +
        'the range of search for points to hover to Infinity (part 1)', function() {
            var gd = document.getElementById('graph');
            var evt = { xpx: 450, ypx: 155 };
            Fx.hover('graph', evt, 'xy');

            expect(gd._hoverdata).toEqual(undefined);
        });

        it('responds to setting the hoverdistance to -1 by increasing ' +
            'the range of search for points to hover to Infinity (part 2)', function() {
            var gd = document.getElementById('graph');
            var evt = { xpx: 450, ypx: 155 };
            Plotly.relayout(gd, 'hoverdistance', -1);

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

            Plotly.plot(gd, [{
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
            .catch(failTest)
            .then(done);
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
            Plotly.relayout(gd, 'hovermode', 'closest').then(function() {
                _hover(gd, { xval: 1.9, yval: 1 });
                assertHoverLabelContent({
                    nums: '(2, 1)',
                    name: 'trace 0',
                    axis: '',
                    isRotated: false
                });
            })
            .catch(failTest)
            .then(done);
        });
    });

    describe('when mulitple pts are picked', function() {
        afterAll(destroyGraphDiv);

        beforeAll(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, [{
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
            .catch(failTest)
            .then(done);
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
            Plotly.relayout(gd, 'hovermode', 'closest').then(function() {
                _hover(gd, { xval: 1.9, yval: 1 });
                assertHoverLabelContent({
                    nums: '(2, 1)',
                    // N.B. only showing the 'top' trace
                    name: 'trace 1',
                    axis: '',
                    isRotated: false
                });
            })
            .catch(failTest)
            .then(done);
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
        Plotly.plot(gd, [{ x: [1, 2, 3], y: [4, 5, 6] }], { clickmode: 'event+select' })
          .then(function() {
              expect(gd._fullLayout.hovermode).toBe('closest');
          })
          .catch(failTest)
          .then(done);
    });

    it('\'x\' for horizontal cartesian plots if clickmode lacks \'select\'', function(done) {
        Plotly.plot(gd, [{ x: [1, 2, 3], y: [4, 5, 6], type: 'bar', orientation: 'h' }], { clickmode: 'event' })
          .then(function() {
              expect(gd._fullLayout.hovermode).toBe('y');
          })
          .catch(failTest)
          .then(done);
    });

    it('\'y\' for vertical cartesian plots if clickmode lacks \'select\'', function(done) {
        Plotly.plot(gd, [{ x: [1, 2, 3], y: [4, 5, 6], type: 'bar', orientation: 'v' }], { clickmode: 'event' })
          .then(function() {
              expect(gd._fullLayout.hovermode).toBe('x');
          })
          .catch(failTest)
          .then(done);
    });

    it('\'closest\' for a non-cartesian plot', function(done) {
        var mock = require('@mocks/polar_scatter.json');
        expect(mock.layout.hovermode).toBeUndefined();

        Plotly.plot(gd, mock.data, mock.layout)
          .then(function() {
              expect(gd._fullLayout.hovermode).toBe('closest');
          })
          .catch(failTest)
          .then(done);
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
                Plotly.plot(gd, data, layout).then(done);
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
                    .catch(failTest)
                    .then(done);
            });
        });
    });
});
