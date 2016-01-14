var Plots = require('@src/plots/plots');
var Contour = require('@src/traces/contour');


describe('Test contour', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn,
            traceOut;

        var defaultColor = '#444',
            layout = {
                font: Plots.layoutAttributes.font
            };

        var supplyDefaults = Contour.supplyDefaults;

        beforeEach(function() {
            traceOut = {};
        });

        it('should set autocontour to false when contours is supplied', function() {
            traceIn = {
                type: 'contour',
                z: [[10, 10.625, 12.5, 15.625],
                    [5.625, 6.25, 8.125, 11.25],
                    [2.5, 3.125, 5., 8.125],
                    [0.625, 1.25, 3.125, 6.25]],
                contours: {
                    start: 4,
                    end: 14,
                    size: .5
                }
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.autocontour).toBe(false);

            traceIn = {
                type: 'contour',
                z: [[10, 10.625, 12.5, 15.625],
                    [5.625, 6.25, 8.125, 11.25],
                    [2.5, 3.125, 5., 8.125],
                    [0.625, 1.25, 3.125, 6.25]]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.autocontour).toBe(true);
        });
    });
});
