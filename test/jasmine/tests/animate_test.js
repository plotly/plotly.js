var Plotly = require('@lib/index');
var PlotlyInternal = require('@src/plotly');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

var mock = {
    'data': [
        {
            'x': [0, 1, 2],
            'y': [0, 2, 8],
            'type': 'scatter'
        },
        {
            'x': [0, 1, 2],
            'y': [4, 2, 3],
            'type': 'scatter'
        }
    ],
    'layout': {
        'title': 'Animation test',
        'showlegend': true,
        'autosize': false,
        'xaxis': {
            'range': [0, 2],
            'domain': [0, 1]
        },
        'yaxis': {
            'range': [0, 10],
            'domain': [0, 1]
        }
    },
    'frames': [{
        'name': 'base',
        'data': [
            {'y': [0, 2, 8]},
            {'y': [4, 2, 3]}
        ],
        'layout': {
            'xaxis': {
                'range': [0, 2]
            },
            'yaxis': {
                'range': [0, 10]
            }
        }
    }, {
        'name': 'frame0',
        'data': [
            {'y': [0.5, 1.5, 7.5]},
            {'y': [4.25, 2.25, 3.05]}
        ],
        'baseFrame': 'base',
        'traceIndices': [0, 1],
        'layout': { }
    }, {
        'name': 'frame1',
        'data': [
            {'y': [2.1, 1, 7]},
            {'y': [4.5, 2.5, 3.1]}
        ],
        'baseFrame': 'base',
        'traceIndices': [0, 1],
        'layout': { }
    }, {
        'name': 'frame2',
        'data': [
            {'y': [3.5, 0.5, 6]},
            {'y': [5.7, 2.7, 3.9]}
        ],
        'baseFrame': 'base',
        'traceIndices': [0, 1],
        'layout': { }
    }, {
        'name': 'frame3',
        'data': [
            {'y': [5.1, 0.25, 5]},
            {'y': [7, 2.9, 6]}
        ],
        'baseFrame': 'base',
        'traceIndices': [0, 1],
        'layout': {
            'xaxis': {
                'range': [-1, 4]
            },
            'yaxis': {
                'range': [-5, 15]
            }
        }
    }]
};

describe('Test animate API', function() {
    'use strict';

    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        //var mock = require('@mocks/animation');
        var mockCopy = Lib.extendDeep({}, mock);

        spyOn(PlotlyInternal, 'transition').and.callFake(function() {
            return Promise.resolve();
        });

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            Plotly.addFrames(gd, mockCopy.frames);
        }).then(done);
    });

    afterEach(function() {
        destroyGraphDiv();
    });

    it('rejects if the frame is not found', function(done) {
        Plotly.animate(gd, 'foobar').then(fail).then(done, done);
    });

    it('animates to a frame', function(done) {
        Plotly.animate(gd, 'frame0').then(function() {
            expect(PlotlyInternal.transition).toHaveBeenCalled();

            var args = PlotlyInternal.transition.calls.mostRecent().args;

            // was called with gd, data, layout, traceIndices, transitionConfig:
            expect(args.length).toEqual(5);

            // data has two traces:
            expect(args[1].length).toEqual(2);

            // layout
            expect(args[2]).toEqual({
                xaxis: {range: [0, 2]},
                yaxis: {range: [0, 10]}
            });

            // traces are [0, 1]:
            expect(args[3]).toEqual([0, 1]);
        }).catch(fail).then(done);
    });
});
