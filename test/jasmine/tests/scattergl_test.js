var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var ScatterGl = require('@src/traces/scattergl');
var TOO_MANY_POINTS = require('@src/traces/scattergl/constants').TOO_MANY_POINTS;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var delay = require('../assets/delay');
var readPixel = require('../assets/read_pixel');
var checkTextTemplate = require('../assets/check_texttemplate');

describe('end-to-end scattergl tests', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function(done) {
        Plotly.purge(gd);
        destroyGraphDiv();
        setTimeout(done, 500);
    });

    it('@gl should create a plot with text labels', function(done) {
        Plotly.react(gd, [{
            type: 'scattergl',
            mode: 'text+lines',
            x: [1, 2, 3, 4, 5, 6, 7],
            y: [2, 3, 4, 5, 6, 7, 8],
            text: 'Test'
        }]).then(function() {
            var fullLayout = gd._fullLayout;
            var subplot = fullLayout._plots.xy;
            var scene = subplot._scene;
            expect(scene.glText.length).toEqual(1);
        }).then(done, done.fail);
    });

    it('@gl should update a plot with text labels', function(done) {
        Plotly.react(gd, [{
            type: 'scattergl',
            mode: 'text+lines',
            x: [1, 2, 3, 4, 5, 6, 7],
            y: [2, 3, 4, 5, 6, 7, 8],
            text: 'Test'
        }]).then(function() {
            var fullLayout = gd._fullLayout;
            var subplot = fullLayout._plots.xy;
            var scene = subplot._scene;
            expect(scene.glText.length).toEqual(1);

            // add plots
            return Plotly.react(gd, [
                {
                    type: 'scattergl',
                    mode: 'text+lines',
                    x: [1, 2, 3, 4, 5, 6, 7],
                    y: [2, 3, 4, 5, 6, 7, 8],
                    text: 'Test'
                },
                {
                    type: 'scattergl',
                    mode: 'text+lines',
                    x: [1, 2, 3, 4, 5, 6, 7],
                    y: [3, 4, 5, 6, 7, 8, 9],
                    text: 'Test 2'
                },
                {
                    type: 'scattergl',
                    mode: 'text+lines',
                    x: [1, 2, 3, 4, 5, 6, 7],
                    y: [4, 5, 6, 7, 8, 9, 10],
                    text: 'Test 3'
                }
            ]);
        }).then(function() {
            var fullLayout = gd._fullLayout;
            var subplot = fullLayout._plots.xy;
            var scene = subplot._scene;
            expect(scene.glText.length).toEqual(3);

            // remove plots
            return Plotly.react(gd, [
                {
                    type: 'scattergl',
                    mode: 'text+lines',
                    x: [1, 2, 3, 4, 5, 6, 7],
                    y: [2, 3, 4, 5, 6, 7, 8],
                    text: 'Test'
                },
                {
                    type: 'scattergl',
                    mode: 'text+lines',
                    x: [1, 2, 3, 4, 5, 6, 7],
                    y: [3, 4, 5, 6, 7, 8, 9],
                    text: 'Test 2'
                }
            ]);
        }).then(function() {
            var fullLayout = gd._fullLayout;
            var subplot = fullLayout._plots.xy;
            var scene = subplot._scene;
            expect(scene.glText.length).toEqual(2);
        }).then(done, done.fail);
    });

    ['text', 'texttemplate'].forEach(function(attr) {
        it('@gl should handle a plot with less ' + attr + ' labels than data points', function(done) {
            expect(function() {
                var mock = {
                    'type': 'scattergl',
                    'mode': 'markers+text',
                    'x': [3, 2, 1, 0],
                    'y': [0, 1, 4, 9],
                    'textposition': 'top center'
                };
                mock[attr] = ['1', '2', '3'];
                Plotly.newPlot(gd, [mock])
                .then(function() {
                    expect(mock[attr].length).toBe(3);
                })
                .catch(failTest);
            }).not.toThrow();
            done();
        });
    });

    it('@gl should be able to toggle visibility', function(done) {
        var mock = require('@mocks/gl2d_10.json');
        var _mock = Lib.extendDeep({}, mock);
        _mock.data[0].line.width = 5;

        function assertDrawCall(msg, exp) {
            var draw = gd._fullLayout._plots.xy._scene.scatter2d.draw;
            expect(draw).toHaveBeenCalledTimes(exp, msg);
            draw.calls.reset();
        }

        Plotly.newPlot(gd, _mock)
        .then(delay(30))
        .then(function() {
            spyOn(gd._fullLayout._plots.xy._scene.scatter2d, 'draw');
            return Plotly.restyle(gd, 'visible', 'legendonly');
        })
        .then(function() {
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 108, 100)[0]).toBe(0);
            assertDrawCall('legendonly', 0);

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 108, 100)[0]).not.toBe(0);
            assertDrawCall('back to visible', 1);

            return Plotly.restyle(gd, 'visible', false);
        })
        .then(function() {
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 108, 100)[0]).toBe(0);
            assertDrawCall('visible false', 0);

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            assertDrawCall('back up', 1);
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 108, 100)[0]).not.toBe(0);
        })
        .then(done, done.fail);
    });

    it('@gl should be able to toggle trace with different modes', function(done) {
        Plotly.newPlot(gd, [{
            // a trace with all regl2d objects
            type: 'scattergl',
            mode: 'lines+markers+text',
            y: [1, 2, 1],
            text: ['a', 'b', 'c'],
            error_x: {value: 10},
            error_y: {value: 10},
            fill: 'tozeroy'
        }, {
            type: 'scattergl',
            mode: 'markers',
            y: [0, 1, -1]
        }])
        .then(function() {
            var scene = gd._fullLayout._plots.xy._scene;
            spyOn(scene.fill2d, 'draw');
            spyOn(scene.line2d, 'draw');
            spyOn(scene.error2d, 'draw');
            spyOn(scene.scatter2d, 'draw');
            spyOn(scene.glText[0], 'render');

            return Plotly.restyle(gd, 'visible', 'legendonly', [0]);
        })
        .then(function() {
            var scene = gd._fullLayout._plots.xy._scene;
            expect(scene.fill2d.draw).toHaveBeenCalledTimes(0);
            expect(scene.line2d.draw).toHaveBeenCalledTimes(0);
            expect(scene.error2d.draw).toHaveBeenCalledTimes(0);
            expect(scene.glText[0].render).toHaveBeenCalledTimes(0);
            expect(scene.scatter2d.draw).toHaveBeenCalledTimes(1);

            return Plotly.restyle(gd, 'visible', true, [0]);
        })
        .then(function() {
            var scene = gd._fullLayout._plots.xy._scene;
            expect(scene.fill2d.draw).toHaveBeenCalledTimes(1);
            expect(scene.line2d.draw).toHaveBeenCalledTimes(1);
            expect(scene.error2d.draw).toHaveBeenCalledTimes(2, 'twice for x AND y');
            expect(scene.glText[0].render).toHaveBeenCalledTimes(1);
            expect(scene.scatter2d.draw).toHaveBeenCalledTimes(3, 'both traces have markers');
        })
        .then(done, done.fail);
    });

    it('@gl should change plot type with incomplete data', function(done) {
        Plotly.newPlot(gd, [{}])
        .then(function() {
            expect(function() {
                return Plotly.restyle(gd, {type: 'scattergl', x: [[1]]}, 0);
            }).not.toThrow();
        })
        .then(function() {
            expect(function() {
                return Plotly.restyle(gd, {y: [[1]]}, 0);
            }).not.toThrow();
        })
        .then(done, done.fail);
    });

    it('@gl should restyle opacity', function(done) {
        // #2299
        spyOn(ScatterGl, 'calc').and.callThrough();

        var dat = [{
            'x': [1, 2, 3],
            'y': [1, 2, 3],
            'type': 'scattergl',
            'mode': 'markers'
        }];

        Plotly.newPlot(gd, dat, {width: 500, height: 500})
        .then(function() {
            expect(ScatterGl.calc).toHaveBeenCalledTimes(1);

            return Plotly.restyle(gd, {'opacity': 0.1});
        })
        .then(function() {
            expect(ScatterGl.calc).toHaveBeenCalledTimes(2);
        })
        .then(done, done.fail);
    });

    it('@gl should update selected points', function(done) {
        // #2298
        var dat = [{
            'x': [1],
            'y': [1],
            'type': 'scattergl',
            'mode': 'markers',
            'selectedpoints': [0]
        }];

        Plotly.newPlot(gd, dat, {
            width: 500,
            height: 500,
            dragmode: 'select'
        })
        .then(function() {
            var scene = gd._fullLayout._plots.xy._scene;

            expect(scene.count).toBe(1);
            expect(scene.selectBatch).toEqual([[0]]);
            expect(scene.unselectBatch).toEqual([[]]);
            spyOn(scene.scatter2d, 'draw');

            var trace = {
                x: [2],
                y: [1],
                text: ['a'],
                type: 'scattergl',
                mode: 'markers+text',
                marker: {color: 'red'}
            };

            return Plotly.addTraces(gd, trace);
        })
        .then(function() {
            var scene = gd._fullLayout._plots.xy._scene;

            expect(scene.count).toBe(2);
            expect(scene.selectBatch).toEqual([[0], []]);
            expect(scene.unselectBatch).toEqual([[], []]);
            expect(scene.markerOptions.length).toBe(2);
            expect(scene.markerOptions[1].color).toEqual(new Uint8Array([255, 0, 0, 255]));
            expect(scene.textOptions.length).toBe(2);
            expect(scene.textOptions[1].color).toEqual('#444');
            expect(scene.scatter2d.draw).toHaveBeenCalled();

            return Plotly.restyle(gd, 'selectedpoints', null);
        })
        .then(function() {
            var scene = gd._fullLayout._plots.xy._scene;
            var msg = 'clearing under dragmode select';

            expect(scene.selectBatch).toEqual([[], []], msg);
            expect(scene.unselectBatch).toEqual([[], []], msg);

            // scattergl uses different pathways for select/lasso & zoom/pan
            return Plotly.relayout(gd, 'dragmode', 'pan');
        })
        .then(function() {
            var scene = gd._fullLayout._plots.xy._scene;
            var msg = 'cleared under dragmode pan';

            expect(scene.selectBatch).toEqual([[], []], msg);
            expect(scene.unselectBatch).toEqual([[], []], msg);

            return Plotly.restyle(gd, 'selectedpoints', [[1, 2], [0]]);
        })
        .then(function() {
            var scene = gd._fullLayout._plots.xy._scene;
            var msg = 'selecting via API under dragmode pan';

            expect(scene.selectBatch).toEqual([[1, 2], [0]], msg);
            expect(scene.unselectBatch).toEqual([[0], []], msg);

            return Plotly.restyle(gd, 'selectedpoints', null);
        })
        .then(function() {
            var scene = gd._fullLayout._plots.xy._scene;
            var msg = 'clearing under dragmode pan';

            expect(scene.selectBatch).toEqual([[], []], msg);
            expect(scene.unselectBatch).toEqual([[], []], msg);
        })
        .then(done, done.fail);
    });

    it('@gl should remove fill2d', function(done) {
        var mock = require('@mocks/gl2d_axes_labels2.json');

        Plotly.newPlot(gd, mock.data, mock.layout)
        .then(delay(1000))
        .then(function() {
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 100, 80)[0]).not.toBe(0);

            return Plotly.restyle(gd, {fill: 'none'});
        })
        .then(function() {
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 100, 80)[0]).toBe(0);
        })
        .then(done, done.fail);
    });

    it('@gl should be able to draw more than 4096 colors', function(done) {
        var x = [];
        var color = [];
        var N = 1e5;
        var w = 500;
        var h = 500;

        Lib.seedPseudoRandom();

        for(var i = 0; i < N; i++) {
            x.push(i);
            color.push(Lib.pseudoRandom());
        }

        Plotly.newPlot(gd, [{
            type: 'scattergl',
            mode: 'markers',
            x: x,
            y: color,
            marker: {
                color: color,
                colorscale: [
                    [0, 'rgb(255, 0, 0)'],
                    [0.5, 'rgb(0, 255, 0)'],
                    [1.0, 'rgb(0, 0, 255)']
                ]
            }
        }], {
            width: w,
            height: h,
            margin: {l: 0, t: 0, b: 0, r: 0}
        })
        .then(function() {
            var total = readPixel(gd.querySelector('.gl-canvas-context'), 0, 0, w, h)
                .reduce(function(acc, v) { return acc + v; }, 0);

            // the total value was 3777134 before PR
            // https://github.com/plotly/plotly.js/pull/2377
            // and 105545275 after.
            expect(total).toBeGreaterThan(4e6);
        })
        .then(done, done.fail);
    });

    it('@gl should work with typed array', function(done) {
        Plotly.newPlot(gd, [{
            type: 'scattergl',
            mode: 'markers',
            x: new Float32Array([1, 2, 3]),
            y: new Float32Array([1, 2, 1]),
            marker: {
                size: 20,
                colorscale: [[0, 'gray'], [1, 'red']],
                cmin: 0,
                cmax: 1,
                showscale: true,
                color: new Float32Array([0, 0.5, 1.0])
            }
        }])
        .then(function() {
            var opts = gd.calcdata[0][0].t._scene.markerOptions[0];

            expect(opts.colors).toBeCloseTo2DArray([
                [0.5, 0.5, 0.5, 1],
                [0.75, 0.25, 0.25, 1],
                [1, 0, 0, 1]
            ]);

            expect(opts.positions)
                .toBeCloseToArray([1, 1, 2, 2, 3, 1]);
        })
        .then(done, done.fail);
    });

    it('@gl should handle transform traces properly (calcTransform case)', function(done) {
        spyOn(ScatterGl, 'calc').and.callThrough();

        Plotly.newPlot(gd, [{
            type: 'scattergl',
            x: [1, 2, 3],
            y: [1, 2, 1],
            transforms: [{
                type: 'filter',
                target: 'x',
                operation: '>',
                value: 1
            }]
        }])
        .then(function() {
            expect(ScatterGl.calc).toHaveBeenCalledTimes(2);

            var opts = gd.calcdata[0][0].t._scene.markerOptions;
            // length === 2 before #2677
            expect(opts.length).toBe(1);

            return Plotly.restyle(gd, 'selectedpoints', [[1]]);
        })
        .then(function() {
            // was === 1 before #2677
            var scene = gd.calcdata[0][0].t._scene;
            expect(scene.selectBatch[0]).toEqual([0]);
        })
        .then(done, done.fail);
    });

    it('@gl should handle transform traces properly (default transform case)', function(done) {
        spyOn(ScatterGl, 'calc').and.callThrough();

        Plotly.newPlot(gd, [{
            type: 'scattergl',
            x: [1, 2, 3],
            y: [1, 2, 1],
            transforms: [{
                type: 'groupby',
                groups: ['a', 'b', 'a']
            }]
        }])
        .then(function() {
            // twice per 'expanded' trace
            expect(ScatterGl.calc).toHaveBeenCalledTimes(4);

            // 'scene' from opts0 and opts1 is linked to the same object,
            // which has two items, one for each 'expanded' trace
            var opts0 = gd.calcdata[0][0].t._scene.markerOptions;
            expect(opts0.length).toBe(2);

            var opts1 = gd.calcdata[1][0].t._scene.markerOptions;
            expect(opts1.length).toBe(2);

            return Plotly.restyle(gd, 'selectedpoints', [[1]]);
        })
        .then(function() {
            var scene = gd.calcdata[0][0].t._scene;
            expect(scene.selectBatch).toEqual([[], [0]]);
        })
        .then(done, done.fail);
    });

    it('@gl should not cause infinite loops when coordinate arrays start/end with NaN', function(done) {
        function _assertPositions(msg, cont, exp) {
            var pos = gd._fullLayout._plots.xy._scene[cont]
                .map(function(opt) { return opt.positions; });
            expect(pos).toBeCloseTo2DArray(exp, 2, msg);
        }

        Plotly.newPlot(gd, [{
            type: 'scattergl',
            mode: 'lines',
            x: [1, 2, 3],
            y: [null, null, null]
        }, {
            type: 'scattergl',
            mode: 'lines',
            x: [1, 2, 3],
            y: [1, 2, null]
        }, {
            type: 'scattergl',
            mode: 'lines',
            x: [null, 2, 3],
            y: [1, 2, 3]
        }, {
            type: 'scattergl',
            mode: 'lines',
            x: [null, null, null],
            y: [1, 2, 3]
        }, {
        }])
        .then(function() {
            _assertPositions('base', 'lineOptions', [
                [],
                [1, 1, 2, 2],
                [2, 2, 3, 3],
                []
            ]);

            return Plotly.restyle(gd, 'fill', 'tozerox');
        })
        .then(function() {
            _assertPositions('tozerox', 'lineOptions', [
                [],
                [1, 1, 2, 2],
                [2, 2, 3, 3],
                []
            ]);
            _assertPositions('tozerox', 'fillOptions', [
                [0, undefined, 0, undefined],
                [0, 1, 1, 1, 2, 2, 0, 2],
                [0, 2, 2, 2, 3, 3, 0, 3],
                [0, undefined, 0, undefined]
            ]);

            return Plotly.restyle(gd, 'fill', 'tozeroy');
        })
        .then(function() {
            _assertPositions('tozeroy', 'lineOptions', [
                [],
                [1, 1, 2, 2],
                [2, 2, 3, 3],
                []
            ]);
            _assertPositions('tozeroy', 'fillOptions', [
                [undefined, 0, undefined, 0],
                [1, 0, 1, 1, 2, 2, 2, 0],
                [2, 0, 2, 2, 3, 3, 3, 0],
                [undefined, 0, undefined, 0]
            ]);
        })
        .then(done, done.fail);
    });

    it('@gl should reset the sanp to length after react and not to TOO_MANY_POINTS constant', function(done) {
        Lib.seedPseudoRandom();

        function fig(num) {
            var x = [];
            var y = [];
            for(var i = 0; i < num; i++) {
                x.push(Lib.pseudoRandom());
                y.push(Lib.pseudoRandom());
            }

            return {
                data: [{
                    x: x, y: y,
                    mode: 'lines+markers',
                    type: 'scattergl',
                    marker: {
                        size: 20,
                        color: 'rgba(0,0,255,0.5)'
                    }
                }]
            };
        }

        var getSnap = function() {
            return gd._fullLayout._plots.xy._scene.markerOptions[0].snap;
        };

        Plotly.newPlot(gd, fig(TOO_MANY_POINTS))
        .then(function() {
            expect(getSnap()).toEqual(TOO_MANY_POINTS);

            return Plotly.react(gd, fig(20));
        })
        .then(function() {
            expect(getSnap()).toEqual(20);

            return Plotly.react(gd, fig(TOO_MANY_POINTS + 1));
        })
        .then(function() {
            expect(getSnap()).toEqual(TOO_MANY_POINTS + 1);
        }).then(done, done.fail);
    });
});

describe('Test scattergl autorange:', function() {
    describe('should return the same value as SVG scatter for ~small~ data', function() {
        var gd;

        beforeEach(function() {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
            gd = createGraphDiv();
        });

        afterEach(function() {
            Plotly.purge(gd);
            destroyGraphDiv();
        });

        var specs = [
            {name: 'lines+markers', fig: require('@mocks/gl2d_10.json')},
            {name: 'bubbles', fig: require('@mocks/gl2d_12.json')},
            {name: 'line on log axes', fig: require('@mocks/gl2d_14.json')},
            {name: 'fill to zero', fig: require('@mocks/gl2d_axes_labels2.json')},
            {name: 'annotations', fig: require('@mocks/gl2d_annotations.json')}
        ];

        specs.forEach(function(s) {
            it('@gl - case ' + s.name, function(done) {
                var glRangeX;
                var glRangeY;

                // ensure the mocks have auto-range turned on
                var glFig = Lib.extendDeep({}, s.fig);
                Lib.extendDeep(glFig.layout, {xaxis: {autorange: true}});
                Lib.extendDeep(glFig.layout, {yaxis: {autorange: true}});

                var svgFig = Lib.extendDeep({}, glFig);
                svgFig.data.forEach(function(t) { t.type = 'scatter'; });

                Plotly.newPlot(gd, glFig).then(function() {
                    glRangeX = gd._fullLayout.xaxis.range;
                    glRangeY = gd._fullLayout.yaxis.range;
                })
                .then(function() {
                    return Plotly.newPlot(gd, svgFig);
                })
                .then(function() {
                    expect(gd._fullLayout.xaxis.range).toBeCloseToArray(glRangeX, 'x range');
                    expect(gd._fullLayout.yaxis.range).toBeCloseToArray(glRangeY, 'y range');
                })
                .then(done, done.fail);
            });
        });
    });

    describe('should return the approximative values for ~big~ data', function() {
        var gd;

        beforeEach(function() {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
            gd = createGraphDiv();
            // to avoid expansive draw calls (which could be problematic on CI)
            spyOn(ScatterGl, 'plot').and.callFake(function(gd) {
                gd._fullLayout._plots.xy._scene.scatter2d = {draw: function() {}};
                gd._fullLayout._plots.xy._scene.line2d = {draw: function() {}};
            });
        });

        afterEach(function() {
            Plotly.purge(gd);
            destroyGraphDiv();
        });

        // threshold for 'fast' axis expansion routine
        var N = 1e5;
        var x = new Array(N);
        var y = new Array(N);
        var ms = new Array(N);

        Lib.seedPseudoRandom();

        for(var i = 0; i < N; i++) {
            x[i] = Lib.pseudoRandom();
            y[i] = Lib.pseudoRandom();
            ms[i] = 10 * Lib.pseudoRandom() + 20;
        }

        it('@gl - case scalar marker.size', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scattergl',
                mode: 'markers',
                x: x,
                y: y,
                marker: {size: 10}
            }])
            .then(function() {
                expect(gd._fullLayout.xaxis.range).toBeCloseToArray([-0.079, 1.079], 2, 'x range');
                expect(gd._fullLayout.yaxis.range).toBeCloseToArray([-0.105, 1.105], 2, 'y range');
            })
            .then(done, done.fail);
        });

        it('@gl - case array marker.size', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scattergl',
                mode: 'markers',
                x: x,
                y: y,
                marker: {size: ms}
            }])
            .then(function() {
                expect(gd._fullLayout.xaxis.range).toBeCloseToArray([-0.119, 1.119], 2, 'x range');
                expect(gd._fullLayout.yaxis.range).toBeCloseToArray([-0.199, 1.199], 2, 'y range');
            })
            .then(done, done.fail);
        });

        it('@gl - case mode:lines', function(done) {
            Plotly.newPlot(gd, [{
                type: 'scattergl',
                mode: 'lines',
                y: y,
            }])
            .then(function() {
                expect(gd._fullLayout.xaxis.range).toBeCloseToArray([0, N - 1], 2, 'x range');
                expect(gd._fullLayout.yaxis.range).toBeCloseToArray([-0.0555, 1.0555], 2, 'y range');
            })
            .then(done, done.fail);
        });
    });
});

describe('Test texttemplate for scattergl', function() {
    checkTextTemplate([{
        type: 'scattergl',
        mode: 'text+lines',
        x: [1, 2, 3, 4],
        y: [2, 3, 4, 5],
        text: ['A', 'B', 'C', 'D'],
    }], '@gl', [
        ['%{text}: %{x}, %{y}', ['A: 1, 2', 'B: 2, 3', 'C: 3, 4', 'D: 4, 5']],
        [['%{x}', '%{x}', '%{text}', '%{y}'], ['1', '2', 'C', '5']]
    ]);

    checkTextTemplate({
        data: [{
            type: 'scattergl',
            mode: 'text',
            x: ['a', 'b'],
            y: ['1000', '1200']
        }],
        layout: {
            xaxis: { tickprefix: '*', ticksuffix: '*' },
            yaxis: { tickprefix: '$', ticksuffix: ' !', tickformat: '.2f'}
        }
    }, '@gl', [
        ['%{x} is %{y}', ['*a* is $1000.00 !', '*b* is $1200.00 !']]
    ]);

    checkTextTemplate({
        data: [{
            type: 'scattergl',
            mode: 'text',
            y: ['1000', '1200']
        }],
        layout: {
            xaxis: { tickprefix: '*', ticksuffix: '*' },
            yaxis: { tickprefix: '$', ticksuffix: ' !', tickformat: '.2f'}
        }
    }, '@gl', [
        ['%{x} is %{y}', ['*0* is $1000.00 !', '*1* is $1200.00 !']]
    ]);
});
