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


    describe('calcColorscale', function() {
        var trace,
            z;

        var calcColorscale = Plotly.Heatmap.calcColorscale;

        beforeEach(function() {
            trace = {};
            z = {};
        });

        it('should be RdBuNeg when autocolorscale and z <= 0', function() {
            trace = {
                type: 'heatmap',
                z: [[0, -1.5], [-2, -10]],
                autocolorscale: true
            };
            z = [[0, -1.5], [-2, -10]];
            calcColorscale(trace, z);
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale[5]).toEqual([1, 'rgb(220, 220, 220)']);
        });

        it('should be RdBuNeg when the only numerical z <= -0.5', function() {
            trace = {
                type: 'heatmap',
                z: [['a', 'b'], [-0.5, 'd']],
                autocolorscale: true
            };
            z = [[undefined, undefined], [-0.5, undefined]];
            calcColorscale(trace, z);
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale[5]).toEqual([1, 'rgb(220, 220, 220)']);
        });

        it('should be RdBuPos when the only numerical z >= 0.5', function() {
            trace = {
                type: 'heatmap',
                z: [['a', 'b'], [0.5, 'd']],
                autocolorscale: true
            };
            z = [[undefined, undefined], [0.5, undefined]];
            calcColorscale(trace, z);
            expect(trace.autocolorscale).toBe(true);
            expect(trace.colorscale[0]).toEqual([0, 'rgb(220, 220, 220)']);
        });

    });

});
