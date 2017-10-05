var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var click = require('../assets/click');
var getClientPosition = require('../assets/get_client_position');
var mouseEvent = require('../assets/mouse_event');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

describe('Pie traces:', function() {
    'use strict';

    var gd;

    beforeEach(function() { gd = createGraphDiv(); });

    afterEach(destroyGraphDiv);

    it('should separate colors and opacities', function(done) {
        Plotly.newPlot(gd, [{
            values: [1, 2, 3, 4, 5],
            type: 'pie',
            sort: false,
            marker: {
                line: {width: 3, color: 'rgba(100,100,100,0.7)'},
                colors: [
                    'rgba(0,0,0,0.2)',
                    'rgba(255,0,0,0.3)',
                    'rgba(0,255,0,0.4)',
                    'rgba(0,0,255,0.5)',
                    'rgba(255,255,0,0.6)'
                ]
            }
        }], {height: 300, width: 400}).then(function() {
            var colors = [
                'rgb(0,0,0)',
                'rgb(255,0,0)',
                'rgb(0,255,0)',
                'rgb(0,0,255)',
                'rgb(255,255,0)'
            ];
            var opacities = [0.2, 0.3, 0.4, 0.5, 0.6];

            function checkPath(d, i) {
                // strip spaces (ie 'rgb(0, 0, 0)') so we're not dependent on browser specifics
                expect(this.style.fill.replace(/\s/g, '')).toBe(colors[i]);
                expect(this.style.fillOpacity).toBe(String(opacities[i]));
                expect(this.style.stroke.replace(/\s/g, '')).toBe('rgb(100,100,100)');
                expect(this.style.strokeOpacity).toBe('0.7');
            }
            var slices = d3.selectAll('.slice path');
            slices.each(checkPath);
            expect(slices.size()).toBe(5);

            var legendEntries = d3.selectAll('.legendpoints path');
            legendEntries.each(checkPath);
            expect(legendEntries.size()).toBe(5);
        })
        .catch(failTest)
        .then(done);
    });
});

describe('pie hovering', function() {
    var mock = require('@mocks/pie_simple.json');

    describe('with hoverinfo set to none', function() {
        var mockCopy = Lib.extendDeep({}, mock),
            gd;

        mockCopy.data[0].hoverinfo = 'none';

        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(done);
        });

        afterEach(destroyGraphDiv);

        it('should fire hover event when moving from one slice to another', function(done) {
            var count = 0,
                hoverData = [];

            gd.on('plotly_hover', function(data) {
                count++;
                hoverData.push(data);
            });

            mouseEvent('mouseover', 173, 133);
            setTimeout(function() {
                mouseEvent('mouseover', 233, 193);
                expect(count).toEqual(2);
                expect(hoverData[0]).not.toEqual(hoverData[1]);
                done();
            }, 100);
        });

        it('should fire unhover event when the mouse moves off the graph', function(done) {
            var count = 0,
                unhoverData = [];

            gd.on('plotly_unhover', function(data) {
                count++;
                unhoverData.push(data);
            });

            mouseEvent('mouseover', 173, 133);
            mouseEvent('mouseout', 173, 133);
            setTimeout(function() {
                mouseEvent('mouseover', 233, 193);
                mouseEvent('mouseout', 233, 193);
                expect(count).toEqual(2);
                expect(unhoverData[0]).not.toEqual(unhoverData[1]);
                done();
            }, 100);
        });
    });

    describe('event data', function() {
        var mockCopy = Lib.extendDeep({}, mock),
            width = mockCopy.layout.width,
            height = mockCopy.layout.height,
            gd;

        beforeEach(function(done) {
            gd = createGraphDiv();

            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
                .then(done);
        });

        afterEach(destroyGraphDiv);

        it('should contain the correct fields', function() {

            /*
             * expected = [{
             *         v: 4,
             *         label: '3',
             *         color: '#ff7f0e',
             *         i: 3,
             *         hidden: false,
             *         text: '26.7%',
             *         px1: [0,-60],
             *         pxmid: [-44.588689528643656,-40.14783638153149],
             *         midangle: -0.8377580409572781,
             *         px0: [-59.67131372209641,6.2717077960592],
             *         largeArc: 0,
             *         cxFinal: 200,
             *         cyFinal: 160,
             *         originalEvent: MouseEvent
             *     }];
             */
            var hoverData,
                unhoverData;


            gd.on('plotly_hover', function(data) {
                hoverData = data;
            });

            gd.on('plotly_unhover', function(data) {
                unhoverData = data;
            });

            mouseEvent('mouseover', width / 2 - 7, height / 2 - 7);
            mouseEvent('mouseout', width / 2 - 7, height / 2 - 7);

            expect(hoverData.points.length).toEqual(1);
            expect(unhoverData.points.length).toEqual(1);

            var fields = [
                'v', 'label', 'color', 'i', 'hidden',
                'text', 'px1', 'pxmid', 'midangle',
                'px0', 'largeArc',
                'pointNumber', 'curveNumber',
                'cxFinal', 'cyFinal',
                'originalEvent'
            ];

            expect(Object.keys(hoverData.points[0])).toEqual(fields);
            expect(hoverData.points[0].i).toEqual(3);

            expect(Object.keys(unhoverData.points[0])).toEqual(fields);
            expect(unhoverData.points[0].i).toEqual(3);
        });

        it('should fire hover event when moving from one slice to another', function(done) {
            var count = 0,
                hoverData = [];

            gd.on('plotly_hover', function(data) {
                count++;
                hoverData.push(data);
            });

            mouseEvent('mouseover', 173, 133);
            setTimeout(function() {
                mouseEvent('mouseover', 233, 193);
                expect(count).toEqual(2);
                expect(hoverData[0]).not.toEqual(hoverData[1]);
                done();
            }, 100);
        });

        it('should fire unhover event when the mouse moves off the graph', function(done) {
            var count = 0,
                unhoverData = [];

            gd.on('plotly_unhover', function(data) {
                count++;
                unhoverData.push(data);
            });

            mouseEvent('mouseover', 173, 133);
            mouseEvent('mouseout', 173, 133);
            setTimeout(function() {
                mouseEvent('mouseover', 233, 193);
                mouseEvent('mouseout', 233, 193);
                expect(count).toEqual(2);
                expect(unhoverData[0]).not.toEqual(unhoverData[1]);
                done();
            }, 100);
        });
    });

    describe('labels', function() {
        var gd, mockCopy;

        beforeEach(function() {
            gd = createGraphDiv();
            mockCopy = Lib.extendDeep({}, mock);
        });

        afterEach(destroyGraphDiv);

        function _hover() {
            mouseEvent('mouseover', 223, 143);
            Lib.clearThrottle();
        }

        function assertLabel(content, style, msg) {
            assertHoverLabelContent({nums: content}, msg);

            if(style) {
                assertHoverLabelStyle(d3.select('.hovertext'), {
                    bgcolor: style[0],
                    bordercolor: style[1],
                    fontSize: style[2],
                    fontFamily: style[3],
                    fontColor: style[4]
                }, msg);
            }
        }

        it('should show the default selected values', function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
            .then(_hover)
            .then(function() {
                assertLabel(
                    ['4', '5', '33.3%'].join('\n'),
                    ['rgb(31, 119, 180)', 'rgb(255, 255, 255)', 13, 'Arial', 'rgb(255, 255, 255)'],
                    'initial'
                );

                return Plotly.restyle(gd, 'text', [['A', 'B', 'C', 'D', 'E']]);
            })
            .then(_hover)
            .then(function() {
                assertLabel(
                    ['4', 'E', '5', '33.3%'].join('\n'),
                    null,
                    'added text'
                );

                return Plotly.restyle(gd, 'hovertext', [[
                    'Apple', 'Banana', 'Clementine', 'Dragon Fruit', 'Eggplant'
                ]]);
            })
            .then(_hover)
            .then(function() {
                assertLabel(
                    ['4', 'Eggplant', '5', '33.3%'].join('\n'),
                    null,
                    'added hovertext'
                );

                return Plotly.restyle(gd, 'hovertext', 'SUP');
            })
            .then(_hover)
            .then(function() {
                assertLabel(
                    ['4', 'SUP', '5', '33.3%'].join('\n'),
                    null,
                    'constant hovertext'
                );

                return Plotly.restyle(gd, {
                    'hoverlabel.bgcolor': [['red', 'green', 'blue', 'yellow', 'red']],
                    'hoverlabel.bordercolor': 'yellow',
                    'hoverlabel.font.size': [[15, 20, 30, 20, 15]],
                    'hoverlabel.font.family': 'Roboto',
                    'hoverlabel.font.color': 'blue'
                });
            })
            .then(_hover)
            .then(function() {
                assertLabel(
                    ['4', 'SUP', '5', '33.3%'].join('\n'),
                    ['rgb(255, 0, 0)', 'rgb(255, 255, 0)', 15, 'Roboto', 'rgb(0, 0, 255)'],
                    'new styles'
                );

                return Plotly.restyle(gd, 'hoverinfo', [[null, null, null, null, 'label+percent']]);
            })
            .then(_hover)
            .then(function() {
                assertLabel(['4', '33.3%'].join('\n'), null, 'new hoverinfo');

                return Plotly.restyle(gd, 'hoverinfo', [[null, null, null, null, 'dont+know+what+im-doing']]);
            })
            .then(_hover)
            .then(function() {
                assertLabel(
                    ['4', 'SUP', '5', '33.3%'].join('\n'),
                    null,
                    'garbage hoverinfo'
                );
            })
            .catch(fail)
            .then(done);
        });

        it('should show the correct separators for values', function(done) {
            mockCopy.layout.separators = '@|';
            mockCopy.data[0].values[0] = 12345678.912;
            mockCopy.data[0].values[1] = 10000;

            Plotly.plot(gd, mockCopy.data, mockCopy.layout)
            .then(_hover)
            .then(function() {
                assertLabel('0\n12|345|678@91\n99@9%');
            })
            .then(done);
        });
    });
});


describe('Test event property of interactions on a pie plot:', function() {
    var mock = require('@mocks/pie_simple.json');

    var mockCopy, gd;

    var blankPos = [10, 10],
        pointPos;

    beforeAll(function(done) {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            pointPos = getClientPosition('g.slicetext');
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
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1]);
            expect(futureData).toBe(undefined);
        });

        it('should contain the correct fields', function() {
            click(pointPos[0], pointPos[1]);
            expect(futureData.points.length).toEqual(1);

            var trace = futureData.points.trace;
            expect(typeof trace).toEqual(typeof {}, 'points.trace');

            var pt = futureData.points[0];
            expect(Object.keys(pt)).toEqual(jasmine.arrayContaining([
                'v', 'label', 'color', 'i', 'hidden', 'vTotal', 'text', 't',
                'trace', 'r', 'cx', 'cy', 'px1', 'pxmid', 'midangle', 'px0',
                'largeArc', 'cxFinal', 'cyFinal',
                'pointNumber', 'curveNumber'
            ]));
            expect(Object.keys(pt).length).toBe(21);

            expect(typeof pt.color).toEqual(typeof '#1f77b4', 'points[0].color');
            expect(pt.cx).toEqual(200, 'points[0].cx');
            expect(pt.cxFinal).toEqual(200, 'points[0].cxFinal');
            expect(pt.cy).toEqual(160, 'points[0].cy');
            expect(pt.cyFinal).toEqual(160, 'points[0].cyFinal');
            expect(pt.hidden).toEqual(false, 'points[0].hidden');
            expect(pt.i).toEqual(4, 'points[0].i');
            expect(pt.pointNumber).toEqual(4, 'points[0].pointNumber');
            expect(pt.label).toEqual('4', 'points[0].label');
            expect(pt.largeArc).toEqual(0, 'points[0].largeArc');
            expect(pt.midangle).toEqual(1.0471975511965976, 'points[0].midangle');
            expect(pt.px0).toEqual([0, -60], 'points[0].px0');
            expect(pt.px1).toEqual([51.96152422706632, 29.999999999999986], 'points[0].px1');
            expect(pt.pxmid).toEqual([51.96152422706631, -30.000000000000007], 'points[0].pxmid');
            expect(pt.r).toEqual(60, 'points[0].r');
            expect(typeof pt.t).toEqual(typeof {}, 'points[0].t');
            expect(pt.text).toEqual('33.3%', 'points[0].text');
            expect(typeof pt.trace).toEqual(typeof {}, 'points[0].trace');
            expect(pt.v).toEqual(5, 'points[0].v');
            expect(pt.vTotal).toEqual(15, 'points[0].vTotal');
            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');

            var evt = futureData.event;
            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
        });
    });

    describe('modified click events', function() {
        var clickOpts = {
                altKey: true,
                ctrlKey: true,
                metaKey: true,
                shiftKey: true
            },
            futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_click', function(data) {
                futureData = data;
            });
        });

        it('should not be trigged when not on data points', function() {
            click(blankPos[0], blankPos[1], clickOpts);
            expect(futureData).toBe(undefined);
        });

        it('should contain the correct fields', function() {
            click(pointPos[0], pointPos[1], clickOpts);
            expect(futureData.points.length).toEqual(1);

            var trace = futureData.points.trace;
            expect(typeof trace).toEqual(typeof {}, 'points.trace');

            var pt = futureData.points[0];
            expect(Object.keys(pt)).toEqual(jasmine.arrayContaining([
                'v', 'label', 'color', 'i', 'hidden', 'vTotal', 'text', 't',
                'trace', 'r', 'cx', 'cy', 'px1', 'pxmid', 'midangle', 'px0',
                'largeArc', 'cxFinal', 'cyFinal',
                'pointNumber', 'curveNumber'
            ]));

            expect(typeof pt.color).toEqual(typeof '#1f77b4', 'points[0].color');
            expect(pt.cx).toEqual(200, 'points[0].cx');
            expect(pt.cxFinal).toEqual(200, 'points[0].cxFinal');
            expect(pt.cy).toEqual(160, 'points[0].cy');
            expect(pt.cyFinal).toEqual(160, 'points[0].cyFinal');
            expect(pt.hidden).toEqual(false, 'points[0].hidden');
            expect(pt.i).toEqual(4, 'points[0].i');
            expect(pt.pointNumber).toEqual(4, 'points[0].pointNumber');
            expect(pt.label).toEqual('4', 'points[0].label');
            expect(pt.largeArc).toEqual(0, 'points[0].largeArc');
            expect(pt.midangle).toEqual(1.0471975511965976, 'points[0].midangle');
            expect(pt.px0).toEqual([0, -60], 'points[0].px0');
            expect(pt.px1).toEqual([51.96152422706632, 29.999999999999986], 'points[0].px1');
            expect(pt.pxmid).toEqual([51.96152422706631, -30.000000000000007], 'points[0].pxmid');
            expect(pt.r).toEqual(60, 'points[0].r');
            expect(typeof pt.t).toEqual(typeof {}, 'points[0].t');
            expect(pt.text).toEqual('33.3%', 'points[0].text');
            expect(typeof pt.trace).toEqual(typeof {}, 'points[0].trace');
            expect(pt.v).toEqual(5, 'points[0].v');
            expect(pt.vTotal).toEqual(15, 'points[0].vTotal');
            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');

            var evt = futureData.event;
            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
            Object.getOwnPropertyNames(clickOpts).forEach(function(opt) {
                expect(evt[opt]).toEqual(clickOpts[opt], 'event.' + opt);
            });
        });
    });

    describe('hover events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_hover', function(data) {
                futureData = data;
            });
        });

        it('should contain the correct fields', function() {
            mouseEvent('mouseover', pointPos[0], pointPos[1]);

            var point0 = futureData.points[0],
                evt = futureData.event;
            expect(point0.originalEvent).toEqual(evt, 'points');
            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
        });
    });

    describe('unhover events', function() {
        var futureData;

        beforeEach(function(done) {
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_unhover', function(data) {
                futureData = data;
            });
        });

        it('should contain the correct fields', function() {
            mouseEvent('mouseout', pointPos[0], pointPos[1]);

            var point0 = futureData.points[0],
                evt = futureData.event;
            expect(point0.originalEvent).toEqual(evt, 'points');
            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
        });
    });
});
