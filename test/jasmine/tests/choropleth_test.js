var Plotly = require('@src/plotly');

describe('Test choropleth', function () {
    'use strict';

    var Choropleth = Plotly.Choropleth;

    describe('supplyDefaults', function() {
        var traceIn,
            traceOut;

        var defaultColor = '#444',
            layout = {
                font: Plotly.Plots.layoutAttributes.font
            };

        beforeEach(function() {
            traceOut = {};
        });

        it('should slice z if it is longer than locations', function() {
            traceIn = {
                locations: ['CAN','USA'],
                z: [1, 2, 3]
            };

            Choropleth.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.z).toEqual([1, 2]);
        });

        it('should make trace invisible if locations is not defined', function() {
            traceIn = {
                z: [1, 2, 3]
            };

            Choropleth.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

        it('should make trace invisible if z is not an array', function() {
            traceIn = {
                z: 'no gonna work'
            };

            Choropleth.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.visible).toBe(false);
        });

    });

});
