var d3 = require('d3');

var Plotly = require('@lib/index');
var Plots = require('@src/plots/plots');
var Lib = require('@src/lib');
var Drawing = require('@src/components/drawing');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');
var drag = require('../assets/drag');
var selectButton = require('../assets/modebar_button');
var delay = require('../assets/delay');
var readPixel = require('../assets/read_pixel');

function countCanvases() {
    return d3.selectAll('canvas').size();
}

describe('Test removal of gl contexts', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('Plots.cleanPlot should remove gl context from the graph div of a gl2d plot', function(done) {
        Plotly.plot(gd, [{
            type: 'scattergl',
            x: [1, 2, 3],
            y: [2, 1, 3]
        }])
        .then(function() {
            expect(gd._fullLayout._plots.xy._scene).toBeDefined();
            Plots.cleanPlot([], {}, gd._fullData, gd._fullLayout);

            expect(gd._fullLayout._plots.xy._scene).toBeUndefined();
        })
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
        .then(done);
    });
});

describe('Test gl plot side effects', function() {
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
        .then(done);
    });
});

describe('Test gl2d plots', function() {
    var gd;

    var mock = require('@mocks/gl2d_10.json');

    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 4000;
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

    it('should respond to drag interactions', function(done) {
        var _mock = Lib.extendDeep({}, mock);

        var relayoutCallback = jasmine.createSpy('relayoutCallback');

        var originalX = [-0.3037383177570093, 5.303738317757009];
        var originalY = [-0.5, 6.1];
        var newX = [-0.5, 5];
        var newY = [-1.7, 4.95];
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
        .then(delay(200))
        .then(function() {
            gd.on('plotly_relayout', relayoutCallback);
        })
        .then(function() {
            // Drag scene along the X axis
            return mouseTo([200, 200], [220, 200]);
        })
        .then(function() {
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
        .then(delay(200))
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
        .catch(fail)
        .then(done);
    });

    it('should be able to toggle visibility', function(done) {
        var _mock = Lib.extendDeep({}, mock);
        _mock.data[0].line.width = 5;

        Plotly.plot(gd, _mock)
        .then(delay(20))
        .then(function() {
            return Plotly.restyle(gd, 'visible', 'legendonly');
        })
        .then(function() {
            expect(gd.querySelector('.gl-canvas-context')).toBe(null);

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 108, 100)[0]).not.toBe(0);

            return Plotly.restyle(gd, 'visible', false);
        })
        .then(function() {
            expect(gd.querySelector('.gl-canvas-context')).toBe(null);

            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 108, 100)[0]).not.toBe(0);
        })
        .catch(fail)
        .then(done);
    });

    it('should display selection of big number of points', function(done) {
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
        .then(delay(1000))
        .then(select([[160, 100], [180, 100]]))
        .then(delay(1000))
        .then(function() {
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 168, 100)[3]).toBe(0);
            expect(readPixel(gd.querySelector('.gl-canvas-context'), 158, 100)[3]).not.toBe(0);
            expect(readPixel(gd.querySelector('.gl-canvas-focus'), 168, 100)[3]).not.toBe(0);
        })
        .catch(fail)
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
        .catch(fail)
        .then(done);
    });

    it('supports 1D and 2D Zoom', function(done) {
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
        .catch(fail)
        .then(done);
    });

    it('supports axis constraints with zoom', function(done) {
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
            expect(gd.layout.xaxis.range).toBeCloseToArray([-7.6, 23.6], 1);
            expect(gd.layout.yaxis.range).toBeCloseToArray([0.2, 15.8], 1);
        })
        .catch(fail)
        .then(done);
    });

    it('should change plot type with incomplete data', function(done) {
        Plotly.plot(gd, [{}]);
        expect(function() {
            Plotly.restyle(gd, {type: 'scattergl', x: [[1]]}, 0);
        }).not.toThrow();

        expect(function() {
            Plotly.restyle(gd, {y: [[1]]}, 0);
        }).not.toThrow();

        done();
    });

    it('data-referenced annotations should update on drag', function(done) {
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
        .catch(fail)
        .then(done);
    });
});
