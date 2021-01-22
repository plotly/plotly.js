'use strict';

var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var d3Select = require('../../strict-d3').select;

// Test utilities
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var delay = require('../assets/delay');
var mouseEvent = require('../assets/mouse_event');
var readPixel = require('../assets/read_pixel');

var multipleScatter2dMock = require('@mocks/gl2d_scatter2d-multiple-colors.json');

var plotData = {
    'data': [
        {
            'type': 'pointcloud',
            'mode': 'markers',
            'marker': {
                'sizemin': 0.5,
                'sizemax': 100,
                'arearatio': 0,
                'color': 'rgba(255, 0, 0, 0.6)'
            },
            'x': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            'y': [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
        },
        {
            'type': 'pointcloud',
            'mode': 'markers',
            'marker': {
                'sizemin': 0.5,
                'sizemax': 100,
                'arearatio': 0,
                'color': 'rgba(0, 0, 255, 0.9)',
                'opacity': 0.8,
                'blend': true
            },
            'opacity': 0.7,
            'x': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
            'y': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        },
        {
            'type': 'pointcloud',
            'mode': 'markers',
            'marker': {
                'sizemin': 0.5,
                'sizemax': 100,
                'border': {
                    'color': 'rgb(0, 0, 0)',
                    'arearatio': 0.7071
                },
                'color': 'green',
                'opacity': 0.8,
                'blend': true
            },
            'opacity': 0.7,
            'x': [3, 4.5, 6],
            'y': [9, 9, 9]
        },
        {
            'type': 'pointcloud',
            'mode': 'markers',
            'marker': {
                'sizemin': 0.5,
                'sizemax': 100,
                'color': 'yellow',
                'opacity': 0.8,
                'blend': true
            },
            'opacity': 0.7,
            'xy': new Float32Array([1, 3, 9, 3]),
            'indices': new Int32Array([0, 1]),
            'xbounds': [1, 9],
            'ybounds': [3, 3]
        },
        {
            'type': 'pointcloud',
            'mode': 'markers',
            'marker': {
                'sizemin': 0.5,
                'sizemax': 100,
                'color': 'orange',
                'opacity': 0.8,
                'blend': true
            },
            'opacity': 0.7,
            'xy': new Float32Array([1, 4, 9, 4]),
            'indices': new Int32Array([0, 1])
        },
        {
            'type': 'pointcloud',
            'mode': 'markers',
            'marker': {
                'sizemin': 0.5,
                'sizemax': 100,
                'color': 'darkorange',
                'opacity': 0.8,
                'blend': true
            },
            'opacity': 0.7,
            'xy': new Float32Array([1, 5, 9, 5]),
            'xbounds': [1, 9],
            'ybounds': [5, 5]
        },
        {
            'type': 'pointcloud',
            'mode': 'markers',
            'marker': {
                'sizemin': 0.5,
                'sizemax': 100,
                'color': 'red',
                'opacity': 0.8,
                'blend': true
            },
            'opacity': 0.7,
            'xy': new Float32Array([1, 6, 9, 6])
        }
    ],
    'layout': {
        'title': 'Point Cloud - basic',
        'xaxis': {
            'type': 'linear',
            'range': [
                -2.501411175139456,
                43.340777299865266
            ],
            'autorange': true
        },
        'yaxis': {
            'type': 'linear',
            'range': [
                4,
                6
            ],
            'autorange': true
        },
        'height': 598,
        'width': 1080,
        'autosize': true,
        'showlegend': false
    }
};

describe('pointcloud traces', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('@gl renders without raising an error', function(done) {
        Plotly.newPlot(gd, Lib.extendDeep({}, plotData))
        .then(done, done.fail);
    });

    it('@gl should update properly', function(done) {
        var scene2d;

        Plotly.newPlot(gd, Lib.extendDeep({}, plotData))
        .then(function() {
            scene2d = gd._fullLayout._plots.xy._scene2d;
            expect(scene2d.traces[gd._fullData[0].uid].type).toBe('pointcloud');

            return Plotly.relayout(gd, 'xaxis.range', [3, 6]);
        }).then(function() {
            expect(scene2d.xaxis.range).toEqual([3, 6]);
            expect(scene2d.yaxis.range).toBeCloseToArray([-1.415, 10.415], 2);
            return Plotly.relayout(gd, 'xaxis.autorange', true);
        }).then(function() {
            expect(scene2d.xaxis.range).toBeCloseToArray([-0.548, 9.548], 2);
            expect(scene2d.yaxis.range).toBeCloseToArray([-1.415, 10.415], 2);
            return Plotly.relayout(gd, 'yaxis.range', [8, 20]);
        }).then(function() {
            expect(scene2d.xaxis.range).toBeCloseToArray([-0.548, 9.548], 2);
            expect(scene2d.yaxis.range).toEqual([8, 20]);
            return Plotly.relayout(gd, 'yaxis.autorange', true);
        }).then(function() {
            expect(scene2d.xaxis.range).toBeCloseToArray([-0.548, 9.548], 2);
            expect(scene2d.yaxis.range).toBeCloseToArray([-1.415, 10.415], 2);
        })
        .then(done, done.fail);
    });

    it('@gl should not change other traces colors', function(done) {
        var _mock = Lib.extendDeep({}, multipleScatter2dMock);
        Plotly.newPlot(gd, _mock)
        .then(delay(20))
        .then(function() {
            var canvas = d3Select('.gl-canvas-context').node();

            var RGBA = readPixel(canvas, canvas.width / 2 - 1, canvas.height / 2 - 1, 1, 1);

            expect(RGBA[0] === 255).toBe(true, 'be red');
            expect(RGBA[1] === 0).toBe(true, 'no green');
            expect(RGBA[2] === 0).toBe(true, 'no blue');
            expect(RGBA[3] === 255).toBe(true, 'no transparent');
        })
        .then(done, done.fail);
    });

    it('@gl should respond to drag', function(done) {
        function _drag(p0, p1) {
            mouseEvent('mousemove', p0[0], p0[1], {buttons: 1});
            mouseEvent('mousedown', p0[0], p0[1], {buttons: 1});
            mouseEvent('mousemove', (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, {buttons: 1});
            mouseEvent('mousemove', p1[0], p1[1], {buttons: 0});
            mouseEvent('mouseup', p1[0], p1[1], {buttons: 0});
        }

        function _assertRange(msg, xrng, yrng) {
            expect(gd._fullLayout.xaxis.range).toBeCloseToArray(xrng, 2, msg);
            expect(gd._fullLayout.yaxis.range).toBeCloseToArray(yrng, 2, msg);
        }

        Plotly.newPlot(gd, Lib.extendDeep({}, plotData))
        .then(delay(20))
        .then(function() {
            _assertRange('base', [-0.548, 9.548], [-1.415, 10.415]);
        })
        .then(delay(20))
        .then(function() { _drag([200, 200], [350, 350]); })
        .then(delay(20))
        .then(function() {
            _assertRange('after zoombox drag', [0.768, 1.591], [5.462, 7.584]);
        })
        .then(function() {
            return Plotly.relayout(gd, {
                'xaxis.autorange': true,
                'yaxis.autorange': true
            });
        })
        .then(function() {
            _assertRange('back to base', [-0.548, 9.548], [-1.415, 10.415]);
        })
        .then(function() {
            return Plotly.relayout(gd, 'dragmode', 'pan');
        })
        .then(delay(20))
        .then(function() { _drag([200, 200], [350, 350]); })
        .then(delay(20))
        .then(function() {
            _assertRange('after pan drag', [0.2743, 10.3719], [-3.537, 8.292]);
        })
        .then(done, done.fail);
    });
});
