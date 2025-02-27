var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;

var Plotly = require('../../../lib/index');
var Plots = require('../../../src/plots/plots');
var Lib = require('../../../src/lib');
var Drawing = require('../../../src/components/drawing');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var touchEvent = require('../assets/touch_event');
var drag = require('../assets/drag');
var selectButton = require('../assets/modebar_button');
var delay = require('../assets/delay');

function countCanvases() {
    return d3SelectAll('canvas').size();
}

describe('Test removal of gl contexts', function() {
    var gd;

    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl Plots.cleanPlot should remove gl context from the graph div of a gl2d plot', function(done) {
        Plotly.newPlot(gd, [{
            type: 'scattergl',
            x: [1, 2, 3],
            y: [2, 1, 3]
        }])
        .then(function() {
            expect(gd._fullLayout._plots.xy._scene).toBeDefined();
            Plots.cleanPlot([], {}, gd._fullData, gd._fullLayout);

            expect(!!gd._fullLayout._plots.xy._scene).toBe(false);
        })
        .then(done, done.fail);
    });

    it('@gl Plotly.newPlot should remove gl context from the graph div of a gl2d plot', function(done) {
        var firstGlplotObject, firstGlContext, firstCanvas;

        Plotly.newPlot(gd, [{
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
        .then(done, done.fail);
    });
});

describe('Test gl plot side effects', function() {
    var gd;

    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        gd = createGraphDiv();
    });

    afterEach(function(done) {
        Plotly.purge(gd);
        destroyGraphDiv();
        setTimeout(done, 1000);
    });

    it('@gl should not draw the rangeslider', function(done) {
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

        Plotly.newPlot(gd, data, layout).then(function() {
            var rangeSlider = document.getElementsByClassName('range-slider')[0];
            expect(rangeSlider).not.toBeDefined();
        })
        .then(done, done.fail);
    });

    it('@gl should be able to replot from a blank graph', function(done) {
        function countCanvases(cnt) {
            var nodes = d3SelectAll('canvas');
            expect(nodes.size()).toEqual(cnt);
        }

        var data = [{
            type: 'scattergl',
            x: [1, 2, 3],
            y: [2, 1, 2]
        }];

        Plotly.newPlot(gd, [])
        .then(function() {
            countCanvases(0);

            return Plotly.newPlot(gd, data);
        })
        .then(function() {
            countCanvases(3);

            return Plotly.purge(gd);
        })
        .then(function() {
            countCanvases(0);

            return Plotly.newPlot(gd, data);
        })
        .then(function() {
            countCanvases(3);

            return Plotly.deleteTraces(gd, [0]);
        })
        .then(function() {
            countCanvases(0);

            return Plotly.purge(gd);
        })
        .then(done, done.fail);
    });

    it('@gl should be able to switch trace type', function(done) {
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
            expect(d3SelectAll('canvas').size()).toEqual(3);

            return Plotly.restyle(gd, 'type', 'scatter');
        })
        .then(function() {
            expect(d3SelectAll('canvas').size()).toEqual(0);
        })
        .then(done, done.fail);
    });

    it('@gl should be able to resize canvas properly', function(done) {
        var _mock = Lib.extendDeep({}, require('../../image/mocks/gl2d_10.json'));
        _mock.data[0].line.width = 5;

        _mock.layout.width = 600;

        Plotly.newPlot(gd, _mock)
        .then(function() {
            expect(gd.querySelector('.gl-canvas-context').width).toBe(1200);

            return Plotly.relayout(gd, {width: 300});
        })
        .then(function() {
            expect(gd.querySelector('.gl-canvas-context').width).toBe(600);
        })
        .then(done, done.fail);
    });

    it('@gl should fire *plotly_webglcontextlost* when on webgl context lost', function(done) {
        var _mock = Lib.extendDeep({}, require('../../image/mocks/gl2d_12.json'));

        function _trigger(name) {
            var ev = new window.WebGLContextEvent('webglcontextlost');
            var canvas = gd.querySelector('.gl-canvas-' + name);
            canvas.dispatchEvent(ev);
        }

        Plotly.newPlot(gd, _mock).then(function() {
            return new Promise(function(resolve, reject) {
                gd.once('plotly_webglcontextlost', resolve);
                setTimeout(reject, 10);
                _trigger('context');
            });
        })
        .then(function(eventData) {
            expect((eventData || {}).event).toBeDefined();
            expect((eventData || {}).layer).toBe('contextLayer');
        })
        .then(function() {
            return new Promise(function(resolve, reject) {
                gd.once('plotly_webglcontextlost', resolve);
                setTimeout(reject, 10);
                _trigger('focus');
            });
        })
        .then(function(eventData) {
            expect((eventData || {}).event).toBeDefined();
            expect((eventData || {}).layer).toBe('focusLayer');
        })
        .then(function() {
            return new Promise(function(resolve, reject) {
                gd.once('plotly_webglcontextlost', reject);
                setTimeout(resolve, 10);
                _trigger('pick');
            });
        })
        .then(function(eventData) {
            // should add event listener on pick canvas which
            // isn't used for scattergl traces
            expect(eventData).toBeUndefined();
        })
        .then(done, done.fail);
    });

    it('@gl should not clear context when dimensions are not integers', function(done) {
        var w = 500.25;
        var h = 400.25;
        var w0 = Math.floor(w);
        var h0 = Math.floor(h);

        function assertDims(msg) {
            var fullLayout = gd._fullLayout;
            expect(fullLayout.width).toBe(w, msg);
            expect(fullLayout.height).toBe(h, msg);

            var canvas = fullLayout._glcanvas;
            expect(canvas.node().width).toBe(w0 * 2, msg);
            expect(canvas.node().height).toBe(h0 * 2, msg);

            var gl = canvas.data()[0].regl._gl;
            expect(gl.drawingBufferWidth).toBe(w0 * 2, msg);
            expect(gl.drawingBufferHeight).toBe(h0 * 2, msg);
        }

        Plotly.newPlot(gd, [{
            type: 'scattergl',
            mode: 'lines',
            y: [1, 2, 1]
        }])
        .then(function() {
            spyOn(Plots, 'cleanPlot').and.callThrough();
            spyOn(Lib, 'log').and.callThrough();

            return Plotly.relayout(gd, {
                width: w,
                height: h
            });
        })
        .then(function() {
            assertDims('base state');

            // once from supplyDefaults
            expect(Plots.cleanPlot).toHaveBeenCalledTimes(1);
            expect(Lib.log).toHaveBeenCalledTimes(0);

            return Plotly.restyle(gd, 'mode', 'markers');
        })
        .then(function() {
            assertDims('after restyle');

            // one more supplyDefaults
            expect(Plots.cleanPlot).toHaveBeenCalledTimes(2);
            expect(Lib.log).toHaveBeenCalledTimes(0);
        })
        .then(done, done.fail);
    });

    it('@gl should be able to toggle from svg to gl', function(done) {
        Plotly.newPlot(gd, [{
            y: [1, 2, 1],
        }])
        .then(function() {
            expect(countCanvases()).toBe(0);
            expect(d3SelectAll('.scatterlayer > .trace').size()).toBe(1);

            return Plotly.restyle(gd, 'type', 'scattergl');
        })
        .then(function() {
            expect(countCanvases()).toBe(3);
            expect(d3SelectAll('.scatterlayer > .trace').size()).toBe(0);

            return Plotly.restyle(gd, 'type', 'scatter');
        })
        .then(function() {
            expect(countCanvases()).toBe(0);
            expect(d3SelectAll('.scatterlayer > .trace').size()).toBe(1);
        })
        .then(done, done.fail);
    });

    it('@gl should create two WebGL contexts per graph', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/gl2d_stacked_subplots.json'));

        Plotly.newPlot(gd, fig).then(function() {
            var cnt = 0;
            d3Select(gd).selectAll('canvas').each(function(d) {
                if(d.regl) cnt++;
            });
            expect(cnt).toBe(2);
        })
        .then(done, done.fail);
    });

    it('@gl should clear canvases on *replot* edits', function(done) {
        Plotly.newPlot(gd, [{
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
        .then(done, done.fail);
    });
});

describe('Test gl2d plot interactions:', function() {
    var gd;
    var mock = require('../../image/mocks/gl2d_10.json');

    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        gd = createGraphDiv();
    });

    afterEach(function(done) {
        Plotly.purge(gd);
        destroyGraphDiv();
        setTimeout(done, 1000);
    });

    function mouseTo(p0, p1) {
        var node = d3Select('.nsewdrag[data-subplot="xy"]').node();
        var dx = p1[0] - p0[0];
        var dy = p1[1] - p0[1];
        return drag({node: node, dpos: [dx, dy], pos0: p0});
    }

    it('@gl should respond to drag interactions', function(done) {
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
        .then(done, done.fail);
    });

    it('@gl supports 1D and 2D Zoom', function(done) {
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
        .then(done, done.fail);
    });

    it('@gl supports axis constraints with zoom', function(done) {
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
        .then(done, done.fail);
    });

    it('@gl data-referenced annotations should update on drag', function(done) {
        function assertAnnotation(xy) {
            var ann = d3Select('g.annotation-text-g').select('g');
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
        .then(done, done.fail);
    });

    it('@gl should not scroll document while panning', function(done) {
        var mock = {
            data: [
                { type: 'scattergl', y: [1, 2, 3], x: [1, 2, 3] }
            ],
            layout: {
                width: 500,
                height: 500
            }
        };

        var sceneTarget;
        var relayoutCallback = jasmine.createSpy('relayoutCallback');

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

        Plotly.newPlot(gd, mock)
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
        .then(done, done.fail);
    });
});
