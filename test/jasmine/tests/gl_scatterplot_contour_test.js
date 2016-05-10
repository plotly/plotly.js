'use strict';

var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var d3 = require('d3');

// contourgl is not part of the dist plotly.js bundle initially
Plotly.register(
    require('@lib/contourgl')
);

var withSetupTeardown = require('../assets/with_setup_teardown');

var plotData = {
    "data": [
        {
            "type": "contourgl",
            "z": [
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
            "colorscale": "Jet",
            "contours": {
                "start": 2,
                "end": 10,
                "size": 1
            },
            "uid": "ad5624",
            "zmin": 0,
            "zmax": 20
        }
    ],
    "layout": {
        "xaxis": {
            "range": [
                0,
                4
            ],
            "autorange": true
        },
        "yaxis": {
            "range": [
                0,
                4
            ],
            "autorange": true
        },
        "height": 450,
        "width": 1000,
        "autosize": true
    }
};

function transpose(a) {
    return a[0].map(function(ignore, columnIndex) {return a.map(function(row) {return row[columnIndex];});});
}

function jitter(n) {
    return n + (Math.random() - 0.5) / 2;
}

function rotate(rad, point) {
    return {
        x: point.x * Math.cos(rad) - point.y * Math.sin(rad),
        y: point.x * Math.sin(rad) + point.y * Math.cos(rad)
    }
}

function generator() {
    var x = d3.range(-12, 13, 1); // left closed, right open interval
    var y = d3.range(-12, 13, 1); // left closed, right open interval
    var i, j, p, z = new Array(x.length);
    for(i = 0; i < x.length; i++) {
        z[i] = new Array(y.length);
        for(j = 0; j < y.length; j++) {
            p = rotate(Math.PI / 4, {x: x[i], y: -y[j]})
            z[i][j]  = jitter(Math.pow(p.x, 2) / (10 * 10) + Math.pow(p.y, 2) / (4 * 4))
        }
    }
    return {x: x, y: y, z: z} // looking forward to the ES2015 return {x, y, z}
}

var model = generator();

// equivalent to the new example case in gl-contour2d
var plotDataCircular = {
    "data": [
        {
            "type": "contourgl",
            "x": model.x.map(jitter),
            "y": model.y.map(jitter),
            "z": transpose(model.z), // gl-vis is column-major order while ploly is row-major order
            "colorscale": "Jet",
            "contours": {
                "start": 0,
                "end": 2,
                "size": 0.1,
                "coloring": "lines"
            },
            "uid": "ad5624",
            "zmin": 0,
            "zmax": 2
        }
    ],
    "layout": {
        "xaxis": {
            "range": [
                -10,
                10
            ],
            "autorange": true
        },
        "yaxis": {
            "range": [
                -10,
                10
            ],
            "autorange": true
        },
        "height": 600,
        "width": 600,
        "autosize": true
    }
};


function makePlot(gd, mock) {
    return Plotly.plot(gd, mock.data, mock.layout);
}

fdescribe('contourgl plots', function() {

    // this dataset is a special case, very forgiving to the contour renderer, as it's convex,
    // contains no inflexion points etc.
    it('render without raising an error', function(done) {
        withSetupTeardown(done, function(gd) {
            return makePlot(gd, plotData);
        });
    });

    // this dataset is less forgiving because it uses a noisy surface (random, will look different on each run)
    it('render without raising an error (coloring: "lines")', function(done) {
        withSetupTeardown(done, function(gd) {
            return makePlot(gd, plotDataCircular);
        });
    });

    // same with fill
    fit('render without raising an error (coloring: "fill")', function(done) {
        var mock = Lib.extendDeep({}, plotDataCircular);
        mock.data[0].contours.coloring = "fill"; // or delete property - fill is the default
        withSetupTeardown(done, function(gd) {
            return makePlot(gd, mock);
        });
    });

});
