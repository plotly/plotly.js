var RangeSelector = require('@src/components/rangeselector');
var getUpdateObject = require('@src/components/rangeselector/get_update_object');

var Plotly = require('@lib');
var Lib = require('@src/lib');
var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var getRectCenter = require('../assets/get_rect_center');
var mouseEvent = require('../assets/mouse_event');


describe('[range selector suite]', function() {
    'use strict';

    describe('defaults:', function() {
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

        it('should coerce an empty button object', function() {
            var containerIn = {
                rangeselector: {
                    buttons: [{}]
                }
            };
            var containerOut = {};

            supplyLayoutDefaults(containerIn, containerOut, {});

            expect(containerIn.rangeselector.buttons).toEqual([{}]);
            expect(containerOut.rangeselector.buttons).toEqual([{
                step: 'month',
                stepmode: 'backward',
                count: 1
            }]);
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

        it('should not coerce \'stepmode\' and \'count\', for \'step\' all buttons', function() {
            var containerIn = {
                rangeselector: {
                    buttons: [{
                        step: 'all',
                        label: 'full range'
                    }]
                }
            };
            var containerOut = {};

            supplyLayoutDefaults(containerIn, containerOut, {});

            expect(containerOut.rangeselector.buttons).toEqual([{
                step: 'all',
                label: 'full range'
            }]);
        });

    });

    describe('getUpdateObject:', function() {
        var axisLayout = {
            _name: 'xaxis',
            range: [
                (new Date(1948, 0, 1)).getTime(),
                (new Date(2015, 10, 30)).getTime()
            ]
        };

        function assertRanges(update, range0, range1) {
            expect(update['xaxis.range[0]']).toEqual(range0.getTime());
            expect(update['xaxis.range[1]']).toEqual(range1.getTime());
        }

        it('should return update object (1 month backward case)', function() {
            var buttonLayout = {
                step: 'month',
                stepmode: 'backward',
                count: 1
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, new Date(2015, 9, 30), new Date(2015, 10, 30));
        });

        it('should return update object (3 months backward case)', function() {
            var buttonLayout = {
                step: 'month',
                stepmode: 'backward',
                count: 3
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, new Date(2015, 7, 30), new Date(2015, 10, 30));
        });

        it('should return update object (6 months backward case)', function() {
            var buttonLayout = {
                step: 'month',
                stepmode: 'backward',
                count: 6
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, new Date(2015, 4, 30), new Date(2015, 10, 30));
        });

        it('should return update object (5 months to-date case)', function() {
            var buttonLayout = {
                step: 'month',
                stepmode: 'to date',
                count: 5
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, new Date(2015, 6, 1), new Date(2015, 10, 30));
        });

        it('should return update object (1 year to-date case)', function() {
            var buttonLayout = {
                step: 'year',
                stepmode: 'to date',
                count: 1
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, new Date(2015, 0, 1), new Date(2015, 10, 30));
        });

        it('should return update object (10 year to-date case)', function() {
            var buttonLayout = {
                step: 'year',
                stepmode: 'to date',
                count: 10
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, new Date(2006, 0, 1), new Date(2015, 10, 30));
        });

        it('should return update object (1 year backward case)', function() {
            var buttonLayout = {
                step: 'year',
                stepmode: 'backward',
                count: 1
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, new Date(2014, 10, 30), new Date(2015, 10, 30));
        });

        it('should return update object (reset case)', function() {
            var buttonLayout = {
                step: 'all'
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            expect(update).toEqual({ 'xaxis.autorange': true });
        });

        it('should return update object (10 day backward case)', function() {
            var buttonLayout = {
                step: 'day',
                stepmode: 'backward',
                count: 10
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, new Date(2015, 10, 20), new Date(2015, 10, 30));
        });

        it('should return update object (5 hour backward case)', function() {
            var buttonLayout = {
                step: 'hour',
                stepmode: 'backward',
                count: 5
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, new Date(2015, 10, 29, 19), new Date(2015, 10, 30));
        });

        it('should return update object (15 minute backward case)', function() {
            var buttonLayout = {
                step: 'minute',
                stepmode: 'backward',
                count: 15
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, new Date(2015, 10, 29, 23, 45), new Date(2015, 10, 30));
        });

        it('should return update object (10 second backward case)', function() {
            var buttonLayout = {
                step: 'second',
                stepmode: 'backward',
                count: 10
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, new Date(2015, 10, 29, 23, 59, 50), new Date(2015, 10, 30));
        });

        it('should return update object (12 hour to-date case)', function() {
            var buttonLayout = {
                step: 'hour',
                stepmode: 'to date',
                count: 12
            };

            axisLayout.range[1] = new Date(2015, 10, 30, 12).getTime();

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, new Date(2015, 10, 30, 1), new Date(2015, 10, 30, 12));
        });

        it('should return update object (15 minute backward case)', function() {
            var buttonLayout = {
                step: 'minute',
                stepmode: 'to date',
                count: 20
            };

            axisLayout.range[1] = new Date(2015, 10, 30, 12, 20).getTime();

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, new Date(2015, 10, 30, 12, 1), new Date(2015, 10, 30, 12, 20));
        });

        it('should return update object (2 second to-date case)', function() {
            var buttonLayout = {
                step: 'second',
                stepmode: 'to date',
                count: 2
            };

            axisLayout.range[1] = new Date(2015, 10, 30, 12, 20, 2).getTime();

            var update = getUpdateObject(axisLayout, buttonLayout);

            assertRanges(update, new Date(2015, 10, 30, 12, 20, 1), new Date(2015, 10, 30, 12, 20, 2));
        });

        it('should return update object with correct axis names', function() {
            var axisLayout = {
                _name: 'xaxis5',
                range: [
                    (new Date(1948, 0, 1)).getTime(),
                    (new Date(2015, 10, 30)).getTime()
                ]
            };

            var buttonLayout = {
                step: 'month',
                stepmode: 'backward',
                count: 1
            };

            var update = getUpdateObject(axisLayout, buttonLayout);

            expect(update).toEqual({
                'xaxis5.range[0]': new Date(2015, 9, 30).getTime(),
                'xaxis5.range[1]': new Date(2015, 10, 30).getTime()
            });

        });
    });

    describe('interactions:', function() {
        var mock = require('@mocks/range_selector.json');

        var gd, mockCopy;

        beforeEach(function(done) {
            gd = createGraphDiv();
            mockCopy = Lib.extendDeep({}, mock);

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
        });

        afterEach(destroyGraphDiv);

        function assertNodeCount(query, cnt) {
            expect(d3.selectAll(query).size()).toEqual(cnt);
        }

        it('should display ', function() {
            assertNodeCount('.rangeselector', 1);
            assertNodeCount('.button', mockCopy.layout.xaxis.rangeselector.buttons.length);
        });

        it('should be able to be removed by `relayout`', function(done) {

            Plotly.relayout(gd, 'xaxis.rangeselector.visible', false).then(function() {
                assertNodeCount('.rangeselector', 0);
                assertNodeCount('.button', 0);
                done();
            });

        });

        it('should update range when clicked', function() {
            var range0 = gd.layout.xaxis.range[0];
            var buttons = d3.selectAll('.button').select('rect');

            var pos0 = getRectCenter(buttons[0][0]);
            var posReset = getRectCenter(buttons[0][buttons.size()-1]);

            mouseEvent('click', pos0[0], pos0[1]);
            expect(gd.layout.xaxis.range[0]).toBeGreaterThan(range0);

            mouseEvent('click', posReset[0], posReset[1]);
            expect(gd.layout.xaxis.range[0]).toEqual(range0);
        });

    });

});
