var Scatter = require('@src/traces/scatter');
var makeBubbleSizeFn = require('@src/traces/scatter/make_bubble_size_func');
var linePoints = require('@src/traces/scatter/line_points');
var Lib = require('@src/lib');

describe('Test scatter', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn,
            traceOut;

        var defaultColor = '#444',
            layout = {};

        var supplyDefaults = Scatter.supplyDefaults;

        beforeEach(function() {
            traceOut = {};
        });

        it('should set visible to false when x and y are empty', function() {
            traceIn = {};
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                x: [],
                y: []
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should set visible to false when x or y is empty', function() {
            traceIn = {
                x: []
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                x: [],
                y: [1, 2, 3]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                y: []
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                x: [1, 2, 3],
                y: []
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

    });

    describe('isBubble', function() {
        it('should return true when marker.size is an Array', function() {
            var trace = {
                    marker: {
                        size: [1, 4, 2, 10]
                    }
                },
                isBubble = Scatter.isBubble(trace);

            expect(isBubble).toBe(true);
        });

        it('should return false when marker.size is an number', function() {
            var trace = {
                    marker: {
                        size: 10
                    }
                },
                isBubble = Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });

        it('should return false when marker.size is not defined', function() {
            var trace = {
                    marker: {
                        color: 'red'
                    }
                },
                isBubble = Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });

        it('should return false when marker is not defined', function() {
            var trace = {
                    line: {
                        color: 'red'
                    }
                },
                isBubble = Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });

    });

    describe('makeBubbleSizeFn', function() {
        var markerSizes = [
                0, '1', 2.21321321, 'not-a-number',
                100, 1000.213213, 1e7, undefined, null, -100
            ],
            trace = { marker: {} };

        var sizeFn, expected;

        it('should scale w.r.t. bubble diameter when sizemode=diameter', function() {
            trace.marker.sizemode = 'diameter';
            sizeFn = makeBubbleSizeFn(trace);

            expected = [
                0, 0.5, 1.106606605, 0, 50, 500.1066065, 5000000, 0, 0, 0
            ];
            expect(markerSizes.map(sizeFn)).toEqual(expected);
        });

        it('should scale w.r.t. bubble area when sizemode=area', function() {
            trace.marker.sizemode = 'area';
            sizeFn = makeBubbleSizeFn(trace);

            expected = [
                0, 0.7071067811865476, 1.051953708582274, 0, 7.0710678118654755,
                22.363063441755916, 2236.06797749979, 0, 0, 0
            ];
            expect(markerSizes.map(sizeFn)).toEqual(expected);
        });

        it('should adjust scaling according to sizeref', function() {
            trace.marker.sizemode = 'diameter';
            trace.marker.sizeref = 0.1;
            sizeFn = makeBubbleSizeFn(trace);

            expected = [
                0, 5, 11.06606605, 0, 500, 5001.066065, 50000000, 0, 0, 0
            ];
            expect(markerSizes.map(sizeFn)).toEqual(expected);
        });

        it('should adjust the small sizes according to sizemin', function() {
            trace.marker.sizemode = 'diameter';
            trace.marker.sizeref = 10;
            trace.marker.sizemin = 5;
            sizeFn = makeBubbleSizeFn(trace);

            expected = [
                0, 5, 5, 0, 5, 50.01066065, 500000, 0, 0, 0
            ];
            expect(markerSizes.map(sizeFn)).toEqual(expected);
        });
    });

    describe('linePoints', function() {
        // test axes are unit-scaled and 100 units long
        var ax = {_length: 100, c2p: Lib.identity},
            baseOpts = {
                xaxis: ax,
                yaxis: ax,
                connectGaps: false,
                baseTolerance: 1,
                linear: true
            };

        function makeCalcData(ptsIn) {
            return ptsIn.map(function(pt) {
                return {x: pt[0], y: pt[1]};
            });
        }

        function callLinePoints(ptsIn, opts) {
            var thisOpts = {};
            if(!opts) opts = {};
            Object.keys(baseOpts).forEach(function(key) {
                if(opts[key] !== undefined) thisOpts[key] = opts[key];
                else thisOpts[key] = baseOpts[key];
            });
            return linePoints(makeCalcData(ptsIn), thisOpts);
        }

        it('should pass along well-separated non-linear points', function() {
            var ptsIn = [[0,0], [10,20], [20,10], [30,40], [40,60], [50,30]];
            var ptsOut = callLinePoints(ptsIn);

            expect(ptsOut).toEqual([ptsIn]);
        });

        it('should collapse straight lines to just their endpoints', function() {
            var ptsIn = [[0,0], [5,10], [13,26], [15,30], [22,16], [28,4], [30,0]];
            var ptsOut = callLinePoints(ptsIn);
            // TODO: [22,16] should not appear here. This is ok but not optimal.
            expect(ptsOut).toEqual([[[0,0], [15,30], [22,16], [30,0]]]);
        });

        it('should separate out blanks, unless connectgaps is true', function() {
            var ptsIn = [
                [0,0], [10,20], [20,10], [undefined, undefined],
                [30,40], [undefined, undefined],
                [40,60], [50,30]];
            var ptsDisjoint = callLinePoints(ptsIn);
            var ptsConnected = callLinePoints(ptsIn, {connectGaps: true});

            expect(ptsDisjoint).toEqual([[[0,0], [10,20], [20,10]], [[30,40]], [[40,60], [50,30]]]);
            expect(ptsConnected).toEqual([[[0,0], [10,20], [20,10], [30,40], [40,60], [50,30]]]);
        });

        it('should collapse a vertical cluster into 4 points', function() {
            // the four being initial, high, low, and final if the high is before the low
            var ptsIn = [[-10,0], [0,0], [0,10], [0,20], [0,-10], [0,15], [0,-25], [0,10], [0,5], [10,10]];
            var ptsOut = callLinePoints(ptsIn);

            // TODO: [0, 10] should not appear in either of these results - this is OK but not optimal.
            expect(ptsOut).toEqual([[[-10,0], [0,0], [0,10], [0,20], [0,-25], [0,5], [10,10]]]);

            // or initial, low, high, final if the low is before the high
            ptsIn = [[-10,0], [0,0], [0,10], [0,-25], [0,-10], [0,15], [0,20], [0,10], [0,5], [10,10]];
            ptsOut = callLinePoints(ptsIn);

            expect(ptsOut).toEqual([[[-10,0], [0,0], [0,10], [0,-25], [0,20], [0,5], [10,10]]]);
        });

        it('should collapse a horizontal cluster into 4 points', function() {
            // same deal
            var ptsIn = [[0,-10], [0,0], [10,0], [20,0], [-10,0], [15,0], [-25,0], [10,0], [5,0], [10,10]];
            var ptsOut = callLinePoints(ptsIn);

            // TODO: [10, 0] should not appear in either of these results - this is OK but not optimal.
            // same problem as the test above
            expect(ptsOut).toEqual([[[0,-10], [0,0], [10,0], [20,0], [-25,0], [5,0], [10,10]]]);

            ptsIn = [[0,-10], [0,0], [10,0], [-25,0], [-10,0], [15,0], [20,0], [10,0], [5,0], [10,10]];
            ptsOut = callLinePoints(ptsIn);

            expect(ptsOut).toEqual([[[0,-10], [0,0], [10,0], [-25,0], [20,0], [5,0], [10,10]]]);
        });

        it('should use lineWidth to determine whether a cluster counts', function() {
            var ptsIn = [[0,0], [20,0], [21,10], [22,20], [23,-10], [24,15], [25,-25], [26,10], [27,5], [100,10]];
            var ptsThin = callLinePoints(ptsIn);
            var ptsThick = callLinePoints(ptsIn, {baseTolerance: 8});

            // thin line, no decimation. thick line yes.
            expect(ptsThin).toEqual([ptsIn]);
            // TODO: [21,10] should not appear in this result (same issue again)
            expect(ptsThick).toEqual([[[0,0], [20,0], [21,10], [22,20], [25,-25], [27,5], [100,10]]]);
        });

        // TODO: test coarser decimation outside plot, and removing very near duplicates from the four of a cluster
    });

});
