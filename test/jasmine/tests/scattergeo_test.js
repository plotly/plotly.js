var ScatterGeo = require('@src/traces/scattergeo');

describe('Test scattergeo', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn,
            traceOut;

        var defaultColor = '#444',
            layout = {};

        beforeEach(function() {
            traceOut = {};
        });

        it('should slice lat if it it longer than lon', function() {
            traceIn = {
                lon: [-75],
                lat: [45, 45, 45]
            };

            ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.lat).toEqual([45]);
            expect(traceOut.lon).toEqual([-75]);
        });

        it('should slice lon if it it longer than lat', function() {
            traceIn = {
                lon: [-75, -75, -75],
                lat: [45]
            };

            ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.lat).toEqual([45]);
            expect(traceOut.lon).toEqual([-75]);
        });

        it('should not coerce lat and lon if locations is valid', function() {
            traceIn = {
                locations: ['CAN', 'USA'],
                lon: [20, 40],
                lat: [20, 40]
            };

            ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
            expect(traceOut.lon).toBeUndefined();
            expect(traceOut.lat).toBeUndefined();
        });

        it('should make trace invisible if lon or lat is omitted and locations not given', function() {
            function testOne() {
                ScatterGeo.supplyDefaults(traceIn, traceOut, defaultColor, layout);
                expect(traceOut.visible).toBe(false);
            }

            traceIn = {
                lat: [45, 45, 45]
            };
            testOne();

            traceIn = {
                lon: [-75, -75, -75]
            };
            traceOut = {};
            testOne();

            traceIn = {};
            traceOut = {};
            testOne();
        });
    });

});
