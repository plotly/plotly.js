var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var click = require('../assets/click');
var getClientPosition = require('../assets/get_client_position');
var mouseEvent = require('../assets/mouse_event');
var supplyAllDefaults = require('../assets/supply_defaults');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;


describe('Pie defaults', function() {
    function _supply(trace) {
        var gd = {
            data: [trace],
            layout: {}
        };

        supplyAllDefaults(gd);

        return gd._fullData[0];
    }

    it('finds the minimum length of labels & values', function() {
        var out = _supply({type: 'pie', labels: ['A', 'B'], values: [1, 2, 3]});
        expect(out._length).toBe(2);

        out = _supply({type: 'pie', labels: ['A', 'B', 'C'], values: [1, 2]});
        expect(out._length).toBe(2);
    });

    it('allows labels or values to be missing but not both', function() {
        var out = _supply({type: 'pie', values: [1, 2]});
        expect(out.visible).toBe(true);
        expect(out._length).toBe(2);
        expect(out.label0).toBe(0);
        expect(out.dlabel).toBe(1);

        out = _supply({type: 'pie', labels: ['A', 'B']});
        expect(out.visible).toBe(true);
        expect(out._length).toBe(2);

        out = _supply({type: 'pie'});
        expect(out.visible).toBe(false);
    });

    it('is marked invisible if either labels or values is empty', function() {
        var out = _supply({type: 'pie', labels: [], values: [1, 2]});
        expect(out.visible).toBe(false);

        out = _supply({type: 'pie', labels: ['A', 'B'], values: []});
        expect(out.visible).toBe(false);
    });
});

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

    it('can sum values or count labels', function(done) {
        Plotly.newPlot(gd, [{
            labels: ['a', 'b', 'c', 'a', 'b', 'a'],
            values: [1, 2, 3, 4, 5, 6],
            type: 'pie',
            domain: {x: [0, 0.45]}
        }, {
            labels: ['d', 'e', 'f', 'd', 'e', 'd'],
            type: 'pie',
            domain: {x: [0.55, 1]}
        }])
        .then(function() {
            var expected = [
                [['a', 11], ['b', 7], ['c', 3]],
                [['d', 3], ['e', 2], ['f', 1]]
            ];
            for(var i = 0; i < 2; i++) {
                for(var j = 0; j < 3; j++) {
                    expect(gd.calcdata[i][j].label).toBe(expected[i][j][0], i + ',' + j);
                    expect(gd.calcdata[i][j].v).toBe(expected[i][j][1], i + ',' + j);
                }
            }
        })
        .catch(failTest)
        .then(done);
    });

    function _checkSliceColors(colors) {
        return function() {
            d3.select(gd).selectAll('.slice path').each(function(d, i) {
                expect(this.style.fill.replace(/(\s|rgb\(|\))/g, '')).toBe(colors[i], i);
            });
        };
    }

    it('propagates explicit colors to the same labels in earlier OR later traces', function(done) {
        var data1 = [
            {type: 'pie', values: [3, 2], marker: {colors: ['red', 'black']}, domain: {x: [0.5, 1]}},
            {type: 'pie', values: [2, 5], domain: {x: [0, 0.5]}}
        ];
        var data2 = Lib.extendDeep([], [data1[1], data1[0]]);

        Plotly.newPlot(gd, data1)
        .then(_checkSliceColors(['255,0,0', '0,0,0', '0,0,0', '255,0,0']))
        .then(function() {
            return Plotly.newPlot(gd, data2);
        })
        .then(_checkSliceColors(['0,0,0', '255,0,0', '255,0,0', '0,0,0']))
        .catch(failTest)
        .then(done);
    });

    it('can use a separate pie colorway and disable extended colors', function(done) {
        Plotly.newPlot(gd, [{type: 'pie', values: [7, 6, 5, 4, 3, 2, 1]}], {colorway: ['#777', '#F00']})
        .then(_checkSliceColors(['119,119,119', '255,0,0', '170,170,170', '255,102,102', '68,68,68', '153,0,0', '119,119,119']))
        .then(function() {
            return Plotly.relayout(gd, {extendpiecolors: false});
        })
        .then(_checkSliceColors(['119,119,119', '255,0,0', '119,119,119', '255,0,0', '119,119,119', '255,0,0', '119,119,119']))
        .then(function() {
            return Plotly.relayout(gd, {piecolorway: ['#FF0', '#0F0', '#00F']});
        })
        .then(_checkSliceColors(['255,255,0', '0,255,0', '0,0,255', '255,255,0', '0,255,0', '0,0,255', '255,255,0']))
        .then(function() {
            return Plotly.relayout(gd, {extendpiecolors: null});
        })
        .then(_checkSliceColors(['255,255,0', '0,255,0', '0,0,255', '255,255,102', '102,255,102', '102,102,255', '153,153,0']))
        .catch(failTest)
        .then(done);
    });

    it('shows multiline title in hole', function(done) {
        Plotly.newPlot(gd, [{
            values: [2, 2, 2, 2],
            title: 'Test<br>Title',
            hole: 0.5,
            type: 'pie',
            textinfo: 'none'
        }], {height: 300, width: 300})
        .then(function() {
            var title = d3.selectAll('.titletext text');
            expect(title.size()).toBe(1);
            var titlePos = getClientPosition('g.titletext');
            var pieCenterPos = getClientPosition('g.trace');
            expect(Math.abs(titlePos[0] - pieCenterPos[0])).toBeLessThan(2);
            expect(Math.abs(titlePos[1] - pieCenterPos[1])).toBeLessThan(2);
        })
        .catch(failTest)
        .then(done);
    });

    function _verifyPointInCircle(x, y, circleCenter, radius) {
        var dist = Math.pow(x - circleCenter[0], 2) + Math.pow(y - circleCenter[1], 2);
        return Math.abs(Math.sqrt(dist) - radius);
    }

    it('scales multiline title to fit in hole', function(done) {
        Plotly.newPlot(gd, [{
            values: [2, 2, 2, 2],
            title: 'Test<br>Title',
            titleposition: 'middle center',
            titlefont: {
                size: 60
            },
            hole: 0.1,
            type: 'pie',
            textinfo: 'none'
        }], {height: 300, width: 300})
        .then(function() {
            var title = d3.selectAll('.titletext text');
            expect(title.size()).toBe(1);
            var titleBox = d3.select('g.titletext').node().getBoundingClientRect();
            var pieBox = d3.select('g.trace').node().getBoundingClientRect();
            var radius = 0.1 * Math.min(pieBox.width / 2, pieBox.height / 2);
            var pieCenterPos = getClientPosition('g.trace');
            // unfortunately boundingClientRect is inaccurate and so we allow an error of 2
            expect(_verifyPointInCircle(titleBox.left, titleBox.top, pieCenterPos, radius))
                .toBeLessThan(2);
            expect(_verifyPointInCircle(titleBox.right, titleBox.top, pieCenterPos, radius))
                .toBeLessThan(2);
            expect(_verifyPointInCircle(titleBox.left, titleBox.bottom, pieCenterPos, radius))
                .toBeLessThan(2);
            expect(_verifyPointInCircle(titleBox.right, titleBox.bottom, pieCenterPos, radius))
                .toBeLessThan(2);
        })
        .catch(failTest)
        .then(done);
    });

    function _verifyTitle(checkLeft, checkRight, checkTop, checkBottom, checkMiddleX) {
        return function() {
            var title = d3.selectAll('.titletext text');
            expect(title.size()).toBe(1);
            var titleBox = d3.select('g.titletext').node().getBoundingClientRect();
            var pieBox = d3.select('g.trace').node().getBoundingClientRect();
            // check that margins agree. we leave an error margin of 2.
            if(checkLeft) expect(Math.abs(titleBox.left - pieBox.left)).toBeLessThan(2);
            if(checkRight) expect(Math.abs(titleBox.right - pieBox.right)).toBeLessThan(2);
            if(checkTop) expect(Math.abs(titleBox.top - pieBox.top)).toBeLessThan(2);
            if(checkBottom) expect(Math.abs(titleBox.bottom - pieBox.bottom)).toBeLessThan(2);
            if(checkMiddleX) {
                expect(Math.abs(titleBox.left + titleBox.right - pieBox.left - pieBox.right))
                    .toBeLessThan(2);
            }
        };
    }

    it('shows title top center if hole is zero', function(done) {
        Plotly.newPlot(gd, [{
            values: [2, 2, 2, 2],
            title: 'Test<BR>Title',
            titleposition: 'middle center',
            titlefont: {
                size: 12
            },
            hole: 0,
            type: 'pie',
            textinfo: 'none'
        }], {height: 300, width: 300})
        .then(_verifyTitle(false, false, true, false, true))
        .catch(failTest)
        .then(done);
    });

    it('shows title top center if titleposition is undefined and no hole', function(done) {
        Plotly.newPlot(gd, [{
            values: [2, 2, 2, 2],
            title: 'Test<BR>Title',
            titlefont: {
                size: 12
            },
            type: 'pie',
            textinfo: 'none'
        }], {height: 300, width: 300})
        .then(_verifyTitle(false, false, true, false, true))
        .catch(failTest)
        .then(done);
    });

    it('shows title top center', function(done) {
        Plotly.newPlot(gd, [{
            values: [1, 1, 1, 1, 2],
            title: 'Test<BR>Title',
            titleposition: 'top center',
            titlefont: {
                size: 12
            },
            type: 'pie',
            textinfo: 'none'
        }], {height: 300, width: 300})
        .then(_verifyTitle(false, false, true, false, true))
        .catch(failTest)
        .then(done);
    });

    it('shows title top left', function(done) {
        Plotly.newPlot(gd, [{
            values: [3, 2, 1],
            title: 'Test<BR>Title',
            titleposition: 'top left',
            titlefont: {
                size: 12
            },
            type: 'pie',
            textinfo: 'none'
        }], {height: 300, width: 300})
        .then(_verifyTitle(true, false, true, false, false))
        .catch(failTest)
        .then(done);
    });

    it('shows title top right', function(done) {
        Plotly.newPlot(gd, [{
            values: [4, 5, 6, 5],
            title: 'Test<BR>Title',
            titleposition: 'top right',
            titlefont: {
                size: 12
            },
            type: 'pie',
            textinfo: 'none'
        }], {height: 300, width: 300})
        .then(_verifyTitle(false, true, true, false, false))
        .catch(failTest)
        .then(done);
    });

    it('shows title bottom left', function(done) {
        Plotly.newPlot(gd, [{
            values: [4, 5, 6, 5],
            title: 'Test<BR>Title',
            titleposition: 'bottom left',
            titlefont: {
                size: 12
            },
            type: 'pie',
            textinfo: 'none'
        }], {height: 300, width: 300})
        .then(_verifyTitle(true, false, false, true, false))
        .catch(failTest)
        .then(done);
    });

    it('shows title bottom center', function(done) {
        Plotly.newPlot(gd, [{
            values: [4, 5, 6, 5],
            title: 'Test<BR>Title',
            titleposition: 'bottom center',
            titlefont: {
                size: 12
            },
            type: 'pie',
            textinfo: 'none'
        }], {height: 300, width: 300})
        .then(_verifyTitle(false, false, false, true, true))
        .catch(failTest)
        .then(done);
    });

    it('shows title bottom right', function(done) {
        Plotly.newPlot(gd, [{
            values: [4, 5, 6, 5],
            title: 'Test<BR>Title',
            titleposition: 'bottom right',
            titlefont: {
                size: 12
            },
            type: 'pie',
            textinfo: 'none'
        }], {height: 300, width: 300})
        .then(_verifyTitle(false, true, false, true, false))
        .catch(failTest)
        .then(done);
    });

    it('does not intersect pulled slices', function(done) {
        Plotly.newPlot(gd, [{
            values: [2, 2, 2, 2],
            title: 'Test<BR>Title',
            titleposition: 'top center',
            titlefont: {
                size: 14
            },
            pull: [0.9, 0.9, 0.9, 0.9],
            type: 'pie',
            textinfo: 'none'
        }], {height: 300, width: 300})
        .then(function() {
            var title = d3.selectAll('.titletext text');
            expect(title.size()).toBe(1);
            var titleBox = d3.select('g.titletext').node().getBoundingClientRect();
            var minSliceTop = Infinity;
            d3.selectAll('g.slice').each(function() {
                var sliceTop = d3.select(this).node().getBoundingClientRect().top;
                minSliceTop = Math.min(minSliceTop, sliceTop);
            });
            expect(titleBox.bottom).toBeLessThan(minSliceTop);
        })
        .catch(failTest)
        .then(done);
    });

    it('correctly positions large title', function(done) {
        Plotly.newPlot(gd, [{
            values: [1, 3, 4, 1, 2],
            title: 'Test<BR>Title',
            titleposition: 'top center',
            titlefont: {
                size: 60
            },
            type: 'pie',
            textinfo: 'none'
        }], {height: 300, width: 300})
        .then(_verifyTitle(false, false, true, false, true))
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
                'curveNumber', 'pointNumber', 'pointNumbers',
                'data', 'fullData',
                'label', 'color', 'value',
                'i', 'v'
            ];

            expect(Object.keys(hoverData.points[0]).sort()).toEqual(fields.sort());
            expect(hoverData.points[0].pointNumber).toEqual(3);

            expect(Object.keys(unhoverData.points[0]).sort()).toEqual(fields.sort());
            expect(unhoverData.points[0].pointNumber).toEqual(3);
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


describe('Test event data of interactions on a pie plot:', function() {
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
        Lib.extendFlat(mockCopy.data[0], {
            ids: ['marge', 'homer', 'bart', 'lisa', 'maggie'],
            customdata: [{1: 2}, {3: 4}, {5: 6}, {7: 8}, {9: 10}]
        });
    });

    afterEach(destroyGraphDiv);

    function checkEventData(data) {
        var point = data.points[0];

        expect(point.curveNumber).toBe(0);
        expect(point.pointNumber).toBe(4);
        expect(point.pointNumbers).toEqual([4]);
        expect(point.data).toBe(gd.data[0]);
        expect(point.fullData).toBe(gd._fullData[0]);
        expect(point.label).toBe('4');
        expect(point.value).toBe(5);
        expect(point.color).toBe('#1f77b4');
        expect(point.id).toEqual(['maggie']);
        expect(point.customdata).toEqual([{9: 10}]);

        // for backward compat - i/v to be removed at some point?
        expect(point.i).toBe(point.pointNumber);
        expect(point.v).toBe(point.value);

        var evt = data.event;
        expect(evt.clientX).toEqual(pointPos[0], 'event.clientX');
        expect(evt.clientY).toEqual(pointPos[1], 'event.clientY');
    }

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

            checkEventData(futureData);
        });

        it('should not contain pointNumber if aggregating', function() {
            var values = gd.data[0].values;
            var labels = [];
            for(var i = 0; i < values.length; i++) labels.push(i);
            Plotly.restyle(gd, {
                labels: [labels.concat(labels)],
                values: [values.concat(values)]
            });

            click(pointPos[0], pointPos[1]);
            expect(futureData.points.length).toEqual(1);

            expect(futureData.points[0].pointNumber).toBeUndefined();
            expect(futureData.points[0].i).toBeUndefined();
            expect(futureData.points[0].pointNumbers).toEqual([4, 9]);
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

        it('does not respond to right-click', function() {
            click(pointPos[0], pointPos[1], clickOpts);
            expect(futureData).toBe(undefined);

            // TODO: 'should contain the correct fields'
            // This test passed previously, but only because assets/click
            // incorrectly generated a click event for right click. It never
            // worked in reality.
            // expect(futureData.points.length).toEqual(1);

            // checkEventData(futureData);

            // var evt = futureData.event;
            // Object.getOwnPropertyNames(clickOpts).forEach(function(opt) {
            //     expect(evt[opt]).toEqual(clickOpts[opt], 'event.' + opt);
            // });
        });
    });

    describe('hover events', function() {
        var futureData;

        beforeEach(function(done) {
            futureData = undefined;
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_hover', function(data) {
                futureData = data;
            });
        });

        it('should contain the correct fields', function() {
            mouseEvent('mouseover', pointPos[0], pointPos[1]);

            checkEventData(futureData);
        });

        it('should not emit a hover if you\'re dragging', function() {
            gd._dragging = true;
            mouseEvent('mouseover', pointPos[0], pointPos[1]);
            expect(futureData).toBeUndefined();
        });

        it('should not emit a hover if hover is disabled', function() {
            Plotly.relayout(gd, 'hovermode', false);
            mouseEvent('mouseover', pointPos[0], pointPos[1]);
            expect(futureData).toBeUndefined();
        });
    });

    describe('unhover events', function() {
        var futureData;

        beforeEach(function(done) {
            futureData = undefined;
            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(done);

            gd.on('plotly_unhover', function(data) {
                futureData = data;
            });
        });

        it('should contain the correct fields', function() {
            mouseEvent('mouseover', pointPos[0], pointPos[1]);
            mouseEvent('mouseout', pointPos[0], pointPos[1]);

            checkEventData(futureData);
        });

        it('should not emit an unhover if you didn\'t first hover', function() {
            mouseEvent('mouseout', pointPos[0], pointPos[1]);
            expect(futureData).toBeUndefined();
        });
    });
});

describe('pie relayout', function() {
    var gd;

    beforeEach(function() { gd = createGraphDiv(); });

    afterEach(destroyGraphDiv);

    it('will update colors when colorway is updated', function(done) {
        var originalColors = [
            'rgb(255,0,0)',
            'rgb(0,255,0)',
            'rgb(0,0,255)',
        ];

        var relayoutColors = [
            'rgb(255,255,0)',
            'rgb(0,255,255)',
            'rgb(255,0,255)',
        ];

        function checkRelayoutColor(d, i) {
            expect(this.style.fill.replace(/\s/g, '')).toBe(relayoutColors[i]);
        }

        Plotly.newPlot(gd, [{
            labels: ['a', 'b', 'c', 'a', 'b', 'a'],
            type: 'pie'
        }], {
            colorway: originalColors
        })
        .then(function() {
            return Plotly.relayout(gd, 'colorway', relayoutColors);
        })
        .then(function() {
            var slices = d3.selectAll('.slice path');
            slices.each(checkRelayoutColor);
        })
        .then(done);
    });
});
