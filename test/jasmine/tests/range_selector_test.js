var RangeSelector = require('@src/components/rangeselector');
var getUpdateObject = require('@src/components/rangeselector/get_update_object');


describe('range selector', function() {
    'use strict';

    describe('defaults', function() {
        var supplyLayoutDefaults = RangeSelector.supplyLayoutDefaults;

        it('should set \'visible\' to false when no buttons are present', function() {
            var containerIn = {};
            var containerOut = {};

            supplyLayoutDefaults(containerIn, containerOut, {});

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

            supplyLayoutDefaults(containerIn, containerOut, {});

            expect(containerOut.rangeselector.visible).toBe(true);
            expect(containerOut.rangeselector.buttons).toEqual([
                { step: 'year', stepmode: 'backward', count: 10 },
                { step: 'month', stepmode: 'backward', count: 6 }
            ]);
        });

    });

    describe('getUpdateObject', function() {
        var axisLayout = {
            range: [
                -694292400000,  // Thu Jan 01 1948 00:00:00
                1448859600000   // Mon Nov 30 2015 00:00:00
            ]
        };

        function assertRanges(update, range0, range1) {
            expect(update['xaxis.range[0]']).toEqual(range0);
            expect(update['xaxis.range[1]']).toEqual(range1);
        }

        it('should return update object (1 month backward case)', function() {
            var buttonLayout = {
                step: 'month',
                stepmode: 'backward',
                count: 1
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, 1446177600000, 1448859600000);
        });

        it('should return update object (3 months backward case)', function() {
            var buttonLayout = {
                step: 'month',
                stepmode: 'backward',
                count: 3
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, 1440907200000, 1448859600000);
        });

        it('should return update object (6 months backward case)', function() {
            var buttonLayout = {
                step: 'month',
                stepmode: 'backward',
                count: 6
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, 1432958400000, 1448859600000);
        });

        it('should return update object (3 months backward case)', function() {
            var buttonLayout = {
                step: 'month',
                stepmode: 'backward',
                count: 3
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, 1440907200000, 1448859600000);
        });

        it('should return update object (year-to-date case)', function() {
            var buttonLayout = {
                step: 'year',
                stepmode: 'to date',
                count: 1
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, 1420088400000, 1448859600000);
        });

        it('should return update object (1 year backward case)', function() {
            var buttonLayout = {
                step: 'year',
                stepmode: 'backward',
                count: 1
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, 1417323600000, 1448859600000);
        });

        it('should return update object (reset case)', function() {
            var buttonLayout = {
                step: 'all'
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            expect(update).toEqual({
                'xaxis.autorange': true,
                'xaxis.range': null
            });
        });
    });


});
