'use strict';

var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var d3 = require('d3');

// contourgl is not part of the dist plotly.js bundle initially
Plotly.register([
    require('@lib/contourgl')
]);

// Test utilities
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

var plotData = {
    'data': [
        {
            'type': 'contourgl',
            'z': [
                [
                    10,
                    10.625,
                    12.5,
                    15.625,
                    20
                ],
                [
                    5.625,
                    6.25,
                    8.125,
                    11.25,
                    15.625
                ],
                [
                    2.5,
                    3.125,
                    5,
                    8.125,
                    12.5
                ],
                [
                    0.625,
                    1.25,
                    3.125,
                    6.25,
                    10.625
                ],
                [
                    0,
                    0.625,
                    2.5,
                    5.625,
                    10
                ]
            ],
            'colorscale': 'Jet',
            'contours': {
                'start': 2,
                'end': 10,
                'size': 1
            },
            'uid': 'ad5624',
            'zmin': 0,
            'zmax': 20
        }
    ],
    'layout': {
        'xaxis': {
            'range': [
                0,
                4
            ],
            'autorange': true
        },
        'yaxis': {
            'range': [
                0,
                4
            ],
            'autorange': true
        },
        'height': 450,
        'width': 1000,
        'autosize': true
    }
};

function transpose(a) {
    return a[0].map(function(ignore, columnIndex) {return a.map(function(row) {return row[columnIndex];});});
}

function jitter(maxJitterRatio, n) {
    return n * (1 + maxJitterRatio * (2 * Math.random() - 1));
}

function rotate(rad, point) {
    return {
        x: point.x * Math.cos(rad) - point.y * Math.sin(rad),
        y: point.x * Math.sin(rad) + point.y * Math.cos(rad)
    };
}

function generate(maxJitter) {
    var x = d3.range(-1, 1.5, 0.5); // left closed, right open interval
    var y = d3.range(-1, 1.5, 0.5); // left closed, right open interval
    var i, j, p, z = new Array(x.length);
    for(i = 0; i < x.length; i++) {
        z[i] = new Array(y.length);
        for(j = 0; j < y.length; j++) {
            p = rotate(Math.PI / 4, {x: x[i], y: -y[j]});
            z[i][j] = jitter(maxJitter, Math.pow(p.x, 2) + Math.pow(p.y, 2));
        }
    }
    return {x: x, y: y, z: z}; // looking forward to the ES2015 return {x, y, z}
}

// equivalent to the new example case in gl-contour2d
var plotDataElliptical = function(maxJitter) {
    var model = generate(maxJitter);
    return {
        'data': [
            {
                'type': 'contourgl',
                'x': model.x,
                'y': model.y,
                'z': transpose(model.z), // gl-vis is column-major order while ploly is row-major order
                'colorscale': 'Jet',
                'contours': {
                    'start': 0,
                    'end': 2,
                    'size': 0.1,
                    'coloring': 'fill'
                },
                'uid': 'ad5624',
                'zmin': 0,
                'zmax': 2
            }
        ],
        'layout': {
            'xaxis': {
                'range': [
                    -10,
                    10
                ],
                'autorange': true
            },
            'yaxis': {
                'range': [
                    -10,
                    10
                ],
                'autorange': true
            },
            'height': 600,
            'width': 600,
            'autosize': true
        }
    };
};


function makePlot(gd, mock, done) {
    return Plotly.plot(gd, mock.data, mock.layout)
        .then(null, failTest)
        .then(done);
}

describe('contourgl plots', function() {

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    // this first dataset is a special case, very forgiving to the contour renderer, as it's convex,
    // contains no inflexion points etc.
    it('render without raising an error', function(done) {
        makePlot(gd, plotData, done);
    });

    it('render without raising an error', function(done) {
        var mock = require('@mocks/simple_contour.json'),
            mockCopy = Lib.extendDeep({}, mock);

        mockCopy.data[0].type = 'contourgl';
        mockCopy.data[0].contours = { coloring: 'fill' };

        makePlot(gd, mockCopy, done);
    });

    it('render without raising an error (coloring: "lines")', function(done) {
        var mock = Lib.extendDeep({}, plotDataElliptical(0));
        mock.data[0].contours.coloring = 'lines'; // 'fill' is the default
        makePlot(gd, mock, done);
    });

    it('render smooth, regular ellipses without raising an error (coloring: "fill")', function(done) {
        var mock = plotDataElliptical(0);
        makePlot(gd, mock, done);
    });

    it('render ellipses with added noise without raising an error (coloring: "fill")', function(done) {
        var mock = plotDataElliptical(0.5);
        mock.data[0].contours.coloring = 'fill'; // 'fill' is the default
        mock.data[0].line = {smoothing: 0};
        makePlot(gd, mock, done);
    });

    it('should update properly', function(done) {
        var mock = plotDataElliptical(0);
        var scene2d;

        Plotly.plot(gd, mock.data, mock.layout).then(function() {
            scene2d = gd._fullLayout._plots.xy._scene2d;

            expect(scene2d.traces[mock.data[0].uid].type).toEqual('contourgl');
            expect(scene2d.xaxis._min).toEqual([{ val: -1, pad: 0}]);
            expect(scene2d.xaxis._max).toEqual([{ val: 1, pad: 0}]);

            return Plotly.relayout(gd, 'xaxis.range', [0, -10]);
        }).then(function() {
            expect(scene2d.xaxis._min).toEqual([]);
            expect(scene2d.xaxis._max).toEqual([]);

            return Plotly.relayout(gd, 'xaxis.autorange', true);
        }).then(function() {
            expect(scene2d.xaxis._min).toEqual([{ val: -1, pad: 0}]);
            expect(scene2d.xaxis._max).toEqual([{ val: 1, pad: 0}]);

            return Plotly.restyle(gd, 'type', 'heatmapgl');
        }).then(function() {
            expect(scene2d.traces[mock.data[0].uid].type).toEqual('heatmapgl');
            expect(scene2d.xaxis._min).toEqual([{ val: -1, pad: 0}]);
            expect(scene2d.xaxis._max).toEqual([{ val: 1, pad: 0}]);

            return Plotly.relayout(gd, 'xaxis.range', [0, -10]);
        }).then(function() {
            expect(scene2d.xaxis._min).toEqual([]);
            expect(scene2d.xaxis._max).toEqual([]);

            return Plotly.relayout(gd, 'xaxis.autorange', true);
        }).then(function() {
            expect(scene2d.xaxis._min).toEqual([{ val: -1, pad: 0}]);
            expect(scene2d.xaxis._max).toEqual([{ val: 1, pad: 0}]);

            done();
        });
    });
});
