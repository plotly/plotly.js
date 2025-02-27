var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var computeFrame = require('../../../src/plots/plots').computeFrame;

function clone(obj) {
    return Lib.extendDeep({}, obj);
}

describe('Test mergeFrames', function() {
    'use strict';

    var gd, mock;

    beforeEach(function(done) {
        mock = [{x: [1, 2, 3], y: [2, 1, 3]}, {x: [1, 2, 3], y: [6, 4, 5]}];
        gd = createGraphDiv();
        Plotly.newPlot(gd, mock).then(done);
    });

    afterEach(destroyGraphDiv);

    describe('computing a single frame', function() {
        var frame1, input;

        beforeEach(function(done) {
            frame1 = {
                name: 'frame1',
                data: [{
                    x: [1, 2, 3],
                    'marker.size': 8,
                    marker: {color: 'red'}
                }]
            };

            input = clone(frame1);
            Plotly.addFrames(gd, [input]).then(done);
        });

        it('returns false if the frame does not exist', function() {
            expect(computeFrame(gd, 'frame8')).toBe(false);
        });

        it('returns a new object', function() {
            var result = computeFrame(gd, 'frame1');
            expect(result).not.toBe(input);
        });

        it('copies objects', function() {
            var result = computeFrame(gd, 'frame1');
            expect(result.data).not.toBe(input.data);
            expect(result.data[0].marker).not.toBe(input.data[0].marker);
        });

        it('does NOT copy arrays', function() {
            var result = computeFrame(gd, 'frame1');
            expect(result.data[0].x).toBe(input.data[0].x);
        });

        it('computes a single frame', function() {
            var computed = computeFrame(gd, 'frame1');
            var expected = {data: [{x: [1, 2, 3], marker: {size: 8, color: 'red'}}], traces: [0]};
            expect(computed).toEqual(expected);
        });

        it('leaves the frame unaffected', function() {
            computeFrame(gd, 'frame1');
            expect(gd._transitionData._frameHash.frame1).toEqual(frame1);
        });
    });

    describe('circularly defined frames', function() {
        var frames, results;

        beforeEach(function(done) {
            frames = [
                {name: 'frame0', baseframe: 'frame1', data: [{'marker.size': 0}]},
                {name: 'frame1', baseframe: 'frame2', data: [{'marker.size': 1}]},
                {name: 'frame2', baseframe: 'frame0', data: [{'marker.size': 2}]}
            ];

            results = [
                {traces: [0], data: [{marker: {size: 0}}]},
                {traces: [0], data: [{marker: {size: 1}}]},
                {traces: [0], data: [{marker: {size: 2}}]}
            ];

            Plotly.addFrames(gd, frames).then(done);
        });

        function doTest(i) {
            it('avoid infinite recursion (starting point = ' + i + ')', function() {
                var result = computeFrame(gd, 'frame' + i);
                expect(result).toEqual(results[i]);
            });
        }

        for(var ii = 0; ii < 3; ii++) {
            doTest(ii);
        }
    });

    describe('computing trace data', function() {
        var frames;

        beforeEach(function() {
            frames = [{
                name: 'frame0',
                data: [{'marker.size': 0}],
                traces: [2]
            }, {
                name: 'frame1',
                data: [{'marker.size': 1}],
                traces: [8]
            }, {
                name: 'frame2',
                data: [{'marker.size': 2}],
                traces: [2]
            }, {
                name: 'frame3',
                data: [{'marker.size': 3}, {'marker.size': 4}],
                traces: [2, 8]
            }, {
                name: 'frame4',
                data: [
                    {'marker.size': 5},
                    {'marker.size': 6},
                    {'marker.size': 7}
                ]
            }];
        });

        it('merges orthogonal traces', function() {
            frames[0].baseframe = frames[1].name;

            // This technically returns a promise, but it's not actually asynchronous so
            // that we'll just keep this synchronous:
            Plotly.addFrames(gd, frames.map(clone));

            expect(computeFrame(gd, 'frame0')).toEqual({
                traces: [8, 2],
                data: [
                    {marker: {size: 1}},
                    {marker: {size: 0}}
                ]
            });

            // Verify that the frames are untouched (by value, at least, but they should
            // also be unmodified by identity too) by the computation:
            expect(gd._transitionData._frames).toEqual(frames);
        });

        it('merges overlapping traces', function() {
            frames[0].baseframe = frames[2].name;

            Plotly.addFrames(gd, frames.map(clone));

            expect(computeFrame(gd, 'frame0')).toEqual({
                traces: [2],
                data: [{marker: {size: 0}}]
            });

            expect(gd._transitionData._frames).toEqual(frames);
        });

        it('merges partially overlapping traces', function() {
            frames[0].baseframe = frames[1].name;
            frames[1].baseframe = frames[2].name;
            frames[2].baseframe = frames[3].name;

            Plotly.addFrames(gd, frames.map(clone));

            expect(computeFrame(gd, 'frame0')).toEqual({
                traces: [2, 8],
                data: [
                    {marker: {size: 0}},
                    {marker: {size: 1}}
                ]
            });

            expect(gd._transitionData._frames).toEqual(frames);
        });

        it('assumes serial order without traces specified', function() {
            frames[4].baseframe = frames[3].name;

            Plotly.addFrames(gd, frames.map(clone));

            expect(computeFrame(gd, 'frame4')).toEqual({
                traces: [2, 8, 0, 1],
                data: [
                    {marker: {size: 7}},
                    {marker: {size: 4}},
                    {marker: {size: 5}},
                    {marker: {size: 6}}
                ]
            });

            expect(gd._transitionData._frames).toEqual(frames);
        });
    });

    describe('computing trace layout', function() {
        var frames, frameCopies;

        beforeEach(function(done) {
            frames = [{
                name: 'frame0',
                layout: {'margin.l': 40}
            }, {
                name: 'frame1',
                layout: {'margin.l': 80}
            }];

            frameCopies = frames.map(clone);

            Plotly.addFrames(gd, frames).then(done);
        });

        it('merges layouts', function() {
            frames[0].baseframe = frames[1].name;
            var result = computeFrame(gd, 'frame0');

            expect(result).toEqual({
                layout: {margin: {l: 40}}
            });
        });

        it('leaves the frame unaffected', function() {
            computeFrame(gd, 'frame0');
            expect(gd._transitionData._frames).toEqual(frameCopies);
        });
    });
});
