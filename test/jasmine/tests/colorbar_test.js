var Colorbar = require('@src/components/colorbar');


describe('Test colorbar:', function() {
    'use strict';

    describe('hasColorbar', function() {
        var hasColorbar = Colorbar.hasColorbar,
            trace;

        it('should return true when marker colorbar is defined', function() {
            trace = {
                marker: {
                    colorbar: {},
                    line: {
                        colorbar: {}
                    }
                }
            };
            expect(hasColorbar(trace.marker)).toBe(true);
            expect(hasColorbar(trace.marker.line)).toBe(true);

            trace = {
                marker: {
                    line: {}
                }
            };
            expect(hasColorbar(trace.marker)).toBe(false);
            expect(hasColorbar(trace.marker.line)).toBe(false);
        });
    });
});
