'use strict';

var Plotly = require('@lib/index');

// Test utilities
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

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

function makePlot(gd, mock, done) {
    return Plotly.plot(gd, mock.data, mock.layout)
        .then(null, failTest)
        .then(done);
}

describe('@gl pointcloud traces', function() {

    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(function() {
        Plotly.purge(gd);
        destroyGraphDiv();
    });

    it('render without raising an error', function(done) {
        makePlot(gd, plotData, done);
    });

    it('should update properly', function(done) {
        var mock = plotData;
        var scene2d;

        var xBaselineMins = [{val: 0, pad: 50, extrapad: false}];
        var xBaselineMaxes = [{val: 9, pad: 50, extrapad: false}];

        var yBaselineMins = [{val: 0, pad: 50, extrapad: false}];
        var yBaselineMaxes = [{val: 9, pad: 50, extrapad: false}];

        Plotly.plot(gd, mock.data, mock.layout).then(function() {
            scene2d = gd._fullLayout._plots.xy._scene2d;

            expect(scene2d.traces[mock.data[0].uid].type).toEqual('pointcloud');

            expect(scene2d.xaxis._min).toEqual(xBaselineMins);
            expect(scene2d.xaxis._max).toEqual(xBaselineMaxes);

            expect(scene2d.yaxis._min).toEqual(yBaselineMins);
            expect(scene2d.yaxis._max).toEqual(yBaselineMaxes);

            return Plotly.relayout(gd, 'xaxis.range', [3, 6]);
        }).then(function() {

            expect(scene2d.xaxis._min).toEqual([]);
            expect(scene2d.xaxis._max).toEqual([]);

            return Plotly.relayout(gd, 'xaxis.autorange', true);
        }).then(function() {

            expect(scene2d.xaxis._min).toEqual(xBaselineMins);
            expect(scene2d.xaxis._max).toEqual(xBaselineMaxes);

            return Plotly.relayout(gd, 'yaxis.range', [8, 20]);
        }).then(function() {

            expect(scene2d.yaxis._min).toEqual([]);
            expect(scene2d.yaxis._max).toEqual([]);

            return Plotly.relayout(gd, 'yaxis.autorange', true);
        }).then(function() {
            expect(scene2d.yaxis._min).toEqual(yBaselineMins);
            expect(scene2d.yaxis._max).toEqual(yBaselineMaxes);

            done();
        });
    });
});
