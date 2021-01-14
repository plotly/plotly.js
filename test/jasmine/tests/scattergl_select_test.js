var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var d3Select = require('../../strict-d3').select;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');


var doubleClick = require('../assets/double_click');
var delay = require('../assets/delay');
var mouseEvent = require('../assets/mouse_event');
var readPixel = require('../assets/read_pixel');

function drag(gd, path) {
    var len = path.length;
    var el = d3Select(gd).select('rect.nsewdrag').node();
    var opts = {element: el};

    Lib.clearThrottle();
    mouseEvent('mousemove', path[0][0], path[0][1], opts);
    mouseEvent('mousedown', path[0][0], path[0][1], opts);

    path.slice(1, len).forEach(function(pt) {
        Lib.clearThrottle();
        mouseEvent('mousemove', pt[0], pt[1], opts);
    });

    mouseEvent('mouseup', path[len - 1][0], path[len - 1][1], opts);
}

function select(gd, path) {
    return new Promise(function(resolve, reject) {
        gd.once('plotly_selected', resolve);
        setTimeout(function() { reject('did not trigger *plotly_selected*');}, 200);
        drag(gd, path);
    });
}

describe('Test gl2d lasso/select:', function() {
    var gd;
    var selectPath = [[98, 193], [108, 193]];
    var selectPath2 = [[118, 193], [128, 193]];
    var lassoPath = [[316, 171], [318, 239], [335, 243], [328, 169]];
    var lassoPath2 = [[98, 193], [108, 193], [108, 500], [98, 500], [98, 193]];

    afterEach(function(done) {
        Plotly.purge(gd);
        destroyGraphDiv();
        setTimeout(done, 500);
    });

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


    it('@gl should work under fast mode with *select* dragmode', function(done) {
        var _mock = Lib.extendDeep({}, mockFast);
        _mock.layout.dragmode = 'select';
        gd = createGraphDiv();

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            expect(gd._fullLayout._plots.xy._scene.select2d).not.toBe(undefined, 'scatter2d renderer');

            return select(gd, selectPath);
        })
        .then(delay(20))
        .then(function(eventData) {
            assertEventData(eventData, {
                points: [
                    {pointNumber: 25, x: 1.425, y: 0.538},
                    {pointNumber: 26, x: 1.753, y: 0.5},
                    {pointNumber: 27, x: 2.22, y: 0.45}
                ]
            });
        })
        .then(done, done.fail);
    });

    it('@gl should work under fast mode with *lasso* dragmode', function(done) {
        var _mock = Lib.extendDeep({}, mockFast);
        _mock.layout.dragmode = 'lasso';
        gd = createGraphDiv();

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            return select(gd, lassoPath2);
        })
        .then(delay(20))
        .then(function(eventData) {
            assertEventData(eventData, {
                points: [
                    {pointNumber: 25, x: 1.425, y: 0.538},
                    {pointNumber: 26, x: 1.753, y: 0.5},
                    {pointNumber: 27, x: 2.22, y: 0.45}
                ]
            });
        })
        .then(done, done.fail);
    });

    it('@gl should work under fancy mode with *select* dragmode', function(done) {
        var _mock = Lib.extendDeep({}, mockFancy);
        _mock.layout.dragmode = 'select';
        gd = createGraphDiv();

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            return select(gd, selectPath2);
        })
        .then(delay(20))
        .then(function(eventData) {
            assertEventData(eventData, {
                points: [{x: 0.004, y: 12.5}]
            });
        })
        .then(done, done.fail);
    });

    it('@gl should work under fancy mode with *lasso* dragmode', function(done) {
        var _mock = Lib.extendDeep({}, mockFancy);
        _mock.layout.dragmode = 'lasso';
        gd = createGraphDiv();

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            return select(gd, lassoPath);
        })
        .then(function(eventData) {
            assertEventData(eventData, {
                points: [{ x: 0.099, y: 2.75 }]
            });
        })
        .then(done, done.fail);
    });

    it('@gl should work on trace with enabled transforms', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl2d_transforms.json'));
        fig.layout.dragmode = 'select';
        fig.layout.margin = {t: 0, b: 0, l: 0, r: 0};
        fig.layout.height = 500;
        fig.layout.width = 500;
        gd = createGraphDiv();

        Plotly.newPlot(gd, fig)
        .then(delay(20))
        .then(function() { return select(gd, [[100, 100], [250, 250]]); })
        .then(function(eventData) {
            assertEventData(eventData, {
                points: [
                    { x: 3, y: 4 },
                    { x: 2, y: 4 }
                ]
            });
        })
        .then(done, done.fail);
    });

    it('@gl should work on gl text charts', function(done) {
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

        Plotly.newPlot(gd, fig)
        .then(delay(20))
        .then(function() {
            _assertGlTextOpts('base', {
                rgba: [
                    [68, 68, 68, 255],
                    [68, 68, 68, 255],
                    [68, 68, 68, 255]
                ]
            });
        })
        .then(function() { return select(gd, [[100, 100], [250, 250]]); })
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
        .then(function() { return select(gd, [[100, 100], [250, 250]]); })
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
        .then(done, done.fail);
    });

    it('@gl should work on gl text charts with array textfont.color', function(done) {
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

        Plotly.newPlot(gd, fig)
        .then(delay(20))
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
        .then(function() { return select(gd, [[100, 10], [250, 100]]); })
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
        .then(function() { return select(gd, [[100, 10], [250, 100]]); })
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
        .then(done, done.fail);
    });
});

describe('Test displayed selections:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function(done) {
        Plotly.purge(gd);
        destroyGraphDiv();
        setTimeout(done, 500);
    });

    it('@gl should work after a width/height relayout', function(done) {
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

        Plotly.newPlot(gd, [{
            type: 'scattergl',
            mode: 'markers',
            y: [2, 1, 2]
        }], {
            dragmode: 'select',
            margin: {t: 0, b: 0, l: 0, r: 0},
            width: w, height: h
        })
        .then(delay(20))
        .then(function() {
            expect(readContext()).toBeGreaterThan(1e4, 'base context');
            expect(readFocus()).toBe(0, 'base focus');
        })
        .then(function() { return select(gd, [[pad, pad], [w - pad, h - pad]]); })
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
        .then(function() { return select(gd, [[pad, pad], [w2 - pad, h2 - pad]]); })
        .then(function() {
            // make sure full w2/h2 context canvas is cleared!
            // from https://github.com/plotly/plotly.js/issues/2731<Paste>
            expect(readContext()).toBe(0, 'update+select context');
            expect(readFocus()).toBeGreaterThan(1e4, 'update+select focus');
        })
        .then(done, done.fail);
    });

    it('@gl should display selection of big number of regular points', function(done) {
        // generate large number of points
        var x = [];
        var y = [];
        var n = 2e2;
        var N = n * n;
        for(var i = 0; i < N; i++) {
            x.push((i % n) / n);
            y.push(i / N);
        }

        var mock = {
            data: [{
                x: x, y: y, type: 'scattergl', mode: 'markers'
            }],
            layout: {
                dragmode: 'select'
            }
        };

        Plotly.newPlot(gd, mock)
        .then(select(gd, [[160, 100], [180, 100]]))
        .then(function() {
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 168, 100)[3]).toBe(0);
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 158, 100)[3]).not.toBe(0);
            expect(readPixel(gd.querySelector('.gl-canvas-focus'), 168, 100)[3]).not.toBe(0);
        })
        .then(done, done.fail);
    });

    it('@gl should display selection of big number of miscellaneous points', function(done) {
        var colorList = [
            '#006385', '#F06E75', '#90ed7d', '#f7a35c', '#8085e9',
            '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1',
            '#5DA5DA', '#F06E75', '#F15854', '#B2912F', '#B276B2',
            '#DECF3F', '#FAA43A', '#4D4D4D', '#F17CB0', '#60BD68'
        ];

        // generate large number of points
        var x = [];
        var y = [];
        var n = 2e2;
        var N = n * n;
        var color = [];
        var symbol = [];
        var size = [];
        for(var i = 0; i < N; i++) {
            x.push((i % n) / n);
            y.push(i / N);
            color.push(colorList[i % colorList.length]);
            symbol.push('x');
            size.push(6);
        }

        var mock = {
            data: [{
                x: x, y: y, type: 'scattergl', mode: 'markers',
                marker: {symbol: symbol, size: size, color: color}
            }],
            layout: {
                dragmode: 'select'
            }
        };

        Plotly.newPlot(gd, mock)
        .then(select(gd, [[160, 100], [180, 100]]))
        .then(function() {
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 168, 100)[3]).toBe(0);
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 158, 100)[3]).not.toBe(0);
            expect(readPixel(gd.querySelector('.gl-canvas-focus'), 168, 100)[3]).not.toBe(0);
        })
        .then(done, done.fail);
    });
});

describe('Test selections during funky scenarios', function() {
    var gd;

    afterEach(function(done) {
        Plotly.purge(gd);
        destroyGraphDiv();
        setTimeout(done, 500);
    });

    function grabScene() {
        return gd.calcdata[0][0].t._scene;
    }

    describe('select+doubleclick+pan scenarios:', function() {
        function init() {
            var scene = grabScene();
            spyOn(scene.scatter2d, 'update').and.callThrough();
            spyOn(scene.scatter2d, 'draw').and.callThrough();
        }

        function _assert(msg, exp) {
            var scene = grabScene();
            var scatter2d = scene.scatter2d;

            expect((scene.markerOptions || [])[0].opacity)
                .toBe(1, 'marker.opacity - ' + msg);
            expect((scene.markerSelectedOptions || [])[0].opacity)
                .toBe(1, 'selected.marker.opacity - ' + msg);
            expect((scene.markerUnselectedOptions || [])[0].opacity)
                .toBe(0.2, 'unselected.marker.opacity - ' + msg);

            expect(scene.selectBatch).toEqual(exp.selectBatch);
            expect(scene.unselectBatch).toEqual(exp.unselectBatch);

            var updateCalls = scatter2d.update.calls.all();
            var drawCalls = scatter2d.draw.calls.all();

            expect(updateCalls.length).toBe(
                exp.updateArgs.length,
                'scatter2d.update has been called the correct number of times - ' + msg
            );
            updateCalls.forEach(function(d, i) {
                d.args.forEach(function(arg, j) {
                    if(Array.isArray(arg) && 'range' in arg[0]) {
                        // no need to assert range value in detail
                        expect(exp.updateArgs[i][j]).toBe(
                            'range',
                            'scatter.update range update - ' + msg
                        );
                    } else {
                        expect(arg).toEqual(
                            exp.updateArgs[i][j],
                            'scatter.update call' + i + ' arg' + j + ' - ' + msg
                        );
                    }
                });
            });

            expect(drawCalls.length).toBe(
                exp.drawArgs.length,
                'scatter2d.draw has been called the correct number of times - ' + msg
            );
            drawCalls.forEach(function(d, i) {
                d.args.forEach(function(arg, j) {
                    expect(arg).toEqual(
                        exp.drawArgs[i][j],
                        'scatter.draw call' + i + ' arg' + j + ' - ' + msg
                    );
                });
            });

            scene.scatter2d.update.calls.reset();
            scene.scatter2d.draw.calls.reset();
        }

        it('@gl should behave correctly during select -> doubleclick -> pan:', function(done) {
            gd = createGraphDiv();

            // See https://github.com/plotly/plotly.js/issues/2767

            Plotly.newPlot(gd, [{
                type: 'scattergl',
                mode: 'markers',
                y: [1, 2, 1],
                marker: {size: 30}
            }], {
                dragmode: 'select',
                margin: {t: 0, b: 0, l: 0, r: 0},
                width: 500,
                height: 500
            })
            .then(delay(20))
            .then(init)
            .then(function() {
                _assert('base', {
                    selectBatch: [[]],
                    unselectBatch: [[]],
                    updateArgs: [],
                    drawArgs: []
                });
            })
            .then(function() { return select(gd, [[20, 20], [480, 250]]); })
            .then(function() {
                var scene = grabScene();
                _assert('after select', {
                    selectBatch: [[1]],
                    unselectBatch: [[0, 2]],
                    updateArgs: [
                        // N.B. scatter2d now draws unselected options
                        scene.markerUnselectedOptions,
                    ],
                    drawArgs: [
                        // draw unselectBatch
                        [scene.unselectBatch]
                    ]
                });
            })
            .then(function() { return doubleClick(250, 250); })
            .then(function() {
                var scene = grabScene();
                _assert('after doubleclick', {
                    selectBatch: [[]],
                    unselectBatch: [[]],
                    updateArgs: [
                        // N.B. bring scatter2d back to 'base' marker options
                        [scene.markerOptions[0]]
                    ],
                    drawArgs: [
                        // call data[0] batch
                        [0]
                    ]
                });
            })
            .then(function() { return Plotly.relayout(gd, 'dragmode', 'pan'); })
            .then(function() {
                _assert('after relayout to *pan*', {
                    selectBatch: [[]],
                    unselectBatch: [[]],
                    // nothing to do when relayouting to 'pan'
                    updateArgs: [],
                    drawArgs: []
                });
            })
            .then(function() { return drag(gd, [[200, 200], [250, 250]]); })
            .then(function() {
                var scene = grabScene();
                _assert('after pan', {
                    selectBatch: [[]],
                    unselectBatch: [[]],
                    // drag triggers:
                    // - 2 scene.update() calls, which each invoke
                    //   + 1 scatter2d.update (updating viewport)
                    //   + 1 scatter2d.draw (same as after double-click)
                    //
                    // replot on mouseup triggers:
                    // - 1 scatter2d.update resetting markerOptions
                    // - 1 scatter2d.update updating viewport
                    // - 1 (full) scene.draw()
                    updateArgs: [
                        ['range'],
                        ['range'],
                        // N.B. bring scatter2d back to 'base' marker options
                        [scene.markerOptions],
                        ['range']
                    ],
                    drawArgs: [
                        // call data[0] batch
                        [0],
                        [0],
                        [0]
                    ]
                });
            })
            .then(done, done.fail);
        });

        it('@gl should behave correctly when doubleclick before selecting anything', function(done) {
            gd = createGraphDiv();

            Plotly.newPlot(gd, [{
                type: 'scattergl',
                mode: 'markers',
                y: [1, 2, 1],
                marker: {size: 30}
            }], {
                dragmode: 'select',
                margin: {t: 0, b: 0, l: 0, r: 0},
                width: 500,
                height: 500
            })
            .then(delay(20))
            .then(init)
            .then(function() { return doubleClick(250, 250); })
            .then(function() {
                var scene = grabScene();
                _assert('after doublclick', {
                    selectBatch: [[]],
                    unselectBatch: [[]],
                    updateArgs: [
                        // N.B. bring scatter2d back to 'base' marker options
                        [scene.markerOptions[0]]
                    ],
                    drawArgs: [
                        // call data[0] batch
                        [0]
                    ]
                });
            })
            .then(done, done.fail);
        });

        it('@gl should behave correctly during select -> doubleclick -> dragmode:mode -> dragmode:select', function(done) {
            gd = createGraphDiv();

            // https://github.com/plotly/plotly.js/issues/2958

            Plotly.newPlot(gd, [{
                type: 'scattergl',
                mode: 'markers',
                y: [1, 2, 1],
                marker: {size: 30}
            }], {
                dragmode: 'select',
                margin: {t: 0, b: 0, l: 0, r: 0},
                width: 500,
                height: 500
            })
            .then(delay(20))
            .then(init)
            .then(function() {
                _assert('base', {
                    selectBatch: [[]],
                    unselectBatch: [[]],
                    updateArgs: [],
                    drawArgs: []
                });
            })
            .then(function() { return select(gd, [[20, 20], [480, 250]]); })
            .then(function() { return doubleClick(250, 250); })
            .then(function() { return Plotly.relayout(gd, 'dragmode', 'pan'); })
            .then(function() { return Plotly.relayout(gd, 'dragmode', 'select'); })
            .then(function() {
                var scene = grabScene();
                _assert('after', {
                    selectBatch: [[]],
                    unselectBatch: [[]],
                    updateArgs: [
                        scene.markerUnselectedOptions,
                        [scene.markerOptions[0]],
                        [[{}]],
                        ['range']
                    ],
                    drawArgs: [
                        [[[0, 2]]],
                        [0],
                        [0]
                    ]
                });
            })
            .then(done, done.fail);
        });
    });

    it('@gl should draw parts in correct order during selections', function(done) {
        gd = createGraphDiv();

        // https://github.com/plotly/plotly.js/issues/3740

        var tracker = [];

        function _assert(msg, exp) {
            expect(tracker.length).toBe(exp.length, msg + ' same # of sub-draw calls');

            tracker.forEach(function(d, i) {
                var expi = exp[i];
                expect(d[0]).toBe(expi[0], msg + ' ' + i + 'th sub-draw call');

                expect(d[1].length).toBe(expi[1].length, msg + ' same # of sub-draw args|' + i + 'th call');
                expi[1].forEach(function(e, j) {
                    expect(d[1][j]).toEqual(e, ['arg', j, msg + ' in call', i].join(' '));
                });
            });

            tracker = [];
        }

        Plotly.newPlot(gd, [{
            type: 'scattergl',
            mode: 'markers',
            y: [1, 2, 1],
            marker: {size: 30}
        }, {
            type: 'scattergl',
            mode: 'lines',
            y: [1, 2, 1]
        }], {
            dragmode: 'select',
            margin: {t: 0, b: 0, l: 0, r: 0},
            width: 500,
            height: 500
        })
        .then(delay(20))
        .then(function() {
            var scene = grabScene();
            spyOn(scene.scatter2d, 'draw').and.callFake(function() {
                tracker.push(['scatter2d', arguments]);
            });
            spyOn(scene.line2d, 'draw').and.callFake(function() {
                tracker.push(['line2d', arguments]);
            });
            spyOn(scene.select2d, 'draw').and.callFake(function() {
                tracker.push(['select2d', arguments]);
            });
        })
        .then(function() { return Plotly.relayout(gd, 'xaxis.range', [0, 4]); })
        .then(function() {
            _assert('base', [
                ['scatter2d', [0]],
                ['line2d', [1]],
                ['select2d', [[[], []]]]
            ]);
        })
        .then(function() { return select(gd, [[20, 20], [480, 250]]); })
        .then(function() {
            _assert('on selection', [
                ['scatter2d', [[[0, 2], []]]],
                ['line2d', [1]],
                ['select2d', [[[1], []]]]
            ]);
        })
        .then(function() { return doubleClick(250, 250); })
        .then(function() {
            _assert('after double-click', [
                ['scatter2d', [0]],
                ['line2d', [1]],
                ['select2d', [[[], []]]]
            ]);
        })
        .then(done, done.fail);
    });

    it('@gl should work on overlaid subplots', function(done) {
        gd = createGraphDiv();

        var scene, scene2;

        Plotly.newPlot(gd, [{
            x: [1, 2, 3],
            y: [40, 50, 60],
            type: 'scattergl',
            mode: 'markers'
        }, {
            x: [2, 3, 4],
            y: [4, 5, 6],
            yaxis: 'y2',
            type: 'scattergl',
            mode: 'markers'
        }], {
            xaxis: {domain: [0.2, 1]},
            yaxis2: {overlaying: 'y', side: 'left', position: 0},
            showlegend: false,
            margin: {l: 0, t: 0, b: 0, r: 0},
            width: 400,
            height: 400,
            dragmode: 'select'
        })
        .then(delay(20))
        .then(function() {
            scene = gd._fullLayout._plots.xy._scene;
            scene2 = gd._fullLayout._plots.xy2._scene;

            spyOn(scene.scatter2d, 'draw');
            spyOn(scene2.scatter2d, 'draw');
        })
        .then(function() { return select(gd, [[20, 20], [380, 250]]); })
        .then(function() {
            expect(scene.scatter2d.draw).toHaveBeenCalledTimes(1);
            expect(scene2.scatter2d.draw).toHaveBeenCalledTimes(1);
        })
        .then(done, done.fail);
    });
});
