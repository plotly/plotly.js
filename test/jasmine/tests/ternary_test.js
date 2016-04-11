var Plotly = require('@lib');
var Lib = require('@src/lib');
var DBLCLICKDELAY = require('@src/plots/cartesian/constants').DBLCLICKDELAY;

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var customMatchers = require('../assets/custom_matchers');


describe('ternary plots', function() {
    'use strict';

    beforeAll(function() {
        jasmine.addMatchers(customMatchers);
    });

    afterEach(destroyGraphDiv);

    describe('with scatterternary trace(s)', function() {
        var mock = require('@mocks/ternary_simple.json');
        var gd;

        var pointPos = [391, 219];
        var blankPos = [200, 200];

        beforeEach(function(done) {
            gd = createGraphDiv();

            var mockCopy = Lib.extendDeep({}, mock);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
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

                done();
            });
        });

        it('should be able to delete and add traces', function(done) {
            expect(countTernarySubplot()).toEqual(1);
            expect(countTraces('scatter')).toEqual(1);

            Plotly.deleteTraces(gd, [0]).then(function() {
                expect(countTernarySubplot()).toEqual(0);
                expect(countTraces('scatter')).toEqual(0);

                var trace = Lib.extendDeep({}, mock.data[0]);

                return Plotly.addTraces(gd, [trace]);
            }).then(function() {
                expect(countTernarySubplot()).toEqual(1);
                expect(countTraces('scatter')).toEqual(1);

                var trace = Lib.extendDeep({}, mock.data[0]);

                return Plotly.addTraces(gd, [trace]);
            }).then(function() {
                expect(countTernarySubplot()).toEqual(1);
                expect(countTraces('scatter')).toEqual(2);

                return Plotly.deleteTraces(gd, [0]);
            }).then(function() {
                expect(countTernarySubplot()).toEqual(1);
                expect(countTraces('scatter')).toEqual(1);

                done();
            });
        });

        it('should display to hover labels', function() {
            var hoverLabels;

            mouseEvent('mousemove', blankPos[0], blankPos[1]);
            hoverLabels = findHoverLabels();
            expect(hoverLabels.size()).toEqual(0, 'only on data points');

            mouseEvent('mousemove', pointPos[0], pointPos[1]);
            hoverLabels = findHoverLabels();
            expect(hoverLabels.size()).toEqual(1, 'one per data point');

            var rows = hoverLabels.selectAll('tspan');
            expect(rows[0][0].innerHTML).toEqual('Component A: 0.5', 'with correct text');
            expect(rows[0][1].innerHTML).toEqual('B: 0.25', 'with correct text');
            expect(rows[0][2].innerHTML).toEqual('Component C: 0.25', 'with correct text');
        });

        it('should respond to hover interactions by', function() {
            var hoverCnt = 0,
                unhoverCnt = 0;

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
            expect(Object.keys(hoverData)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber',
                'x', 'y', 'xaxis', 'yaxis'
            ], 'returning the correct event data keys');
            expect(hoverData.curveNumber).toEqual(0, 'returning the correct curve number');
            expect(hoverData.pointNumber).toEqual(0, 'returning the correct point number');

            mouseEvent('mouseout', pointPos[0], pointPos[1]);
            expect(unhoverData).not.toBe(undefined, 'firing on data points');
            expect(Object.keys(unhoverData)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber',
                'x', 'y', 'xaxis', 'yaxis'
            ], 'returning the correct event data keys');
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
            expect(Object.keys(ptData)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber',
                'x', 'y', 'xaxis', 'yaxis'
            ], 'returning the correct event data keys');
            expect(ptData.curveNumber).toEqual(0, 'returning the correct curve number');
            expect(ptData.pointNumber).toEqual(0, 'returning the correct point number');
        });

        it('should respond zoom drag interactions', function(done) {
            assertRange(gd, [0.231, 0.2, 0.11]);

            Plotly.relayout(gd, 'ternary.aaxis.min', 0.1).then(function() {
                assertRange(gd, [0.1, 0.2, 0.11]);

                return doubleClick(pointPos[0], pointPos[1]);
            }).then(function() {
                assertRange(gd, [0, 0, 0]);

                done();
            });
        });

    });

    function countTernarySubplot() {
        return d3.selectAll('.ternary').size();
    }

    function countTraces(type) {
        return d3.selectAll('.ternary').selectAll('g.trace.' + type).size();
    }

    function findHoverLabels() {
        return d3.select('.hoverlayer').selectAll('g');
    }

    function click(x, y) {
        mouseEvent('mousemove', x, y);
        mouseEvent('mousedown', x, y);
        mouseEvent('mouseup', x, y);
    }

    function doubleClick(x, y) {
        return new Promise(function(resolve) {
            click(x, y);

            setTimeout(function() {
                click(x, y);
                resolve();
            }, DBLCLICKDELAY / 2);
        });
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
