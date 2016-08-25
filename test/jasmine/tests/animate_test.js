var Plotly = require('@lib/index');
var PlotlyInternal = require('@src/plotly');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

var mock = require('@mocks/animation');

describe('Test animate API', function() {
    'use strict';

    var gd, mockCopy;

    function verifyQueueEmpty(gd) {
        expect(gd._transitionData._frameQueue.length).toEqual(0);
    }

    function verifyFrameTransitionOrder(gd, expectedFrames) {
        var calls = PlotlyInternal.transition.calls;

        expect(calls.count()).toEqual(expectedFrames.length);

        for(var i = 0; i < calls.count(); i++) {
            expect(calls.argsFor(i)[1]).toEqual(
                gd._transitionData._frameHash[expectedFrames[i]].data
            );
        }
    }

    beforeEach(function(done) {
        gd = createGraphDiv();

        mockCopy = Lib.extendDeep({}, mock);

        spyOn(PlotlyInternal, 'transition').and.callFake(function() {
            // Just a fake; invoke the callback after a bit of time:
            if(arguments[5]) setTimeout(arguments[5], 50);

            return Promise.resolve();
        });

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
            Plotly.addFrames(gd, mockCopy.frames);
        }).then(done);
    });

    afterEach(function() {
        destroyGraphDiv();
    });

    it('animates to a frame', function(done) {
        Plotly.animate(gd, ['frame0']).then(function() {
            expect(PlotlyInternal.transition).toHaveBeenCalled();

            var args = PlotlyInternal.transition.calls.mostRecent().args;

            // was called with gd, data, layout, traceIndices, transitionConfig:
            expect(args.length).toEqual(6);

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

    it('rejects if a frame is not found', function(done) {
        Plotly.animate(gd, ['foobar']).then(fail).then(done, done);
    });

    it('animates to a single frame', function(done) {
        gd.on('plotly_animated', function() {
            expect(PlotlyInternal.transition.calls.count()).toEqual(1);
            verifyQueueEmpty(gd);
            done();
        });

        Plotly.animate(gd, ['frame0']);
    });

    it('animates to a single frame', function(done) {
        gd.on('plotly_animated', function() {
            expect(PlotlyInternal.transition.calls.count()).toEqual(2);
            verifyQueueEmpty(gd);
            done();
        });

        Plotly.animate(gd, ['frame0', 'frame1']);
    });

    it('animates frames by group', function(done) {
        gd.on('plotly_animated', function() {
            expect(PlotlyInternal.transition.calls.count()).toEqual(2);
            verifyQueueEmpty(gd);
            done();
        });

        Plotly.animate(gd, 'even-frames');
    });

    it('animates groups in the correct order', function(done) {
        gd.on('plotly_animated', function() {
            verifyFrameTransitionOrder(gd, ['frame0', 'frame2', 'frame1', 'frame3']);
            verifyQueueEmpty(gd);
            done();
        });

        Plotly.animate(gd, 'even-frames');
        Plotly.animate(gd, 'odd-frames');
    });

    it('animates frames in the correct order', function(done) {
        gd.on('plotly_animated', function() {
            verifyFrameTransitionOrder(gd, ['frame0', 'frame2', 'frame1', 'frame3']);
            verifyQueueEmpty(gd);
            done();
        });

        Plotly.animate(gd, ['frame0', 'frame2', 'frame1', 'frame3']);
    });

    it('animates frames and groups in sequence', function(done) {
        gd.on('plotly_animated', function() {
            verifyFrameTransitionOrder(gd, ['frame0', 'frame2', 'frame0', 'frame2', 'frame1', 'frame3']);
            verifyQueueEmpty(gd);
            done();
        });

        Plotly.animate(gd, 'even-frames');
        Plotly.animate(gd, ['frame0', 'frame2', 'frame1', 'frame3']);
    });

    it('queues successive animations', function(done) {
        var starts = 0;
        var ends = 0;

        // make sure we don't ignore accidental double-ends:
        function checkEndCount() {
            expect(ends).toEqual(1);
            verifyQueueEmpty(gd);
            done();
        }

        gd.on('plotly_animating', function() {
            starts++;
        }).on('plotly_animated', function() {
            ends++;
            expect(PlotlyInternal.transition.calls.count()).toEqual(4);
            expect(starts).toEqual(1);
            setTimeout(checkEndCount, 10);
        });

        Plotly.animate(gd, 'even-frames');
        Plotly.animate(gd, 'odd-frames');
    });
});
