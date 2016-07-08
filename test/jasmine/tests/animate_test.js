var Plotly = require('@lib/index');
var PlotlyInternal = require('@src/plotly');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

describe('Test animate API', function() {
    'use strict';

    var gd;

    beforeEach(function(done) {
        gd = createGraphDiv();

        var mock = require('@mocks/animation');
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
