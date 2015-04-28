var Plotly = require('../src/plotly');

describe('Test histogram', function () {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn,
            traceOut;

        var supplyDefaults = Plotly.Histogram.supplyDefaults;

        beforeEach(function() {
            traceOut = {};
        });

        it('should set visible to false when x or y is empty', function() {
            traceIn = {
                x: []
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                y: []
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.visible).toBe(false);
        });

        it('should set visible to false when type is histogram2d and x or y are empty', function() {
            traceIn = {
                type: 'histogram2d',
                x: [],
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                type: 'histogram2d',
                x: [1, 2, 2],
                y: []
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                type: 'histogram2d',
                x: [],
                y: []
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                type: 'histogram2dcontour',
                x: [],
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.visible).toBe(false);
        });

        it('should set orientation to v by default', function() {
            traceIn = {
                x: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.orientation).toBe('v');

            traceIn = {
                x: [1, 2, 2],
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.orientation).toBe('v');
        });

        it('should set orientation to h when only y is supplied', function() {
            traceIn = {
                y: [1, 2, 2]
            };
            supplyDefaults(traceIn, traceOut);
            expect(traceOut.orientation).toBe('h');

        });

    });

});
