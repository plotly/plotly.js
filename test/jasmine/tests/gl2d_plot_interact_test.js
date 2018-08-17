var d3 = require('d3');

var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Drawing = require('@src/components/drawing');
var ScatterGl = require('@src/traces/scattergl');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var touchEvent = require('../assets/touch_event');
var drag = require('../assets/drag');
var selectButton = require('../assets/modebar_button');
var delay = require('../assets/delay');
var readPixel = require('../assets/read_pixel');

function countCanvases() {
    return d3.selectAll('canvas').size();
}

describe('@gl Test removal of gl contexts', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('Plots.cleanPlot should remove gl context from the graph div of a gl2d plot', function(done) {
        Plotly.plot(gd, [{
            type: 'scattergl',
            x: [1, 2, 3],
            y: [2, 1, 3]
        }])
        .then(function() {
            expect(gd._fullLayout._plots.xy._scene).toBeDefined();
            Plots.cleanPlot([], {}, gd._fullData, gd._fullLayout);

            expect(!!gd._fullLayout._plots.xy._scene).toBe(false);
        })
        .catch(failTest)
        .then(done);
    });

    it('Plotly.newPlot should remove gl context from the graph div of a gl2d plot', function(done) {
        var firstGlplotObject, firstGlContext, firstCanvas;

        Plotly.plot(gd, [{
            type: 'scattergl',
            x: [1, 2, 3],
            y: [2, 1, 3]
        }])
        .then(function() {
            firstGlplotObject = gd._fullLayout._plots.xy._scene;
            firstGlContext = firstGlplotObject.scatter2d.gl;
            firstCanvas = firstGlContext.canvas;

            expect(firstGlplotObject).toBeDefined();
            expect(firstGlContext).toBeDefined();
            expect(firstGlContext instanceof WebGLRenderingContext);

            return Plotly.newPlot(gd, [{
                type: 'scattergl',
                x: [1, 2, 3],
                y: [2, 1, 3]
            }], {});
        })
        .then(function() {
            var secondGlplotObject = gd._fullLayout._plots.xy._scene;
            var secondGlContext = secondGlplotObject.scatter2d.gl;
            var secondCanvas = secondGlContext.canvas;

            expect(Object.keys(gd._fullLayout._plots).length === 1);
            expect(secondGlplotObject).not.toBe(firstGlplotObject);
            expect(firstGlplotObject.gl === null);
            expect(secondGlContext instanceof WebGLRenderingContext);
            expect(secondGlContext).not.toBe(firstGlContext);

            expect(
                firstCanvas.parentNode === null ||
                firstCanvas !== secondCanvas && firstGlContext.isContextLost()
            );
        })
        .catch(failTest)
        .then(done);
    });
});

describe('@gl Test gl plot side effects', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('should not draw the rangeslider', function(done) {
        var data = [{
            x: [1, 2, 3],
            y: [2, 3, 4],
            type: 'scattergl'
        }, {
            x: [1, 2, 3],
            y: [2, 3, 4],
            type: 'scatter'
        }];

        var layout = {
            xaxis: { rangeslider: { visible: true } }
        };

        Plotly.plot(gd, data, layout).then(function() {
            var rangeSlider = document.getElementsByClassName('range-slider')[0];
            expect(rangeSlider).not.toBeDefined();
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to replot from a blank graph', function(done) {

        function countCanvases(cnt) {
            var nodes = d3.selectAll('canvas');
            expect(nodes.size()).toEqual(cnt);
        }

        var data = [{
            type: 'scattergl',
            x: [1, 2, 3],
            y: [2, 1, 2]
        }];

        Plotly.plot(gd, [])
        .then(function() {
            countCanvases(0);

            return Plotly.plot(gd, data);
        })
        .then(function() {
            countCanvases(3);

            return Plotly.purge(gd);
        })
        .then(function() {
            countCanvases(0);

            return Plotly.plot(gd, data);
        })
        .then(function() {
            countCanvases(3);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            countCanvases(0);

            return Plotly.purge(gd);
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to switch trace type', function(done) {
        Plotly.newPlot(gd, [{
            type: 'parcoords',
            x: [1, 2, 3],
            y: [2, 1, 2],
            dimensions: [
                {
                    constraintrange: [200, 700],
                    label: 'Block height',
                    values: [321, 534, 542, 674, 31, 674, 124, 246, 456, 743]
                }
            ]
        }])
        .then(function() {
            expect(d3.selectAll('canvas').size()).toEqual(3);

            return Plotly.restyle(gd, 'type', 'scatter');
        })
        .then(function() {
            expect(d3.selectAll('canvas').size()).toEqual(0);
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to resize canvas properly', function(done) {
        var _mock = Lib.extendDeep({}, require('@mocks/gl2d_10.json'));
        _mock.data[0].line.width = 5;

        _mock.layout.width = 600;

        Plotly.plot(gd, _mock)
        .then(function() {
            expect(gd.querySelector('.gl-canvas-context').width).toBe(600);

            Plotly.relayout(gd, {width: 300});
        })
        .then(function() {
            expect(gd.querySelector('.gl-canvas-context').width).toBe(300);
        })
        .catch(failTest)
        .then(done);
    });
});

describe('@gl Test gl2d plots', function() {
    var gd;
    var mock = require('@mocks/gl2d_10.json');

    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    function mouseTo(p0, p1) {
        var node = d3.select('.nsewdrag[data-subplot="xy"]').node();
        var dx = p1[0] - p0[0];
        var dy = p1[1] - p0[1];
        return drag(node, dx, dy, null, p0[0], p0[1]);
    }

    function select(path) {
        return new Promise(function(resolve) {
            gd.once('plotly_selected', resolve);

            var len = path.length;

            // do selection
            Lib.clearThrottle();
            mouseEvent('mousemove', path[0][0], path[0][1]);
            mouseEvent('mousedown', path[0][0], path[0][1]);

            path.slice(1, len).forEach(function(pt) {
                Lib.clearThrottle();
                mouseEvent('mousemove', pt[0], pt[1]);
            });

            mouseEvent('mouseup', path[len - 1][0], path[len - 1][1]);
        });
    }

    it('@flaky should respond to drag interactions', function(done) {
        var _mock = Lib.extendDeep({}, mock);

        var relayoutCallback = jasmine.createSpy('relayoutCallback');

        var originalX = [-0.3037383177570093, 5.303738317757009];
        var originalY = [-0.5806379476536665, 6.218528262566369];
        var newX = [-0.5516431924882629, 5.082159624413145];
        var newY = [-1.7947747709072441, 5.004391439312791];
        var precision = 1;

        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            expect(gd.layout.xaxis.autorange).toBe(true);
            expect(gd.layout.yaxis.autorange).toBe(true);
            expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);

            // Switch to pan mode
            var buttonPan = selectButton(gd._fullLayout._modeBar, 'pan2d');
            expect(buttonPan.isActive()).toBe(false, 'initially, zoom is active');
            buttonPan.click();
            expect(buttonPan.isActive()).toBe(true, 'switched on dragmode');

            // Switching mode must not change visible range
            expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);
        })
        .then(delay(20))
        .then(function() {
            gd.on('plotly_relayout', relayoutCallback);
        })
        .then(function() {
            var scene = gd._fullLayout._plots.xy._scene;
            spyOn(scene, 'draw');

            // Drag scene along the X axis
            return mouseTo([200, 200], [220, 200]);
        })
        .then(function() {
            var scene = gd._fullLayout._plots.xy._scene;
            expect(scene.draw).toHaveBeenCalledTimes(3);

            expect(gd.layout.xaxis.autorange).toBe(false);
            expect(gd.layout.yaxis.autorange).toBe(false);
            expect(gd.layout.xaxis.range).toBeCloseToArray(newX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);
        })
        .then(function() {
            // Drag scene back along the X axis
            return mouseTo([220, 200], [200, 200]);
        })
        .then(function() {
            expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);
        })
        .then(function() {
            // Drag scene along the Y axis
            return mouseTo([200, 200], [200, 150]);
        })
        .then(function() {
            expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(newY, precision);
        })
        .then(function() {
            // Drag scene back along the Y axis
            return mouseTo([200, 150], [200, 200]);
        })
        .then(function() {
            expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);
        })
        .then(function() {
            // Drag scene along both the X and Y axis
            return mouseTo([200, 200], [220, 150]);
        })
        .then(function() {
            expect(gd.layout.xaxis.range).toBeCloseToArray(newX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(newY, precision);
        })
        .then(function() {
            // Drag scene back along the X and Y axis
            return mouseTo([220, 150], [200, 200]);
        })
        .then(function() {
            expect(gd.layout.xaxis.range).toBeCloseToArray(originalX, precision);
            expect(gd.layout.yaxis.range).toBeCloseToArray(originalY, precision);
        })
        .then(delay(20))
        .then(function() {
            // callback count expectation: X and back; Y and back; XY and back
            expect(relayoutCallback).toHaveBeenCalledTimes(6);

            // a callback value structure and contents check
            expect(relayoutCallback).toHaveBeenCalledWith(jasmine.objectContaining({
                'xaxis.range[0]': jasmine.any(Number),
                'xaxis.range[1]': jasmine.any(Number),
                'yaxis.range[0]': jasmine.any(Number),
                'yaxis.range[1]': jasmine.any(Number)
            }));
        })
        .catch(failTest)
        .then(done);
    });

    it('@flaky should be able to toggle visibility', function(done) {
        var _mock = Lib.extendDeep({}, mock);
        _mock.data[0].line.width = 5;

        function assertDrawCall(msg, exp) {
            var draw = gd._fullLayout._plots.xy._scene.scatter2d.draw;
            expect(draw).toHaveBeenCalledTimes(exp, msg);
            draw.calls.reset();
        }

        Plotly.plot(gd, _mock)
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
        .catch(failTest)
        .then(done);
    });

    it('should be able to toggle trace with different modes', function(done) {
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
        .catch(failTest)
        .then(done);
    });

    it('@noCI should display selection of big number of regular points', function(done) {
        // generate large number of points
        var x = [], y = [], n = 2e2, N = n * n;
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

        Plotly.plot(gd, mock)
        .then(select([[160, 100], [180, 100]]))
        .then(function() {
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 168, 100)[3]).toBe(0);
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 158, 100)[3]).not.toBe(0);
            expect(readPixel(gd.querySelector('.gl-canvas-focus'), 168, 100)[3]).not.toBe(0);
        })
        .catch(failTest)
        .then(done);
    });

    it('@noCI should display selection of big number of miscellaneous points', function(done) {
        var colorList = [
            '#006385', '#F06E75', '#90ed7d', '#f7a35c', '#8085e9',
            '#f15c80', '#e4d354', '#2b908f', '#f45b5b', '#91e8e1',
            '#5DA5DA', '#F06E75', '#F15854', '#B2912F', '#B276B2',
            '#DECF3F', '#FAA43A', '#4D4D4D', '#F17CB0', '#60BD68'
        ];

        // generate large number of points
        var x = [], y = [], n = 2e2, N = n * n, color = [], symbol = [], size = [];
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

        Plotly.plot(gd, mock)
        .then(select([[160, 100], [180, 100]]))
        .then(function() {
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 168, 100)[3]).toBe(0);
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 158, 100)[3]).not.toBe(0);
            expect(readPixel(gd.querySelector('.gl-canvas-focus'), 168, 100)[3]).not.toBe(0);
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to toggle from svg to gl', function(done) {
        Plotly.plot(gd, [{
            y: [1, 2, 1],
        }])
        .then(function() {
            expect(countCanvases()).toBe(0);
            expect(d3.selectAll('.scatterlayer > .trace').size()).toBe(1);

            return Plotly.restyle(gd, 'type', 'scattergl');
        })
        .then(function() {
            expect(countCanvases()).toBe(3);
            expect(d3.selectAll('.scatterlayer > .trace').size()).toBe(0);

            return Plotly.restyle(gd, 'type', 'scatter');
        })
        .then(function() {
            expect(countCanvases()).toBe(0);
            expect(d3.selectAll('.scatterlayer > .trace').size()).toBe(1);
        })
        .catch(failTest)
        .then(done);
    });

    it('@flaky supports 1D and 2D Zoom', function(done) {
        var centerX;
        var centerY;

        Plotly.newPlot(gd, [{
            type: 'scattergl', x: [1, 15], y: [1, 15]
        }], {
            width: 400,
            height: 400,
            margin: {t: 100, b: 100, l: 100, r: 100},
            xaxis: {range: [0, 16]},
            yaxis: {range: [0, 16]}
        })
        .then(function() {
            var bBox = gd.getBoundingClientRect();
            centerX = bBox.left + 200;
            centerY = bBox.top + 200;

            return mouseTo([centerX, centerY], [centerX - 5, centerY + 5]);
        })
        .then(function() {
            // no change - too small
            expect(gd.layout.xaxis.range).toBeCloseToArray([0, 16], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([0, 16], 3);
        })
        .then(function() {
            return mouseTo([centerX - 50, centerY], [centerX + 50, centerY + 50]);
        })
        .then(function() {
            // 2D
            expect(gd.layout.xaxis.range).toBeCloseToArray([4, 12], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([4, 8], 3);
        })
        .then(function() {
            return mouseTo([centerX - 50, centerY], [centerX, centerY + 5]);
        })
        .then(function() {
            // x only
            expect(gd.layout.xaxis.range).toBeCloseToArray([6, 8], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([4, 8], 3);
        })
        .then(function() {
            return mouseTo([centerX, centerY - 50], [centerX - 5, centerY + 50]);
        })
        .then(function() {
            // y only
            expect(gd.layout.xaxis.range).toBeCloseToArray([6, 8], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([5, 7], 3);
        })
        .catch(failTest)
        .then(done);
    });

    it('@flaky supports axis constraints with zoom', function(done) {
        var centerX;
        var centerY;

        Plotly.newPlot(gd, [{
            type: 'scattergl', x: [1, 15], y: [1, 15]
        }], {
            width: 400,
            height: 400,
            margin: {t: 100, b: 100, l: 100, r: 100},
            xaxis: {range: [0, 16]},
            yaxis: {range: [0, 16]}
        })
        .then(function() {
            var bBox = gd.getBoundingClientRect();
            centerX = bBox.left + 200;
            centerY = bBox.top + 200;

            return Plotly.relayout(gd, {
                'yaxis.scaleanchor': 'x',
                'yaxis.scaleratio': 2
            });
        })
        .then(function() {
            // x range is adjusted to fit constraint
            expect(gd.layout.xaxis.range).toBeCloseToArray([-8, 24], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([0, 16], 3);
        })
        .then(function() {
            return mouseTo([centerX, centerY], [centerX - 5, centerY + 5]);
        })
        .then(function() {
            // no change - too small
            expect(gd.layout.xaxis.range).toBeCloseToArray([-8, 24], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([0, 16], 3);
        })
        .then(function() {
            // now there should only be 2D zooming
            // dy>>dx
            return mouseTo([centerX, centerY], [centerX - 1, centerY - 50]);
        })
        .then(function() {
            expect(gd.layout.xaxis.range).toBeCloseToArray([0, 8], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([8, 12], 3);
        })
        .then(function() {
            return mouseTo([centerX, centerY], [centerX + 50, centerY + 1]);
        })
        .then(function() {
            // dx>>dy
            expect(gd.layout.xaxis.range).toBeCloseToArray([4, 6], 3);
            expect(gd.layout.yaxis.range).toBeCloseToArray([9, 10], 3);
        })
        .then(function() {
            return Plotly.relayout(gd, {
                'xaxis.autorange': true,
                'yaxis.autorange': true
            });
        })
        .then(function() {
            expect(gd.layout.xaxis.range).toBeCloseToArray([-8.2, 24.2], 1);
            expect(gd.layout.yaxis.range).toBeCloseToArray([-0.12, 16.1], 1);
        })
        .catch(failTest)
        .then(done);
    });

    it('@flaky should change plot type with incomplete data', function(done) {
        Plotly.plot(gd, [{}]);
        expect(function() {
            Plotly.restyle(gd, {type: 'scattergl', x: [[1]]}, 0);
        }).not.toThrow();

        expect(function() {
            Plotly.restyle(gd, {y: [[1]]}, 0);
        }).not.toThrow();

        done();
    });

    it('@flaky data-referenced annotations should update on drag', function(done) {
        function assertAnnotation(xy) {
            var ann = d3.select('g.annotation-text-g').select('g');
            var translate = Drawing.getTranslate(ann);

            expect(translate.x).toBeWithin(xy[0], 8);
            expect(translate.y).toBeWithin(xy[1], 8);
        }

        Plotly.newPlot(gd, [{
            type: 'scattergl',
            x: [1, 2, 3],
            y: [2, 1, 2]
        }], {
            annotations: [{
                x: 2,
                y: 1,
                text: 'text'
            }],
            dragmode: 'pan'
        })
        .then(function() {
            assertAnnotation([327, 312]);
        })
        .then(function() {
            return mouseTo([250, 200], [200, 150]);
        })
        .then(function() {
            assertAnnotation([277, 262]);
        })
        .then(function() {
            return Plotly.relayout(gd, {
                'xaxis.range': [1.5, 2.5],
                'yaxis.range': [1, 1.5]
            });
        })
        .then(function() {
            assertAnnotation([327, 331]);
        })
        .catch(failTest)
        .then(done);
    });

    it('@flaky should not scroll document while panning', function(done) {
        var mock = {
            data: [
                { type: 'scattergl', y: [1, 2, 3], x: [1, 2, 3] }
            ],
            layout: {
                width: 500,
                height: 500
            }
        };

        var sceneTarget, relayoutCallback = jasmine.createSpy('relayoutCallback');

        function scroll(target, amt) {
            return new Promise(function(resolve) {
                target.dispatchEvent(new WheelEvent('wheel', {deltaY: amt || 1, cancelable: true}));
                setTimeout(resolve, 0);
            });
        }

        function touchDrag(target, start, end) {
            return new Promise(function(resolve) {
                touchEvent('touchstart', start[0], start[1], {element: target});
                touchEvent('touchmove', end[0], end[1], {element: target});
                touchEvent('touchend', end[0], end[1], {element: target});
                setTimeout(resolve, 0);
            });
        }

        function assertEvent(e) {
            expect(e.defaultPrevented).toEqual(true);
            relayoutCallback();
        }

        gd.addEventListener('touchstart', assertEvent);
        gd.addEventListener('wheel', assertEvent);

        Plotly.plot(gd, mock)
        .then(function() {
            sceneTarget = gd.querySelector('.nsewdrag');

            return touchDrag(sceneTarget, [100, 100], [0, 0]);
        })
        .then(function() {
            return scroll(sceneTarget);
        })
        .then(function() {
            expect(relayoutCallback).toHaveBeenCalledTimes(1);

        })
        .catch(failTest)
        .then(done);
    });

    it('should restyle opacity', function(done) {
        // #2299
        spyOn(ScatterGl, 'calc');

        var dat = [{
            'x': [1, 2, 3],
            'y': [1, 2, 3],
            'type': 'scattergl',
            'mode': 'markers'
        }];

        Plotly.plot(gd, dat, {width: 500, height: 500})
        .then(function() {
            expect(ScatterGl.calc).toHaveBeenCalledTimes(1);

            return Plotly.restyle(gd, {'opacity': 0.1});
        })
        .then(function() {
            expect(ScatterGl.calc).toHaveBeenCalledTimes(2);
        })
        .catch(failTest)
        .then(done);
    });

    it('should update selected points', function(done) {
        // #2298
        var dat = [{
            'x': [1],
            'y': [1],
            'type': 'scattergl',
            'mode': 'markers',
            'selectedpoints': [0]
        }];

        Plotly.plot(gd, dat, {
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
                type: 'scattergl',
                mode: 'markers',
                marker: {color: 'red'}
            };

            return Plotly.addTraces(gd, trace);
        })
        .then(function() {
            var scene = gd._fullLayout._plots.xy._scene;

            expect(scene.count).toBe(2);
            expect(scene.selectBatch).toEqual([[0]]);
            expect(scene.unselectBatch).toEqual([[]]);
            expect(scene.markerOptions.length).toBe(2);
            expect(scene.markerOptions[1].color).toEqual(new Uint8Array([255, 0, 0, 255]));
            expect(scene.scatter2d.draw).toHaveBeenCalled();

            return Plotly.restyle(gd, 'selectedpoints', null);
        })
        .then(function() {
            var scene = gd._fullLayout._plots.xy._scene;
            var msg = 'clearing under dragmode select';

            expect(scene.selectBatch).toEqual([], msg);
            expect(scene.unselectBatch).toEqual([], msg);

            // scattergl uses different pathways for select/lasso & zoom/pan
            return Plotly.relayout(gd, 'dragmode', 'pan');
        })
        .then(function() {
            var scene = gd._fullLayout._plots.xy._scene;
            var msg = 'cleared under dragmode pan';

            expect(scene.selectBatch).toEqual([], msg);
            expect(scene.unselectBatch).toEqual([], msg);

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

            expect(scene.selectBatch).toBe(null, msg);
            expect(scene.unselectBatch).toBe(null, msg);
        })
        .catch(failTest)
        .then(done);
    });

    it('@flaky should remove fill2d', function(done) {
        var mock = require('@mocks/gl2d_axes_labels2.json');

        Plotly.plot(gd, mock.data, mock.layout)
        .then(delay(1000))
        .then(function() {
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 100, 80)[0]).not.toBe(0);

            return Plotly.restyle(gd, {fill: 'none'});
        })
        .then(function() {
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 100, 80)[0]).toBe(0);
        })
        .catch(failTest)
        .then(done);
    });

    it('should be able to draw more than 4096 colors', function(done) {
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
        .catch(failTest)
        .then(done);
    });

    it('should work with typed array', function(done) {
        Plotly.plot(gd, [{
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
        .catch(failTest)
        .then(done);
    });

    it('should create two WebGL contexts per graph', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/gl2d_stacked_subplots.json'));

        Plotly.plot(gd, fig).then(function() {
            var cnt = 0;
            d3.select(gd).selectAll('canvas').each(function(d) {
                if(d.regl) cnt++;
            });
            expect(cnt).toBe(2);
        })
        .catch(failTest)
        .then(done);
    });

    it('should handle transform traces properly (calcTransform case)', function(done) {
        spyOn(ScatterGl, 'calc').and.callThrough();

        Plotly.plot(gd, [{
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
        .catch(failTest)
        .then(done);
    });

    it('should handle transform traces properly (default transform case)', function(done) {
        spyOn(ScatterGl, 'calc').and.callThrough();

        Plotly.plot(gd, [{
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
        .catch(failTest)
        .then(done);
    });

    it('@gl should clear canvases on *replot* edits', function(done) {
        Plotly.plot(gd, [{
            type: 'scattergl',
            y: [1, 2, 1]
        }, {
            type: 'scattergl',
            y: [2, 1, 2]
        }])
        .then(function() {
            expect(gd._fullLayout._glcanvas).toBeDefined();
            expect(gd._fullLayout._glcanvas.size()).toBe(3);

            expect(gd._fullLayout._glcanvas.data()[0].regl).toBeDefined();
            expect(gd._fullLayout._glcanvas.data()[1].regl).toBeDefined();
            // this is canvas is for parcoords only
            expect(gd._fullLayout._glcanvas.data()[2].regl).toBeUndefined();

            spyOn(gd._fullLayout._glcanvas.data()[0].regl, 'clear').and.callThrough();
            spyOn(gd._fullLayout._glcanvas.data()[1].regl, 'clear').and.callThrough();

            return Plotly.update(gd,
                {visible: [false]},
                {'xaxis.title': 'Tsdads', 'yaxis.ditck': 0.2},
                [0]
            );
        })
        .then(function() {
            expect(gd._fullLayout._glcanvas.data()[0].regl.clear).toHaveBeenCalledTimes(1);
            expect(gd._fullLayout._glcanvas.data()[1].regl.clear).toHaveBeenCalledTimes(1);
        })
        .catch(failTest)
        .then(done);
    });
});

describe('Test scattergl autorange:', function() {
    afterEach(destroyGraphDiv);

    describe('should return the same value as SVG scatter for ~small~ data', function() {
        var specs = [
            {name: 'lines+markers', fig: require('@mocks/gl2d_10.json')},
            {name: 'bubbles', fig: require('@mocks/gl2d_12.json')},
            {name: 'line on log axes', fig: require('@mocks/gl2d_14.json')},
            {name: 'fill to zero', fig: require('@mocks/gl2d_axes_labels2.json')},
            {name: 'annotations', fig: require('@mocks/gl2d_annotations.json')}
        ];

        specs.forEach(function(s) {
            it('- case ' + s.name, function(done) {
                var gd = createGraphDiv();
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
                .catch(failTest)
                .then(done);
            });
        });
    });

    describe('should return the approximative values for ~big~ data', function() {
        beforeEach(function() {
            spyOn(ScatterGl, 'plot');
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

        it('- case scalar marker.size', function(done) {
            var gd = createGraphDiv();

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
            .catch(failTest)
            .then(done);
        });

        it('- case array marker.size', function(done) {
            var gd = createGraphDiv();

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
            .catch(failTest)
            .then(done);
        });
    });
});
