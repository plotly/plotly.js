var RangeSelector = require('@src/components/range_selector');


describe('range selector', function() {
    'use strict';

    describe('defaults', function() {
        var supplyDefaults = RangeSelector.supplyDefaults;

        it('should set \'visible\' to false when no buttons are present', function() {
            var containerIn = {};
            var containerOut = {};

            supplyDefaults(containerIn, containerOut, {});

            expect(containerOut.rangeselector)
                .toEqual({
                    visible: false,
                    buttons: []
                });
        });

        it('should coerce all buttons present', function() {
            var containerIn = {
                rangeselector: {
                    buttons: [{
                        step: 'year',
                        count: 10
                    },{
                        count: 6
                    }]
                }
            };
            var containerOut = {};

            supplyDefaults(containerIn, containerOut, {});

            expect(containerOut.rangeselector.visible).toBe(true);
            expect(containerOut.rangeselector.buttons).toEqual([
                { step: 'year', stepmode: 'backward', count: 10 },
                { step: 'month', stepmode: 'backward', count: 6 }
            ]);
        });


    });


});
