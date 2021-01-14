var supplyDefaults = require('@src/traces/heatmapgl').supplyDefaults;
var Plots = require('@src/plots/plots');
var Plotly = require('@lib/index');
var schema = Plotly.PlotSchema.get();
var attributeList = Object.getOwnPropertyNames(schema.traces.heatmapgl.attributes);

describe('heatmapgl supplyDefaults', function() {
    'use strict';

    var traceIn;
    var traceOut;

    var defaultColor = '#444';
    var layout = {
        font: Plots.layoutAttributes.font,
        _dfltTitle: {colorbar: 'cb'},
        _subplots: {cartesian: ['xy'], xaxis: ['x'], yaxis: ['y']}
    };

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
            type: 'heatmapgl',
            z: [[1, 2], []]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).toBe(false);

        traceIn = {
            type: 'heatmapgl',
            z: [[], [1, 2], [1, 2, 3]]
        };
        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        expect(traceOut.visible).toBe(false);
    });

    it('should set visible to false when z is non-numeric', function() {
        traceIn = {
            type: 'heatmapgl',
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

    it('should only coerce attributes that are part of scheme', function() {
        traceIn = {
            type: 'heatmapgl',
            z: [[0, 1], [1, 0]]
        };

        supplyDefaults(traceIn, traceOut, defaultColor, layout);
        var allKeys = Object.getOwnPropertyNames(traceOut);
        allKeys.forEach(function(key) {
            if(key[0] !== '_') {
                expect(attributeList.indexOf(key)).not.toBe(-1, key);
            }
        });
    });
});
