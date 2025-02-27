var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');

var d3Select = require('../../strict-d3').select;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelStyle = customAssertions.assertHoverLabelStyle;
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

// cartesian click events events use the hover data
// from the mousemove events and then simulate
// a click event on mouseup
var click = require('../assets/timed_click');
var hover = require('../assets/hover');
var delay = require('../assets/delay');
var mouseEvent = require('../assets/mouse_event');

var mock0 = require('../../image/mocks/gl2d_scatter-continuous-clustering.json');
var mock1 = require('../../image/mocks/gl2d_14.json');

var mock2 = {
    data: [{
        x: [1, 2, 3, 4],
        y: [12, 3, 14, 4],
        type: 'scattergl',
        mode: 'markers'
    }, {
        x: [4, 5, 6, 7],
        y: [1, 31, 24, 14],
        type: 'scattergl',
        mode: 'markers'
    }, {
        x: [8, 9, 10, 11],
        y: [18, 13, 10, 3],
        type: 'scattergl',
        mode: 'markers'
    }],
    layout: {}
};

describe('Test hover and click interactions', function() {
    var gd;

    function makeHoverFn(gd, x, y) {
        return function() {
            return new Promise(function(resolve) {
                gd.on('plotly_hover', resolve);
                hover(x, y);
            });
        };
    }

    function makeClickFn(gd, x, y) {
        return function() {
            return new Promise(function(resolve) {
                gd.on('plotly_click', resolve);
                click(x, y);
            });
        };
    }

    function makeUnhoverFn(gd, x0, y0) {
        return function() {
            return new Promise(function(resolve) {
                var initialElement = document.elementFromPoint(x0, y0);
                // fairly realistic simulation of moving with the cursor
                var canceler = setInterval(function() {
                    x0 -= 2;
                    y0 -= 2;
                    hover(x0, y0);

                    var nowElement = document.elementFromPoint(x0, y0);
                    if(nowElement !== initialElement) {
                        mouseEvent('mouseout', x0, y0, {element: initialElement});
                    }
                }, 10);

                gd.on('plotly_unhover', function() {
                    clearInterval(canceler);
                    resolve('emitted plotly_unhover');
                });

                setTimeout(function() {
                    clearInterval(canceler);
                    resolve(null);
                }, 350);
            });
        };
    }

    function assertEventData(actual, expected, msg) {
        expect(actual.points.length).toEqual(1, 'points length');

        var pt = actual.points[0];

        expect(Object.keys(pt)).toEqual(jasmine.arrayContaining([
            'x', 'y', 'curveNumber', 'pointNumber',
            'data', 'fullData', 'xaxis', 'yaxis'
        ]), 'event data keys');

        expect(pt.xaxis.domain.length).toBe(2, msg + ' - xaxis');
        expect(pt.yaxis.domain.length).toBe(2, msg + ' - yaxis');

        expect(pt.x).toBe(expected.x, msg + ' - x');
        expect(pt.y).toBe(expected.y, msg + ' - y');
        expect(pt.curveNumber).toBe(expected.curveNumber, msg + ' - curve number');
        expect(String(pt.pointNumber)).toBe(String(expected.pointNumber), msg + ' - point number');
    }

    // returns basic hover/click/unhover runner for one xy position
    function makeRunner(pos, expected, opts) {
        opts = opts || {};

        var _hover = makeHoverFn(gd, pos[0], pos[1]);
        var _click = makeClickFn(gd, pos[0], pos[1]);

        var _unhover = opts.noUnHover ?
            function() { return 'emitted plotly_unhover'; } :
            makeUnhoverFn(gd, pos[0], pos[1]);

        return function() {
            return delay(100)()
                .then(_hover)
                .then(function(eventData) {
                    assertEventData(eventData, expected, opts.msg);

                    var g = d3Select('g.hovertext');
                    if(g.node() === null) {
                        expect(expected.noHoverLabel).toBe(true);
                    } else {
                        assertHoverLabelStyle(g, expected, opts.msg);
                    }
                    if(expected.label) {
                        assertHoverLabelContent({
                            nums: expected.label[0],
                            name: expected.label[1]
                        });
                    }
                })
                .then(_click)
                .then(function(eventData) {
                    assertEventData(eventData, expected, opts.msg);
                })
                .then(_unhover)
                .then(function(eventData) {
                    expect(eventData).toBe('emitted plotly_unhover', opts.msg);
                });
        };
    }

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function(done) {
        Plotly.purge(gd);
        destroyGraphDiv();
        setTimeout(done, 1500);
    });

    it('@gl should output correct event data for scattergl', function(done) {
        var _mock = Lib.extendDeep({}, mock1);

        _mock.layout.hoverlabel = {
            font: {
                size: 20,
                color: 'yellow'
            }
        };
        _mock.data[0].hoverinfo = _mock.data[0].x.map(function(_, i) { return i % 2 ? 'y' : 'x'; });

        _mock.data[0].hoverlabel = {
            bgcolor: 'blue',
            bordercolor: _mock.data[0].x.map(function(_, i) { return i % 2 ? 'red' : 'green'; })
        };

        var run = makeRunner([634, 321], {
            x: 15.772,
            y: 0.387,
            label: ['0.387', null],
            curveNumber: 0,
            pointNumber: 33,
            bgcolor: 'rgb(0, 0, 255)',
            bordercolor: 'rgb(255, 0, 0)',
            fontSize: 20,
            fontFamily: 'Arial',
            fontColor: 'rgb(255, 255, 0)'
        }, {
            msg: 'scattergl'
        });

        Plotly.newPlot(gd, _mock)
        .then(run)
        .then(done, done.fail);
    });

    it('@gl should output correct event data for scattergl in *select* dragmode', function(done) {
        var _mock = Lib.extendDeep({}, mock1);

        _mock.layout.dragmode = 'select';

        _mock.layout.hoverlabel = {
            font: {
                size: 20,
                color: 'yellow'
            }
        };
        _mock.data[0].hoverinfo = _mock.data[0].x.map(function(_, i) { return i % 2 ? 'y' : 'x'; });

        _mock.data[0].hoverlabel = {
            bgcolor: 'blue',
            bordercolor: _mock.data[0].x.map(function(_, i) { return i % 2 ? 'red' : 'green'; })
        };

        var run = makeRunner([634, 321], {
            x: 15.772,
            y: 0.387,
            label: ['0.387', null],
            curveNumber: 0,
            pointNumber: 33,
            bgcolor: 'rgb(0, 0, 255)',
            bordercolor: 'rgb(255, 0, 0)',
            fontSize: 20,
            fontFamily: 'Arial',
            fontColor: 'rgb(255, 255, 0)'
        }, {
            msg: 'scattergl'
        });

        Plotly.newPlot(gd, _mock)
        .then(run)
        .then(done, done.fail);
    });

    it('@gl should output correct event data for scattergl in *lasso* dragmode', function(done) {
        var _mock = Lib.extendDeep({}, mock1);

        _mock.layout.dragmode = 'lasso';

        _mock.layout.hoverlabel = {
            font: {
                size: 20,
                color: 'yellow'
            }
        };
        _mock.data[0].hoverinfo = _mock.data[0].x.map(function(_, i) { return i % 2 ? 'y' : 'x'; });

        _mock.data[0].hoverlabel = {
            bgcolor: 'blue',
            bordercolor: _mock.data[0].x.map(function(_, i) { return i % 2 ? 'red' : 'green'; })
        };

        var run = makeRunner([634, 321], {
            x: 15.772,
            y: 0.387,
            label: ['0.387', null],
            curveNumber: 0,
            pointNumber: 33,
            bgcolor: 'rgb(0, 0, 255)',
            bordercolor: 'rgb(255, 0, 0)',
            fontSize: 20,
            fontFamily: 'Arial',
            fontColor: 'rgb(255, 255, 0)'
        }, {
            msg: 'scattergl'
        });

        Plotly.newPlot(gd, _mock)
        .then(run)
        .then(done, done.fail);
    });

    it('@gl should output correct event data for scattergl with hoverinfo: \'none\'', function(done) {
        var _mock = Lib.extendDeep({}, mock1);
        _mock.data[0].hoverinfo = 'none';

        var run = makeRunner([634, 321], {
            x: 15.772,
            y: 0.387,
            curveNumber: 0,
            pointNumber: 33,
            noHoverLabel: true
        }, {
            msg: 'scattergl with hoverinfo'
        });

        Plotly.newPlot(gd, _mock)
        .then(run)
        .then(done, done.fail);
    });

    it('@gl should show correct label for scattergl when hovertext is set', function(done) {
        var _mock = Lib.extendDeep({}, mock1);
        _mock.data[0].hovertext = 'text';
        _mock.data[0].hovertext = 'HoVeRtExT';
        _mock.layout.hovermode = 'closest';

        var run = makeRunner([634, 321], {
            x: 15.772,
            y: 0.387,
            label: ['(15.772, 0.387)\nHoVeRtExT', null],
            curveNumber: 0,
            pointNumber: 33,
            bgcolor: 'rgb(0, 0, 238)',
            bordercolor: 'rgb(255, 255, 255)',
            fontSize: 13,
            fontFamily: 'Arial',
            fontColor: 'rgb(255, 255, 255)'
        }, {
            msg: 'scattergl with hovertext'
        });

        Plotly.newPlot(gd, _mock)
        .then(run)
        .then(done, done.fail);
    });

    it('@gl should not error when scattergl trace has missing points', function(done) {
        var _mock = {
            data: [{
                type: 'scattergl',
                mode: 'markers',
                x: [1, 2, 3, 4],
                y: [10, 15, null, 17],
            }],
            layout: {
                width: 500,
                height: 500
            }
        };

        Plotly.newPlot(gd, _mock)
        .then(function() {
            gd.on('plotly_hover', function() {
                fail('should not trigger plotly_hover event');
            });
        })
        .then(function() {
            var xp = 300;
            var yp = 250;
            var interval = setInterval(function() { hover(xp--, yp--); }, 10);
            return delay(100)().then(function() { clearInterval(interval); });
        })
        .then(done, done.fail);
    });

    it('@gl should show last point data for overlapped scattergl points with hovermode set to closest', function(done) {
        var _mock = Lib.extendDeep({}, mock1);
        _mock.data[0].hovertext = 'text';
        _mock.data[0].hovertext = 'HoVeRtExT';
        _mock.layout.hovermode = 'closest';

        var run = makeRunner([200, 200], {
            x: 2,
            y: 0,
            label: ['(2, 0)\nTRUE', null],
            curveNumber: 0,
            pointNumber: 3,
            bgcolor: 'rgb(31, 119, 180)',
            bordercolor: 'rgb(255, 255, 255)',
            fontSize: 13,
            fontFamily: 'Arial',
            fontColor: 'rgb(255, 255, 255)'
        }, {
            msg: 'scattergl with hovertext'
        });

        Plotly.newPlot(gd, {
            data: [{
                text: ['', 'FALSE', '', 'TRUE'],
                x: [1, 2, 3, 2],
                y: [0, 0, 0, 0],
                type: 'scattergl',
                mode: 'markers',
                marker: { size: 40 }
            }],
            layout: {
                width: 400,
                height: 400,
                hovermode: 'closest'
            }
        })
        .then(run)
        .then(done, done.fail);
    });

    it('@gl scattergl should propagate marker colors to hover labels', function(done) {
        var _mock = Lib.extendDeep({}, mock0);
        _mock.layout.hovermode = 'x';
        _mock.layout.width = 800;
        _mock.layout.height = 600;

        var run = makeRunner([700, 300], {
            x: 15075859,
            y: 79183,
            curveNumber: 0,
            pointNumber: 0,
            bgcolor: 'rgb(202, 178, 214)',
            bordercolor: 'rgb(68, 68, 68)',
            fontSize: 13,
            fontFamily: 'Arial',
            fontColor: 'rgb(68, 68, 68)'
        }, {
            msg: 'scattergl marker colors'
        });

        Plotly.newPlot(gd, _mock)
        .then(run)
        .then(done, done.fail);
    });

    it('@gl should output correct event data for scattergl after visibility restyle', function(done) {
        var _mock = Lib.extendDeep({}, mock2);

        var run = makeRunner([435, 216], {
            x: 8,
            y: 18,
            curveNumber: 2,
            pointNumber: 0,
            bgcolor: 'rgb(44, 160, 44)',
            bordercolor: 'rgb(255, 255, 255)',
            fontSize: 13,
            fontFamily: 'Arial',
            fontColor: 'rgb(255, 255, 255)'
        }, {
            msg: 'scattergl before visibility restyle'
        });

        // after the restyle, autorange changes the y range
        var run2 = makeRunner([435, 106], {
            x: 8,
            y: 18,
            curveNumber: 2,
            pointNumber: 0,
            bgcolor: 'rgb(255, 127, 14)',
            bordercolor: 'rgb(68, 68, 68)',
            fontSize: 13,
            fontFamily: 'Arial',
            fontColor: 'rgb(68, 68, 68)'
        }, {
            msg: 'scattergl after visibility restyle'
        });

        Plotly.newPlot(gd, _mock)
        .then(run)
        .then(function() {
            return Plotly.restyle(gd, 'visible', false, [1]);
        })
        .then(run2)
        .then(done, done.fail);
    });

    it('@gl should output correct event data for scattergl-fancy', function(done) {
        var _mock = Lib.extendDeep({}, mock2);
        _mock.data[0].mode = 'markers+lines';
        _mock.data[1].mode = 'markers+lines';
        _mock.data[2].mode = 'markers+lines';

        var run = makeRunner([435, 216], {
            x: 8,
            y: 18,
            curveNumber: 2,
            pointNumber: 0,
            bgcolor: 'rgb(44, 160, 44)',
            bordercolor: 'rgb(255, 255, 255)',
            fontSize: 13,
            fontFamily: 'Arial',
            fontColor: 'rgb(255, 255, 255)'
        }, {
            msg: 'scattergl fancy before visibility restyle'
        });

        // after the restyle, autorange changes the x AND y ranges
        // I don't get why the x range changes, nor why the y changes in
        // a different way than in the previous test, but they do look
        // correct on the screen during the test.
        var run2 = makeRunner([426, 116], {
            x: 8,
            y: 18,
            curveNumber: 2,
            pointNumber: 0,
            bgcolor: 'rgb(255, 127, 14)',
            bordercolor: 'rgb(68, 68, 68)',
            fontSize: 13,
            fontFamily: 'Arial',
            fontColor: 'rgb(68, 68, 68)'
        }, {
            msg: 'scattergl fancy after visibility restyle'
        });

        Plotly.newPlot(gd, _mock)
        .then(run)
        .then(function() {
            return Plotly.restyle(gd, 'visible', false, [1]);
        })
        .then(run2)
        .then(done, done.fail);
    });
});

describe('hover with (x|y)period positioning', function() {
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

    it('@gl shows hover info for scattergl', function(done) {
        Plotly.newPlot(gd, require('../../image/mocks/gl2d_period_positioning.json'))
        .then(function() { _hover(100, 255); })
        .then(function() {
            assertHoverLabelContent({
                name: '',
                nums: '(Jan 2001, Jan 1, 1970)'
            });
        })
        .then(function() { _hover(470, 45); })
        .then(function() {
            assertHoverLabelContent({
                name: '',
                nums: '(Jan 2006, Jun 1, 1970)'
            });
        })
        .then(done, done.fail);
    });
});
