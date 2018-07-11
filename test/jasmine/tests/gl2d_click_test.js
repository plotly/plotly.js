var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test.js');

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
var readPixel = require('../assets/read_pixel');

// contourgl is not part of the dist plotly.js bundle initially
Plotly.register([
    require('@lib/contourgl')
]);

var mock1 = require('@mocks/gl2d_14.json');
var mock2 = require('@mocks/gl2d_pointcloud-basic.json');

var mock3 = {
    data: [{
        type: 'contourgl',
        z: [
            [10, 10.625, 12.5, 15.625, 20],
            [5.625, 6.25, 8.125, 11.25, 15.625],
            [2.5, 3.125, 5, 8.125, 12.5],
            [0.625, 1.25, 3.125, 20, 10.625],
            [0, 0.625, 2.5, 5.625, 10]
        ],
        colorscale: 'Jet',
        // contours: { start: 2, end: 10, size: 1 },
        zmin: 0,
        zmax: 20
    }],
    layout: {}
};

var mock4 = {
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

describe('@gl @flaky Test hover and click interactions', function() {
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

                    var g = d3.select('g.hovertext');
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

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should output correct event data for scattergl', function(done) {
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

        Plotly.plot(gd, _mock)
        .then(run)
        .catch(failTest)
        .then(done);
    });

    it('should output correct event data for scattergl in *select* dragmode', function(done) {
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

        Plotly.plot(gd, _mock)
        .then(run)
        .catch(failTest)
        .then(done);
    });

    it('should output correct event data for scattergl in *lasso* dragmode', function(done) {
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

        Plotly.plot(gd, _mock)
        .then(run)
        .catch(failTest)
        .then(done);
    });

    it('should output correct event data for scattergl with hoverinfo: \'none\'', function(done) {
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

        Plotly.plot(gd, _mock)
        .then(run)
        .catch(failTest)
        .then(done);
    });

    it('should show correct label for scattergl when hovertext is set', function(done) {
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

        Plotly.plot(gd, _mock)
        .then(run)
        .catch(failTest)
        .then(done);
    });

    it('should output correct event data for pointcloud', function(done) {
        var _mock = Lib.extendDeep({}, mock2);

        _mock.layout.hoverlabel = { font: {size: 8} };
        _mock.data[2].hoverlabel = {
            bgcolor: ['red', 'green', 'blue']
        };

        var run = makeRunner([540, 150], {
            x: 4.5,
            y: 9,
            curveNumber: 2,
            pointNumber: 1,
            bgcolor: 'rgb(0, 128, 0)',
            bordercolor: 'rgb(255, 255, 255)',
            fontSize: 8,
            fontFamily: 'Arial',
            fontColor: 'rgb(255, 255, 255)'
        }, {
            msg: 'pointcloud'
        });

        Plotly.plot(gd, _mock)
        .then(run)
        .catch(failTest)
        .then(done);
    });

    it('should output correct event data for heatmapgl', function(done) {
        var _mock = Lib.extendDeep({}, mock3);
        _mock.data[0].type = 'heatmapgl';

        _mock.data[0].hoverlabel = {
            font: { size: _mock.data[0].z }
        };

        _mock.layout.hoverlabel = {
            font: { family: 'Roboto' }
        };

        var run = makeRunner([540, 150], {
            x: 3,
            y: 3,
            curveNumber: 0,
            pointNumber: [3, 3],
            bgcolor: 'rgb(68, 68, 68)',
            bordercolor: 'rgb(255, 255, 255)',
            fontSize: 20,
            fontFamily: 'Roboto',
            fontColor: 'rgb(255, 255, 255)'
        }, {
            noUnHover: true,
            msg: 'heatmapgl'
        });

        Plotly.plot(gd, _mock)
        .then(run)
        .catch(failTest)
        .then(done);
    });

    it('should output correct event data for heatmapgl (asymmetric case) ', function(done) {
        var _mock = {
            data: [{
                type: 'heatmapgl',
                z: [[1, 2, 0], [2, 3, 1]],
                text: [['a', 'b', 'c'], ['D', 'E', 'F']],
                hoverlabel: {
                    bgcolor: [['red', 'blue', 'green'], ['cyan', 'pink', 'black']]
                }
            }]
        };

        var run = makeRunner([540, 150], {
            x: 2,
            y: 1,
            curveNumber: 0,
            pointNumber: [1, 2],
            bgcolor: 'rgb(0, 0, 0)',
            bordercolor: 'rgb(255, 255, 255)',
            fontSize: 13,
            fontFamily: 'Arial',
            fontColor: 'rgb(255, 255, 255)'
        }, {
            noUnHover: true,
            msg: 'heatmapgl'
        });

        Plotly.plot(gd, _mock)
        .then(run)
        .catch(failTest)
        .then(done);
    });

    it('should output correct event data for scattergl after visibility restyle', function(done) {
        var _mock = Lib.extendDeep({}, mock4);

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

        Plotly.plot(gd, _mock)
        .then(run)
        .then(function() {
            return Plotly.restyle(gd, 'visible', false, [1]);
        })
        .then(run2)
        .catch(failTest)
        .then(done);
    });

    it('should output correct event data for scattergl-fancy', function(done) {
        var _mock = Lib.extendDeep({}, mock4);
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

        Plotly.plot(gd, _mock)
        .then(run)
        .then(function() {
            return Plotly.restyle(gd, 'visible', false, [1]);
        })
        .then(run2)
        .catch(failTest)
        .then(done);
    });

    it('should output correct event data contourgl', function(done) {
        var _mock = Lib.extendDeep({}, mock3);

        _mock.data[0].hoverlabel = {
            font: { size: _mock.data[0].z }
        };

        var run = makeRunner([540, 150], {
            x: 3,
            y: 3,
            curveNumber: 0,
            pointNumber: [3, 3],
            bgcolor: 'rgb(68, 68, 68)',
            bordercolor: 'rgb(255, 255, 255)',
            fontSize: 20,
            fontFamily: 'Arial',
            fontColor: 'rgb(255, 255, 255)'
        }, {
            noUnHover: true,
            msg: 'contourgl'
        });

        Plotly.plot(gd, _mock)
        .then(run)
        .catch(failTest)
        .then(done);
    });
});

describe('@noCI @gl Test gl2d lasso/select:', function() {
    var mockFancy = require('@mocks/gl2d_14.json');
    delete mockFancy.layout.xaxis.autorange;
    delete mockFancy.layout.yaxis.autorange;
    mockFancy.layout.xaxis.range = [-2.951309064136961, 2.0954721318818916];
    mockFancy.layout.yaxis.range = [-0.9248866483012275, 1.3232607344525835];

    var mockFast = Lib.extendDeep({}, mockFancy, {
        data: [{mode: 'markers'}],
        layout: {
            xaxis: {
                type: 'linear',
                range: [-3.869222222222223, 73.55522222222223]
            },
            yaxis: {
                type: 'linear',
                range: [-0.7402222222222222, 17.144222222222222]
            }
        }
    });

    var gd;
    var selectPath = [[98, 193], [108, 193]];
    var selectPath2 = [[118, 193], [128, 193]];
    var lassoPath = [[316, 171], [318, 239], [335, 243], [328, 169]];
    var lassoPath2 = [[98, 193], [108, 193], [108, 500], [98, 500], [98, 193]];

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function drag(path) {
        var len = path.length;

        Lib.clearThrottle();
        mouseEvent('mousemove', path[0][0], path[0][1]);
        mouseEvent('mousedown', path[0][0], path[0][1]);

        path.slice(1, len).forEach(function(pt) {
            Lib.clearThrottle();
            mouseEvent('mousemove', pt[0], pt[1]);
        });

        mouseEvent('mouseup', path[len - 1][0], path[len - 1][1]);
    }

    function select(path) {
        return new Promise(function(resolve, reject) {
            gd.once('plotly_selected', resolve);
            setTimeout(function() { reject('did not trigger *plotly_selected*');}, 200);
            drag(path);
        });
    }

    function assertEventData(actual, expected) {
        expect(actual.points.length).toBe(expected.points.length);

        expected.points.forEach(function(e, i) {
            var a = actual.points[i];
            if(a) {
                expect(a.x).toBe(e.x, 'x');
                expect(a.y).toBe(e.y, 'y');
            }
        });
    }


    it('should work under fast mode with *select* dragmode', function(done) {
        var _mock = Lib.extendDeep({}, mockFast);
        _mock.layout.dragmode = 'select';
        gd = createGraphDiv();

        Plotly.plot(gd, _mock)
        .then(delay(100))
        .then(function() {
            expect(gd._fullLayout._plots.xy._scene.select2d).not.toBe(undefined, 'scatter2d renderer');

            return select(selectPath);
        })
        .then(delay(100))
        .then(function(eventData) {
            assertEventData(eventData, {
                points: [
                    {pointNumber: 25, x: 1.425, y: 0.538},
                    {pointNumber: 26, x: 1.753, y: 0.5},
                    {pointNumber: 27, x: 2.22, y: 0.45}
                ]
            });

        })
        .catch(failTest)
        .then(done);
    });

    it('should work under fast mode with *lasso* dragmode', function(done) {
        var _mock = Lib.extendDeep({}, mockFast);
        _mock.layout.dragmode = 'lasso';
        gd = createGraphDiv();

        Plotly.plot(gd, _mock)
        .then(delay(100))
        .then(function() {
            return select(lassoPath2);
        })
        .then(delay(100))
        .then(function(eventData) {
            assertEventData(eventData, {
                points: [
                    {pointNumber: 25, x: 1.425, y: 0.538},
                    {pointNumber: 26, x: 1.753, y: 0.5},
                    {pointNumber: 27, x: 2.22, y: 0.45}
                ]
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('should work under fancy mode with *select* dragmode', function(done) {
        var _mock = Lib.extendDeep({}, mockFancy);
        _mock.layout.dragmode = 'select';
        gd = createGraphDiv();

        Plotly.plot(gd, _mock)
        .then(delay(100))
        .then(function() {
            return select(selectPath2);
        })
        .then(delay(100))
        .then(function(eventData) {
            assertEventData(eventData, {
                points: [{x: 0.004, y: 12.5}]
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('should work under fancy mode with *lasso* dragmode', function(done) {
        var _mock = Lib.extendDeep({}, mockFancy);
        _mock.layout.dragmode = 'lasso';
        gd = createGraphDiv();

        Plotly.plot(gd, _mock)
        .then(delay(100))
        .then(function() {
            return select(lassoPath);
        })
        .then(function(eventData) {
            assertEventData(eventData, {
                points: [{ x: 0.099, y: 2.75 }]
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('should work on trace with enabled transforms', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl2d_transforms.json'));
        fig.layout.dragmode = 'select';
        fig.layout.margin = {t: 0, b: 0, l: 0, r: 0};
        fig.layout.height = 500;
        fig.layout.width = 500;
        gd = createGraphDiv();

        Plotly.plot(gd, fig)
        .then(delay(100))
        .then(function() { return select([[100, 100], [250, 250]]); })
        .then(function(eventData) {
            assertEventData(eventData, {
                points: [
                    { x: 3, y: 4 },
                    { x: 2, y: 4 }
                ]
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('should work on gl text charts', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl2d_text_chart_basic.json'));
        fig.layout.dragmode = 'select';
        fig.layout.margin = {t: 0, b: 0, l: 0, r: 0};
        fig.layout.height = 500;
        fig.layout.width = 500;
        gd = createGraphDiv();

        function _assertGlTextOpts(msg, exp) {
            var scene = gd.calcdata[0][0].t._scene;
            scene.glText.forEach(function(opts, i) {
                expect(Array.from(opts.color))
                    .toBeCloseToArray(exp.rgba[i], 2, 'item ' + i + ' - ' + msg);
            });
        }

        Plotly.plot(gd, fig)
        .then(delay(100))
        .then(function() {
            _assertGlTextOpts('base', {
                rgba: [
                    [68, 68, 68, 255],
                    [68, 68, 68, 255],
                    [68, 68, 68, 255]
                ]
            });
        })
        .then(function() { return select([[100, 100], [250, 250]]); })
        .then(function(eventData) {
            assertEventData(eventData, {
                points: [{x: 1, y: 2}]
            });
            _assertGlTextOpts('after selection', {
                rgba: [
                    [
                        68, 68, 68, 51,
                        68, 68, 68, 51,
                        68, 68, 68, 51,
                    ],
                    [
                        68, 68, 68, 51,
                        // this is the selected pt!
                        68, 68, 68, 255,
                        68, 68, 68, 51
                    ],
                    [
                        68, 68, 68, 51,
                        68, 68, 68, 51,
                        68, 68, 68, 51
                    ]
                ]
            });
        })
        .then(function() {
            return Plotly.restyle(gd, 'selected.textfont.color', 'red');
        })
        .then(function() { return select([[100, 100], [250, 250]]); })
        .then(function() {
            _assertGlTextOpts('after selection - with set selected.textfont.color', {
                rgba: [
                    [
                        68, 68, 68, 255,
                        68, 68, 68, 255,
                        68, 68, 68, 255,
                    ],
                    [
                        68, 68, 68, 255,
                        // this is the selected pt!
                        255, 0, 0, 255,
                        68, 68, 68, 255
                    ],
                    [
                        68, 68, 68, 255,
                        68, 68, 68, 255,
                        68, 68, 68, 255
                    ]
                ]
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('should work on gl text charts with array textfont.color', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl2d_text_chart_arrays.json'));
        fig.layout.dragmode = 'select';
        fig.layout.margin = {t: 0, b: 0, l: 0, r: 0};
        fig.layout.height = 500;
        fig.layout.width = 500;
        gd = createGraphDiv();

        function _assertGlTextOpts(msg, exp) {
            var scene = gd.calcdata[0][0].t._scene;
            scene.glText.forEach(function(opts, i) {
                expect(Array.from(opts.color))
                    .toBeCloseToArray(exp.rgba[i], 2, 'item ' + i + ' - ' + msg);
            });
        }

        Plotly.plot(gd, fig)
        .then(delay(100))
        .then(function() {
            _assertGlTextOpts('base', {
                rgba: [
                    [
                        255, 0, 0, 255,
                        0, 0, 255, 255,
                        0, 128, 0, 255
                    ],
                    [
                        0, 0, 0, 255,
                        211, 211, 210, 255,
                        237, 97, 0, 255
                    ]
                ]
            });
        })
        .then(function() { return select([[100, 10], [250, 100]]); })
        .then(function(eventData) {
            assertEventData(eventData, {
                points: [{x: 1, y: 2}]
            });
            _assertGlTextOpts('after selection', {
                rgba: [
                    [
                        255, 0, 0, 51,
                        0, 0, 255, 51,
                        0, 128, 0, 51
                    ],
                    [
                        0, 0, 0, 51,
                        // this is the selected pt!
                        211, 211, 210, 255,
                        237, 97, 0, 51
                    ]
                ]
            });
        })
        .then(function() {
            return Plotly.restyle(gd, 'selected.textfont.color', 'red');
        })
        .then(function() { return select([[100, 10], [250, 100]]); })
        .then(function() {
            _assertGlTextOpts('after selection - with set selected.textfont.color', {
                rgba: [
                    [
                        255, 0, 0, 255,
                        0, 0, 255, 255,
                        0, 128, 0, 255
                    ],
                    [
                        0, 0, 0, 255,
                        // this is the selected pt!
                        255, 0, 0, 255,
                        237, 97, 0, 255
                    ]
                ]
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('should work after a width/height relayout', function(done) {
        gd = createGraphDiv();

        var w = 500;
        var h = 500;
        var w2 = 800;
        var h2 = 600;
        var pad = 20;

        function _read(query) {
            var canvas = gd.querySelector(query);
            return readPixel(canvas, 0, 0, gd.layout.width, gd.layout.height)
                .reduce(function(acc, v) { return acc + v; }, 0);
        }

        function readContext() { return _read('.gl-canvas-context'); }

        function readFocus() { return _read('.gl-canvas-focus'); }

        Plotly.plot(gd, [{
            type: 'scattergl',
            mode: 'markers',
            y: [2, 1, 2]
        }], {
            dragmode: 'select',
            margin: {t: 0, b: 0, l: 0, r: 0},
            width: w, height: h
        })
        .then(delay(100))
        .then(function() {
            expect(readContext()).toBeGreaterThan(1e4, 'base context');
            expect(readFocus()).toBe(0, 'base focus');
        })
        .then(function() { return select([[pad, pad], [w - pad, h - pad]]); })
        .then(function() {
            expect(readContext()).toBe(0, 'select context');
            expect(readFocus()).toBeGreaterThan(1e4, 'select focus');
        })
        .then(function() {
            return Plotly.update(gd,
                {selectedpoints: null},
                {width: w2, height: h2}
            );
        })
        .then(function() {
            expect(readContext()).toBeGreaterThan(1e4, 'update context');
            expect(readFocus()).toBe(0, 'update focus');
        })
        .then(function() { return select([[pad, pad], [w2 - pad, h2 - pad]]); })
        .then(function() {
            // make sure full w2/h2 context canvas is cleared!
            // from https://github.com/plotly/plotly.js/issues/2731<Paste>
            expect(readContext()).toBe(0, 'update+select context');
            expect(readFocus()).toBeGreaterThan(1e4, 'update+select focus');
        })
        .catch(failTest)
        .then(done);
    });
});
