var Plotly = require('@lib/index');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var computeFrame = require('@src/plots/plots').computeFrame;

describe('Test mergeFrames', function() {
    'use strict';

    var gd, mock;

    beforeEach(function(done) {
        mock = [{x: [1, 2, 3], y: [2, 1, 3]}, {x: [1, 2, 3], y: [6, 4, 5]}];
        gd = createGraphDiv();
        Plotly.plot(gd, mock).then(done);
    });

    afterEach(destroyGraphDiv);

    describe('computing a single frame', function() {
        var frame1;

        beforeEach(function(done) {
            frame1 = {
                name: 'frame1',
                data: [{'marker.size': 8, marker: {color: 'red'}}]
            };

            Plotly.addFrames(gd, [frame1]).then(done);
        });

        it('returns false if the frame does not exist', function() {
            expect(computeFrame(gd, 'frame8')).toBe(false);
        });

        it('returns a new object', function() {
            expect(computeFrame(gd, 'frame1')).not.toBe(frame1);
        });

        it('computes a single frame', function() {
            var computed = computeFrame(gd, 'frame1');
            var expected = {data: [{marker: {size: 8, color: 'red'}}], traceIndices: [0]};
            expect(computed).toEqual(expected);
        });
    });

    describe('circularly defined frames', function() {
        var frames, results;

        beforeEach(function(done) {
            frames = [
                {name: 'frame0', baseFrame: 'frame1', data: [{'marker.size': 0}]},
                {name: 'frame1', baseFrame: 'frame2', data: [{'marker.size': 1}]},
                {name: 'frame2', baseFrame: 'frame0', data: [{'marker.size': 2}]}
            ];

            results = [
                {traceIndices: [0], data: [{marker: {size: 0}}]},
                {traceIndices: [0], data: [{marker: {size: 1}}]},
                {traceIndices: [0], data: [{marker: {size: 2}}]}
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

        beforeEach(function(done) {
            frames = [{
                name: 'frame0',
                data: [{'marker.size': 0}],
                traceIndices: [2]
            }, {
                name: 'frame1',
                data: [{'marker.size': 1}],
                traceIndices: [8]
            }, {
                name: 'frame2',
                data: [{'marker.size': 2}],
                traceIndices: [2]
            }, {
                name: 'frame3',
                data: [{'marker.size': 3}, {'marker.size': 4}],
                traceIndices: [2, 8]
            }, {
                name: 'frame4',
                data: [
                    {'marker.size': 5},
                    {'marker.size': 6},
                    {'marker.size': 7}
                ]
            }];

            Plotly.addFrames(gd, frames).then(done);
        });

        it('merges orthogonal traces', function() {
            frames[0].baseFrame = frames[1].name;
            var result = computeFrame(gd, 'frame0');
            expect(result).toEqual({
                traceIndices: [8, 2],
                data: [
                    {marker: {size: 1}},
                    {marker: {size: 0}}
                ]
            });
        });

        it('merges overlapping traces', function() {
            frames[0].baseFrame = frames[2].name;
            var result = computeFrame(gd, 'frame0');
            expect(result).toEqual({
                traceIndices: [2],
                data: [{marker: {size: 0}}]
            });
        });

        it('merges partially overlapping traces', function() {
            frames[0].baseFrame = frames[1].name;
            frames[1].baseFrame = frames[2].name;
            frames[2].baseFrame = frames[3].name;
            var result = computeFrame(gd, 'frame0');
            expect(result).toEqual({
                traceIndices: [2, 8],
                data: [
                    {marker: {size: 0}},
                    {marker: {size: 1}}
                ]
            });
        });

        it('assumes serial order without traceIndices specified', function() {
            frames[4].baseFrame = frames[3].name;
            var result = computeFrame(gd, 'frame4');
            expect(result).toEqual({
                traceIndices: [2, 8, 0, 1],
                data: [
                    {marker: {size: 7}},
                    {marker: {size: 4}},
                    {marker: {size: 5}},
                    {marker: {size: 6}}
                ]
            });
        });
    });

    describe('computing trace layout', function() {
        var frames;

        beforeEach(function(done) {
            frames = [{
                name: 'frame0',
                layout: {'margin.l': 40}
            }, {
                name: 'frame1',
                layout: {'margin.l': 80}
            }];

            Plotly.addFrames(gd, frames).then(done);
        });

        it('merges layouts', function() {
            frames[0].baseFrame = frames[1].name;
            var result = computeFrame(gd, 'frame0');

            expect(result).toEqual({
                layout: {margin: {l: 40}}
            });
        });

    });
});
