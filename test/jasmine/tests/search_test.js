var Lib = require('@src/lib');

describe('Test search.js:', function() {
    'use strict';

    describe('findBin', function() {
        it('should work on ascending arrays', function() {
            expect(Lib.findBin(-10000, [0, 1, 3])).toBe(-1);
            expect(Lib.findBin(0.5, [0, 1, 3])).toBe(0);
            expect(Lib.findBin(2, [0, 1, 3])).toBe(1);
            expect(Lib.findBin(10000, [0, 1, 3])).toBe(2);
            // default: linelow falsey, so the line is in the higher bin
            expect(Lib.findBin(1, [0, 1, 3])).toBe(1);
            // linelow truthy, so the line is in the lower bin
            expect(Lib.findBin(1, [0, 1, 3], true)).toBe(0);
        });

        it('should work on decending arrays', function() {
            expect(Lib.findBin(-10000, [3, 1, 0])).toBe(2);
            expect(Lib.findBin(0.5, [3, 1, 0])).toBe(1);
            expect(Lib.findBin(2, [3, 1, 0])).toBe(0);
            expect(Lib.findBin(10000, [3, 1, 0])).toBe(-1);

            expect(Lib.findBin(1, [3, 1, 0])).toBe(0);
            expect(Lib.findBin(1, [3, 1, 0], true)).toBe(1);
        });

        it('should treat a length-1 array as ascending', function() {
            expect(Lib.findBin(-1, [0])).toBe(-1);
            expect(Lib.findBin(1, [0])).toBe(0);

            expect(Lib.findBin(0, [0])).toBe(0);
            expect(Lib.findBin(0, [0], true)).toBe(-1);
        });
        // TODO: didn't test bins as objects {start, stop, size}
    });
});
