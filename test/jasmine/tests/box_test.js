var Box = require('@src/traces/box');


describe('Test boxes', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn,
            traceOut;

        var defaultColor = '#444';

        var supplyDefaults = Box.supplyDefaults;

        beforeEach(function() {
            traceOut = {};
        });

        it('should set visible to false when x and y are empty', function() {
            traceIn = {};
            supplyDefaults(traceIn, traceOut, defaultColor);
            expect(traceOut.visible).toBe(false);

            traceIn = {
                x: [],
                y: []
            };
            supplyDefaults(traceIn, traceOut, defaultColor, {});
            expect(traceOut.visible).toBe(false);
        });

        it('should set visible to false when x or y is empty', function() {
            traceIn = {
                x: []
            };
            supplyDefaults(traceIn, traceOut, defaultColor, {});
            expect(traceOut.visible).toBe(false);

            traceIn = {
                x: [],
                y: [1, 2, 3]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, {});
            expect(traceOut.visible).toBe(false);

            traceIn = {
                y: []
            };
            supplyDefaults(traceIn, traceOut, defaultColor, {});
            expect(traceOut.visible).toBe(false);

            traceIn = {
                x: [1, 2, 3],
                y: []
            };
            supplyDefaults(traceIn, traceOut, defaultColor, {});
            expect(traceOut.visible).toBe(false);
        });

        it('should set orientation to v by default', function() {
            traceIn = {
                y: [1, 2, 3]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, {});
            expect(traceOut.orientation).toBe('v');

            traceIn = {
                x: [1, 1, 1],
                y: [1, 2, 3]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, {});
            expect(traceOut.orientation).toBe('v');
        });

        it('should set orientation to h when only x is supplied', function() {
            traceIn = {
                x: [1, 2, 3]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, {});
            expect(traceOut.orientation).toBe('h');

        });

        it('should inherit layout.calendar', function() {
            traceIn = {
                y: [1, 2, 3]
            };
            supplyDefaults(traceIn, traceOut, defaultColor, {calendar: 'islamic'});

            // we always fill calendar attributes, because it's hard to tell if
            // we're on a date axis at this point.
            expect(traceOut.xcalendar).toBe('islamic');
            expect(traceOut.ycalendar).toBe('islamic');
        });

        it('should take its own calendars', function() {
            traceIn = {
                y: [1, 2, 3],
                xcalendar: 'coptic',
                ycalendar: 'ethiopian'
            };
            supplyDefaults(traceIn, traceOut, defaultColor, {calendar: 'islamic'});

            // we always fill calendar attributes, because it's hard to tell if
            // we're on a date axis at this point.
            expect(traceOut.xcalendar).toBe('coptic');
            expect(traceOut.ycalendar).toBe('ethiopian');
        });

    });

});
