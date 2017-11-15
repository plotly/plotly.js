var Plotly = require('@lib');
var Lib = require('@src/lib');

var supplyLayoutDefaults = require('@src/plots/ternary/layout/defaults');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var click = require('../assets/click');
var doubleClick = require('../assets/double_click');
var getClientPosition = require('../assets/get_client_position');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

describe('ternary plots', function() {
    'use strict';

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

        it('should be able to restyle', function(done) {
            Plotly.restyle(gd, { a: [[1, 2, 3]]}, 0).then(function() {
                var transforms = [];
                d3.selectAll('.ternary .point').each(function() {
                    var point = d3.select(this);
                    transforms.push(point.attr('transform'));
                });

                expect(transforms).toEqual([
                    'translate(186.45,209.8)',
                    'translate(118.53,170.59)',
                    'translate(248.76,117.69)'
                ]);
            }).then(done);
        });

        it('should display to hover labels', function(done) {
            mouseEvent('mousemove', blankPos[0], blankPos[1]);
            assertHoverLabelContent([null, null], 'only on data points');

            function check(content, style, msg) {
                Lib.clearThrottle();
                mouseEvent('mousemove', pointPos[0], pointPos[1]);

                assertHoverLabelContent({nums: content}, msg);
                assertHoverLabelStyle(d3.select('g.hovertext'), style, msg);
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
            .catch(fail)
            .then(done);
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
                'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex',
                'xaxis', 'yaxis', 'a', 'b', 'c'
            ], 'returning the correct event data keys');
            expect(hoverData.curveNumber).toEqual(0, 'returning the correct curve number');
            expect(hoverData.pointNumber).toEqual(0, 'returning the correct point number');

            mouseEvent('mouseout', pointPos[0], pointPos[1]);
            expect(unhoverData).not.toBe(undefined, 'firing on data points');
            expect(Object.keys(unhoverData)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex',
                'xaxis', 'yaxis', 'a', 'b', 'c'
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
                'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex',
                'xaxis', 'yaxis', 'a', 'b', 'c'
            ], 'returning the correct event data keys');
            expect(ptData.curveNumber).toEqual(0, 'returning the correct curve number');
            expect(ptData.pointNumber).toEqual(0, 'returning the correct point number');
        });

        it('should respond zoom drag interactions', function(done) {
            assertRange(gd, [0.231, 0.2, 0.11]);

            drag([[383, 213], [293, 243]]);
            assertRange(gd, [0.4435, 0.2462, 0.1523]);

            doubleClick(pointPos[0], pointPos[1]).then(function() {
                assertRange(gd, [0, 0, 0]);

                done();
            });
        });
    });

    describe('static plots', function() {
        var mock = require('@mocks/ternary_simple.json');
        var gd;

        beforeEach(function(done) {
            gd = createGraphDiv();

            var mockCopy = Lib.extendDeep({}, mock);
            var config = { staticPlot: true };

            Plotly.plot(gd, mockCopy.data, mockCopy.layout, config).then(done);
        });

        it('should not respond to drag', function(done) {
            var range = [0.231, 0.2, 0.11];

            assertRange(gd, range);

            drag([[390, 220], [300, 250]]);
            assertRange(gd, range);

            doubleClick(390, 220).then(function() {
                assertRange(gd, range);

                done();
            });
        });
    });

    it('should be able to reorder axis layers when relayout\'ing *layer*', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('@mocks/ternary_simple.json'));
        var dflt = [
            'draglayer', 'plotbg', 'backplot', 'grids',
            'frontplot',
            'aaxis', 'aline', 'baxis', 'bline', 'caxis', 'cline'
        ];

        function _assert(layers) {
            var toplevel = d3.selectAll('g.ternary > .toplevel');

            expect(toplevel.size()).toBe(layers.length, '# of layer');

            toplevel.each(function(d, i) {
                var className = d3.select(this)
                    .attr('class')
                    .split('toplevel ')[1];

                expect(className).toBe(layers[i], 'layer ' + i);
            });
        }

        Plotly.plot(gd, fig).then(function() {
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
        .catch(fail)
        .then(done);
    });

    function countTernarySubplot() {
        return d3.selectAll('.ternary').size();
    }

    function countTraces(type) {
        return d3.selectAll('.ternary').selectAll('g.trace.' + type).size();
    }

    function drag(path) {
        var len = path.length;

        mouseEvent('mousemove', path[0][0], path[0][1]);
        mouseEvent('mousedown', path[0][0], path[0][1]);

        path.slice(1, len).forEach(function(pt) {
            mouseEvent('mousemove', pt[0], pt[1]);
        });

        mouseEvent('mouseup', path[len - 1][0], path[len - 1][1]);
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

describe('ternary defaults', function() {
    'use strict';

    var layoutIn, layoutOut, fullData;

    beforeEach(function() {
        layoutOut = {
            font: { color: 'red' }
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
        expect(layoutOut.ternary.aaxis.title).toEqual('Component A');
        expect(layoutOut.ternary.baxis.title).toEqual('Component B');
        expect(layoutOut.ternary.caxis.title).toEqual('Component C');
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
    var mock = require('@mocks/ternary_simple.json');

    var mockCopy, gd;

    var blankPos = [10, 10],
        pointPos;

    beforeAll(function(done) {
        gd = createGraphDiv();
        mockCopy = Lib.extendDeep({}, mock);
        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
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

            var pt = futureData.points[0],
                evt = futureData.event;

            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex',
                'xaxis', 'yaxis', 'a', 'b', 'c'
            ]);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            expect(typeof pt.xaxis).toEqual(typeof {}, 'points[0].xaxis');
            expect(typeof pt.yaxis).toEqual(typeof {}, 'points[0].yaxis');
            expect(pt.a).toEqual(2, 'points[0].a');
            expect(pt.b).toEqual(1, 'points[0].b');
            expect(pt.c).toEqual(1, 'points[0].c');

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

            var pt = futureData.points[0],
                evt = futureData.event;

            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex',
                'xaxis', 'yaxis', 'a', 'b', 'c'
            ]);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            expect(typeof pt.xaxis).toEqual(typeof {}, 'points[0].xaxis');
            expect(typeof pt.yaxis).toEqual(typeof {}, 'points[0].yaxis');
            expect(pt.a).toEqual(2, 'points[0].a');
            expect(pt.b).toEqual(1, 'points[0].b');
            expect(pt.c).toEqual(1, 'points[0].c');

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
            mouseEvent('mousemove', blankPos[0], blankPos[1]);
            mouseEvent('mousemove', pointPos[0], pointPos[1]);

            var pt = futureData.points[0],
                evt = futureData.event,
                xaxes0 = futureData.xaxes[0],
                xvals0 = futureData.xvals[0],
                yaxes0 = futureData.yaxes[0],
                yvals0 = futureData.yvals[0];

            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex',
                'xaxis', 'yaxis', 'a', 'b', 'c'
            ]);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            expect(typeof pt.xaxis).toEqual(typeof {}, 'points[0].xaxis');
            expect(typeof pt.yaxis).toEqual(typeof {}, 'points[0].yaxis');
            expect(pt.a).toEqual(2, 'points[0].a');
            expect(pt.b).toEqual(1, 'points[0].b');
            expect(pt.c).toEqual(1, 'points[0].c');

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
            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_unhover', function(data) {
                futureData = data;
            });
        });

        it('should contain the correct fields', function() {
            mouseEvent('mousemove', blankPos[0], blankPos[1]);
            mouseEvent('mousemove', pointPos[0], pointPos[1]);
            mouseEvent('mouseout', pointPos[0], pointPos[1]);

            var pt = futureData.points[0],
                evt = futureData.event;

            expect(Object.keys(pt)).toEqual([
                'data', 'fullData', 'curveNumber', 'pointNumber', 'pointIndex',
                'xaxis', 'yaxis', 'a', 'b', 'c'
            ]);

            expect(pt.curveNumber).toEqual(0, 'points[0].curveNumber');
            expect(typeof pt.data).toEqual(typeof {}, 'points[0].data');
            expect(typeof pt.fullData).toEqual(typeof {}, 'points[0].fullData');
            expect(pt.pointNumber).toEqual(0, 'points[0].pointNumber');
            expect(typeof pt.xaxis).toEqual(typeof {}, 'points[0].xaxis');
            expect(typeof pt.yaxis).toEqual(typeof {}, 'points[0].yaxis');
            expect(pt.a).toEqual(2, 'points[0].a');
            expect(pt.b).toEqual(1, 'points[0].b');
            expect(pt.c).toEqual(1, 'points[0].c');

            expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
            expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
        });
    });
});
