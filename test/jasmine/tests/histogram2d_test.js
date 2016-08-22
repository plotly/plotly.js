var supplyDefaults = require('@src/traces/histogram2d/defaults');


describe('Test histogram2d', function() {
    'use strict';

    describe('supplyDefaults', function() {
        var traceIn,
            traceOut;

        beforeEach(function() {
            traceOut = {};
        });

        it('should set zsmooth to false when zsmooth is empty', function() {
            traceIn = {};
            supplyDefaults(traceIn, traceOut, {});
            expect(traceOut.zsmooth).toBe(false);
        });

        it('doesnt step on zsmooth when zsmooth is set', function() {
            traceIn = {
                zsmooth: 'fast'
            };
            supplyDefaults(traceIn, traceOut, {});
            expect(traceOut.zsmooth).toBe('fast');
        });

        it('should set xgap and ygap to 0 when xgap and ygap are empty', function() {
            traceIn = {};
            supplyDefaults(traceIn, traceOut, {});
            expect(traceOut.xgap).toBe(0);
            expect(traceOut.ygap).toBe(0);
        });

        it('shouldnt step on xgap and ygap when xgap and ygap are set', function() {
            traceIn = {
                xgap: 10,
                ygap: 5
            };
            supplyDefaults(traceIn, traceOut, {});
            expect(traceOut.xgap).toBe(10);
            expect(traceOut.ygap).toBe(5);
        });

        it('shouldnt coerce gap when zsmooth is set', function() {
            traceIn = {
                xgap: 10,
                ygap: 5,
                zsmooth: 'best'
            };
            supplyDefaults(traceIn, traceOut, {});
            expect(traceOut.xgap).toBe(undefined);
            expect(traceOut.ygap).toBe(undefined);
        });

    });

});
