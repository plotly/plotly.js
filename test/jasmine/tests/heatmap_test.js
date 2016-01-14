var convertColumnXYZ = require('@src/traces/heatmap/convert_column_xyz');
var Heatmap = require('@src/traces/heatmap');
var Plots = require('@src/plots/plots');


describe('Test heatmap', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn,
            traceOut;

        var defaultColor = '#444',
            layout = {
                font: Plots.layoutAttributes.font
            };

        var supplyDefaults = Heatmap.supplyDefaults;

        beforeEach(function() {
            traceOut = {};
        });

        it('should set visible to false when z is empty', function() {
            traceIn = {
                z: []
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                z: [[]]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                z: [[], [], []]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                type: 'heatmap',
                z: [[1, 2], []]
            };
            traceOut = Plots.supplyDataDefaults(traceIn, 0, layout);

            traceIn = {
                type: 'heatmap',
                z: [[], [1, 2], [1, 2, 3]]
            };
            traceOut = Plots.supplyDataDefaults(traceIn, 0, layout);
            expect(traceOut.visible).toBe(true);
            expect(traceOut.visible).toBe(true);
        });

        it('should set visible to false when z is non-numeric', function() {
            traceIn = {
                type: 'heatmap',
                z: [['a', 'b'], ['c', 'd']]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should set visible to false when z isn\'t column not a 2d array', function() {
            traceIn = {
                x: [1, 1, 1, 2, 2],
                y: [1, 2, 3, 1, 2],
                z: [1, ['this is considered a column'], 1, 2, 3]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).not.toBe(false);

            traceIn = {
                x: [1, 1, 1, 2, 2],
                y: [1, 2, 3, 1, 2],
                z: [[0], ['this is not considered a column'], 1, ['nor 2d']]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

    });

    describe('convertColumnXYZ', function() {
        var trace;

        function makeMockAxis() {
            return {
                d2c: function(v) { return v; }
            };
        }

        var xa = makeMockAxis(),
            ya = makeMockAxis();

        it('should convert x/y/z columns to z(x,y)', function() {
            trace = {
                x: [1, 1, 1, 2, 2, 2],
                y: [1, 2, 3, 1, 2, 3],
                z: [1, 2, 3, 4, 5, 6]
            };

            convertColumnXYZ(trace, xa, ya);
            expect(trace.x).toEqual([1, 2]);
            expect(trace.y).toEqual([1, 2, 3]);
            expect(trace.z).toEqual([[1, 4], [2, 5], [3, 6]]);
        });

        it('should convert x/y/z columns to z(x,y) with uneven dimensions', function() {
            trace = {
                x: [1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3],
                y: [1, 2, 1, 2, 3],
                z: [1, 2, 4, 5, 6]
            };

            convertColumnXYZ(trace, xa, ya);
            expect(trace.x).toEqual([1, 2]);
            expect(trace.y).toEqual([1, 2, 3]);
            expect(trace.z).toEqual([[1, 4], [2, 5], [, 6]]);
        });

        it('should convert x/y/z columns to z(x,y) with missing values', function() {
            trace = {
                x: [1, 1, 2, 2, 2],
                y: [1, 2, 1, 2, 3],
                z: [1, null, 4, 5, 6]
            };

            convertColumnXYZ(trace, xa, ya);
            expect(trace.x).toEqual([1, 2]);
            expect(trace.y).toEqual([1, 2, 3]);
            expect(trace.z).toEqual([[1, 4], [null, 5], [, 6]]);
        });

        it('should convert x/y/z/text columns to z(x,y) and text(x,y)', function() {
            trace = {
                x: [1, 1, 1, 2, 2, 2],
                y: [1, 2, 3, 1, 2, 3],
                z: [1, 2, 3, 4, 5, 6],
                text: ['a', 'b', 'c', 'd', 'e', 'f', 'g']
            };

            convertColumnXYZ(trace, xa ,ya);
            expect(trace.text).toEqual([['a', 'd'], ['b', 'e'], ['c', 'f']]);
        });

        it('should convert x/y/z columns to z(x,y) with out-of-order data', function() {
            /*eslint no-sparse-arrays: 0*/

            trace = {
                x: [
                    50076, -42372, -19260, 3852, 26964, -65484, -42372, -19260,
                    3852, 26964, -88596, -65484, -42372, -19260, 3852, 26964, 50076, 73188,
                    -65484, -42372, -19260, 3852, 26964, 50076, -42372, -19260, 3852, 26964,
                    -88596, -65484, -42372, -19260, 3852, 26964, 50076, 73188, -88596, -65484,
                    -42372, -19260, 3852, 26964, 50076, 73188
                ],
                y: [
                    51851.8, 77841.4, 77841.4, 77841.4, 77841.4, 51851.8, 51851.8, 51851.8,
                    51851.8, 51851.8, -26117, -26117, -26117, -26117, -26117, -26117, -26117, -26117,
                    -52106.6, -52106.6, -52106.6, -52106.6, -52106.6, -52106.6, -78096.2, -78096.2,
                    -78096.2, -78096.2, -127.4, -127.4, -127.4, -127.4, -127.4, -127.4, -127.4, -127.4,
                    25862.2, 25862.2, 25862.2, 25862.2, 25862.2, 25862.2, 25862.2, 25862.2
                ],
                z: [
                    4.361856, 4.234497, 4.321701, 4.450315, 4.416136, 4.210373,
                    4.32009, 4.246728, 4.293992, 4.316364, 3.908434, 4.433257, 4.364234, 4.308714, 4.275516,
                    4.126979, 4.296483, 4.320471, 4.339848, 4.39907, 4.345006, 4.315032, 4.295618, 4.262052,
                    4.154291, 4.404264, 4.33847, 4.270931, 4.032226, 4.381492, 4.328922, 4.24046, 4.349151,
                    4.202861, 4.256402, 4.28972, 3.956225, 4.337909, 4.31226, 4.259435, 4.146854, 4.235799,
                    4.238752, 4.299876
                ]
            };

            convertColumnXYZ(trace, xa, ya);
            expect(trace.x).toEqual(
                [-88596, -65484, -42372, -19260, 3852, 26964, 50076, 73188]);
            expect(trace.y).toEqual(
                [-78096.2, -52106.6, -26117, -127.4, 25862.2, 51851.8, 77841.4]);
            expect(trace.z).toEqual([
                [,,4.154291,4.404264,4.33847,4.270931,,,],
                [,4.339848,4.39907,4.345006,4.315032,4.295618,4.262052,,],
                [3.908434,4.433257,4.364234,4.308714,4.275516,4.126979,4.296483,4.320471],
                [4.032226,4.381492,4.328922,4.24046,4.349151,4.202861,4.256402,4.28972],
                [3.956225,4.337909,4.31226,4.259435,4.146854,4.235799,4.238752,4.299876],
                [,4.210373,4.32009,4.246728,4.293992,4.316364,4.361856,,],
                [,,4.234497,4.321701,4.450315,4.416136,,,]
            ]);
        });

    });

});
