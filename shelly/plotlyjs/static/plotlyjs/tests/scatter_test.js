var Plotly = require('../src/plotly');

describe('Test scatter', function () {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn,
            traceOut;

        var defaultColor = '#444',
            layout = {};

        var supplyDefaults = Plotly.Scatter.supplyDefaults;

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
            isBubble = Plotly.Scatter.isBubble(trace);

            expect(isBubble).toBe(true);
        });

        it('should return false when marker.size is an number', function() {
            var trace = {
                marker: {
                    size: 10
                }
            },
            isBubble = Plotly.Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });

        it('should return false when marker.size is not defined', function() {
            var trace = {
                marker: {
                    color: 'red'
                }
            },
            isBubble = Plotly.Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });

        it('should return false when marker is not defined', function() {
            var trace = {
                line: {
                    color: 'red'
                }
            },
            isBubble = Plotly.Scatter.isBubble(trace);

            expect(isBubble).toBe(false);
        });

    });

    describe('linePoints', function() {
        // test axes are unit-scaled and 100 units long
        var ax = {_length: 100, c2p: Plotly.Lib.identity},
            linePoints = Plotly.Scatter.linePoints,
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

    describe('calcColorscale', function() {
        var trace,
            z;

        var calcColorscale = Plotly.Scatter.calcColorscale;

        beforeEach(function() {
            trace = {};
            z = {};
        });

        it('should be RdBuNeg when autocolorscale and z <= 0', function() {
            trace = {
                type: 'heatmap',
                z: [[0, -1.5], [-2, -10]],
                autocolorscale: true,
                _input: {}
            };
            z = [[0, -1.5], [-2, -10]];
            calcColorscale(trace, z, '', 'z');
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale[5]).toEqual([1, 'rgb(220, 220, 220)']);
        });

        it('should be Blues when the only numerical z <= -0.5', function() {
            trace = {
                type: 'heatmap',
                z: [['a', 'b'], [-0.5, 'd']],
                autocolorscale: true,
                _input: {}
            };
            z = [[undefined, undefined], [-0.5, undefined]];
            calcColorscale(trace, z, '', 'z');
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale[5]).toEqual([1, 'rgb(220, 220, 220)']);
        });

        it('should be Reds when the only numerical z >= 0.5', function() {
            trace = {
                type: 'heatmap',
                z: [['a', 'b'], [0.5, 'd']],
                autocolorscale: true,
                _input: {}
            };
            z = [[undefined, undefined], [0.5, undefined]];
            calcColorscale(trace, z, '', 'z');
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale[0]).toEqual([0, 'rgb(220, 220, 220)']);
        });

    });
});
