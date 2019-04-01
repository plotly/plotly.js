var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test.js');

// cartesian click events events use the hover data
// from the mousemove events and then simulate
// a click event on mouseup
var doubleClick = require('../assets/double_click');
var delay = require('../assets/delay');
var mouseEvent = require('../assets/mouse_event');
var readPixel = require('../assets/read_pixel');

// contourgl is not part of the dist plotly.js bundle initially
Plotly.register([
    require('@lib/contourgl')
]);

describe('Test gl2d lasso/select:', function() {
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
        var el = d3.select(gd).select('rect.nsewdrag').node();
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

    it('@gl should work under fast mode with *select* dragmode', function(done) {
        var _mock = Lib.extendDeep({}, mockFast);
        _mock.layout.dragmode = 'select';
        gd = createGraphDiv();

        Plotly.plot(gd, _mock)
        .then(delay(20))
        .then(function() {
            expect(gd._fullLayout._plots.xy._scene.select2d).not.toBe(undefined, 'scatter2d renderer');

            return select(selectPath);
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
        .catch(failTest)
        .then(done);
    });

    it('@gl should work under fast mode with *lasso* dragmode', function(done) {
        var _mock = Lib.extendDeep({}, mockFast);
        _mock.layout.dragmode = 'lasso';
        gd = createGraphDiv();

        Plotly.plot(gd, _mock)
        .then(delay(20))
        .then(function() {
            return select(lassoPath2);
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
        .catch(failTest)
        .then(done);
    });

    it('@gl should work under fancy mode with *select* dragmode', function(done) {
        var _mock = Lib.extendDeep({}, mockFancy);
        _mock.layout.dragmode = 'select';
        gd = createGraphDiv();

        Plotly.plot(gd, _mock)
        .then(delay(20))
        .then(function() {
            return select(selectPath2);
        })
        .then(delay(20))
        .then(function(eventData) {
            assertEventData(eventData, {
                points: [{x: 0.004, y: 12.5}]
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should work under fancy mode with *lasso* dragmode', function(done) {
        var _mock = Lib.extendDeep({}, mockFancy);
        _mock.layout.dragmode = 'lasso';
        gd = createGraphDiv();

        Plotly.plot(gd, _mock)
        .then(delay(20))
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

    it('@gl should work on trace with enabled transforms', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl2d_transforms.json'));
        fig.layout.dragmode = 'select';
        fig.layout.margin = {t: 0, b: 0, l: 0, r: 0};
        fig.layout.height = 500;
        fig.layout.width = 500;
        gd = createGraphDiv();

        Plotly.plot(gd, fig)
        .then(delay(20))
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

        Plotly.plot(gd, fig)
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

        Plotly.plot(gd, fig)
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

    it('@gl should work after a width/height relayout', function(done) {
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
        .then(delay(20))
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

    it('@gl should behave correctly during select+doubleclick+pan scenarios', function(done) {
        gd = createGraphDiv();

        // See https://github.com/plotly/plotly.js/issues/2767

        function grabScene() {
            return gd.calcdata[0][0].t._scene;
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
                    if('range' in arg[0]) {
                        // no need to assert range value in detail
                        expect(exp.updateArgs[i][j]).toBe(
                            'range',
                            'scatter.update range update - ' + msg
                        );
                    } else {
                        expect(arg).toBe(
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
                    expect(arg).toBe(
                        exp.drawArgs[i][j],
                        'scatter.draw call' + i + ' arg' + j + ' - ' + msg
                    );
                });
            });

            scene.scatter2d.update.calls.reset();
            scene.scatter2d.draw.calls.reset();
        }

        var unselectBatchOld;

        Plotly.newPlot('graph', [{
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
        .then(function() {
            var scene = grabScene();
            spyOn(scene.scatter2d, 'update').and.callThrough();
            spyOn(scene.scatter2d, 'draw').and.callThrough();
        })
        .then(function() {
            _assert('base', {
                selectBatch: [],
                unselectBatch: [],
                updateArgs: [],
                drawArgs: []
            });
        })
        .then(function() { return select([[20, 20], [480, 250]]); })
        .then(function() {
            var scene = grabScene();
            _assert('after select', {
                selectBatch: [[1]],
                unselectBatch: [[0, 2]],
                updateArgs: [
                    // N.B. scatter2d now draws unselected options
                    [scene.markerUnselectedOptions],
                ],
                drawArgs: [
                    [scene.unselectBatch]
                ]
            });
        })
        .then(function() { return doubleClick(250, 250); })
        .then(function() {
            var scene = grabScene();
            _assert('after doubleclick', {
                selectBatch: [null],
                unselectBatch: [[0, 1, 2]],
                updateArgs: [],
                drawArgs: [
                    // call in no-selection loop (can we get rid of this?)
                    [0],
                    // call with unselectBatch
                    [scene.unselectBatch]
                ]
            });
        })
        .then(function() { return Plotly.relayout(gd, 'dragmode', 'pan'); })
        .then(function() {
            _assert('after relayout to *pan*', {
                selectBatch: [null],
                unselectBatch: [[0, 1, 2]],
                // nothing to do when relayouting to 'pan'
                updateArgs: [],
                drawArgs: []
            });

            // keep ref for next _assert()
            var scene = grabScene();
            unselectBatchOld = scene.unselectBatch;
        })
        .then(function() { return drag([[200, 200], [250, 250]]); })
        .then(function() {
            var scene = grabScene();
            _assert('after pan', {
                selectBatch: null,
                unselectBatch: null,
                // drag triggers:
                // - 2 scene.update() calls, which each invoke
                //   + 1 scatter2d.update (updating viewport)
                //   + 2 scatter2d.draw (same as after double-click)
                //
                // replot on mouseup triggers:
                // - 1 scatter2d.update updating viewport
                // - 1 scatter2d.update resetting markerOptions
                // - 1 (full) scene.draw()
                updateArgs: [
                    ['range'],
                    ['range'],
                    // N.B. bring scatter2d back to 'base' marker options
                    [scene.markerOptions],
                    ['range']
                ],
                drawArgs: [
                    [0],
                    [unselectBatchOld],
                    [0],
                    [unselectBatchOld],
                    [0]
                ]
            });
        })
        .catch(failTest)
        .then(done);
    });

    it('@gl should work on overlaid subplots', function(done) {
        gd = createGraphDiv();

        var scene, scene2;

        Plotly.plot(gd, [{
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
        .then(function() { return select([[20, 20], [380, 250]]); })
        .then(function() {
            expect(scene.scatter2d.draw).toHaveBeenCalledTimes(1);
            expect(scene2.scatter2d.draw).toHaveBeenCalledTimes(1);
        })
        .catch(failTest)
        .then(done);
    });
});
