var Plotly = require('../src/plotly');

describe('Test heatmap', function () {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn,
            traceOut;

        var defaultColor = '#444',
            layout = {
                font: Plotly.Plots.layoutAttributes.font
            };

        var supplyDefaults = Plotly.Heatmap.supplyDefaults;

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
            traceOut = Plotly.Plots.supplyDataDefaults(traceIn, 0, layout);

            traceIn = {
                type: 'heatmap',
                z: [[], [1, 2], [1, 2, 3]]
            };
            traceOut = Plotly.Plots.supplyDataDefaults(traceIn, 0, layout);
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

    });

});
