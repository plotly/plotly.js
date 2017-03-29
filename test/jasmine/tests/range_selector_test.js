var RangeSelector = require('@src/components/rangeselector');
var getUpdateObject = require('@src/components/rangeselector/get_update_object');

var d3 = require('d3');
var Plotly = require('@lib');
var Lib = require('@src/lib');
var Color = require('@src/components/color');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var getRectCenter = require('../assets/get_rect_center');
var mouseEvent = require('../assets/mouse_event');
var setConvert = require('@src/plots/cartesian/set_convert');


describe('range selector defaults:', function() {
    'use strict';

    var handleDefaults = RangeSelector.handleDefaults;

    function supply(containerIn, containerOut, calendar) {
        containerOut.domain = [0, 1];

        var layout = {
            yaxis: { domain: [0, 1] }
        };

        var counterAxes = ['yaxis'];

        handleDefaults(containerIn, containerOut, layout, counterAxes, calendar);
    }

    it('should set \'visible\' to false when no buttons are present', function() {
        var containerIn = {};
        var containerOut = {};

        supply(containerIn, containerOut);

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

        supply(containerIn, containerOut);

        expect(containerIn.rangeselector.buttons).toEqual([{}]);
        expect(containerOut.rangeselector.buttons).toEqual([{
            step: 'month',
            stepmode: 'backward',
            count: 1,
            _index: 0
        }]);
    });

    it('should skip over non-object buttons', function() {
        var containerIn = {
            rangeselector: {
                buttons: [{
                    label: 'button 0'
                }, null, {
                    label: 'button 2'
                }, 'remove', {
                    label: 'button 4'
                }]
            }
        };
        var containerOut = {};

        supply(containerIn, containerOut);

        expect(containerIn.rangeselector.buttons.length).toEqual(5);
        expect(containerOut.rangeselector.buttons.length).toEqual(3);
    });

    it('should coerce all buttons present', function() {
        var containerIn = {
            rangeselector: {
                buttons: [{
                    step: 'year',
                    count: 10
                }, {
                    count: 6
                }]
            }
        };
        var containerOut = {};

        supply(containerIn, containerOut);

        expect(containerOut.rangeselector.visible).toBe(true);
        expect(containerOut.rangeselector.buttons).toEqual([
            { step: 'year', stepmode: 'backward', count: 10, _index: 0 },
            { step: 'month', stepmode: 'backward', count: 6, _index: 1 }
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

        supply(containerIn, containerOut);

        expect(containerOut.rangeselector.buttons).toEqual([{
            step: 'all',
            label: 'full range',
            _index: 0
        }]);
    });

    it('should use axis and counter axis to determine \'x\' and \'y\' defaults (case 1 y)', function() {
        var containerIn = {
            rangeselector: { buttons: [{}] }
        };
        var containerOut = {
            _id: 'x',
            domain: [0, 0.5]
        };
        var layout = {
            xaxis: containerIn,
            yaxis: {
                anchor: 'x',
                domain: [0, 0.45]
            }
        };
        var counterAxes = ['yaxis'];

        handleDefaults(containerIn, containerOut, layout, counterAxes);

        expect(containerOut.rangeselector.x).toEqual(0);
        expect(containerOut.rangeselector.y).toBeCloseTo(0.47);
    });

    it('should use axis and counter axis to determine \'x\' and \'y\' defaults (case multi y)', function() {
        var containerIn = {
            rangeselector: { buttons: [{}] }
        };
        var containerOut = {
            _id: 'x',
            domain: [0.5, 1]
        };
        var layout = {
            xaxis: containerIn,
            yaxis: {
                anchor: 'x',
                domain: [0, 0.25]
            },
            yaxis2: {
                anchor: 'x',
                overlaying: 'y'
            },
            yaxis3: {
                anchor: 'x',
                domain: [0.6, 0.85]
            }
        };
        var counterAxes = ['yaxis', 'yaxis2', 'yaxis3'];

        handleDefaults(containerIn, containerOut, layout, counterAxes);

        expect(containerOut.rangeselector.x).toEqual(0.5);
        expect(containerOut.rangeselector.y).toBeCloseTo(0.87);
    });

    it('should not allow month/year todate with calendars other than Gregorian', function() {
        var containerIn = {
            rangeselector: {
                buttons: [{
                    step: 'year',
                    count: 1,
                    stepmode: 'todate'
                }, {
                    step: 'month',
                    count: 6,
                    stepmode: 'todate'
                }, {
                    step: 'day',
                    count: 1,
                    stepmode: 'todate'
                }, {
                    step: 'hour',
                    count: 1,
                    stepmode: 'todate'
                }]
            }
        };
        var containerOut;
        function getStepmode(button) { return button.stepmode; }

        containerOut = {};
        supply(containerIn, containerOut);

        expect(containerOut.rangeselector.buttons.map(getStepmode)).toEqual([
            'todate', 'todate', 'todate', 'todate'
        ]);

        containerOut = {};
        supply(containerIn, containerOut, 'gregorian');

        expect(containerOut.rangeselector.buttons.map(getStepmode)).toEqual([
            'todate', 'todate', 'todate', 'todate'
        ]);

        containerOut = {};
        supply(containerIn, containerOut, 'chinese');

        expect(containerOut.rangeselector.buttons.map(getStepmode)).toEqual([
            'backward', 'backward', 'todate', 'todate'
        ]);
    });
});

describe('range selector getUpdateObject:', function() {
    'use strict';

    function assertRanges(update, range0, range1) {
        expect(update['xaxis.range[0]']).toEqual(range0);
        expect(update['xaxis.range[1]']).toEqual(range1);
    }

    function setupAxis(opts) {
        var axisOut = Lib.extendFlat({type: 'date'}, opts);
        setConvert(axisOut);
        return axisOut;
    }

    // buttonLayout: {step, stepmode, count}
    // range0out: expected resulting range[0] (input is always '1948-01-01')
    // range1: input range[1], expected to also be the output
    function assertUpdateCase(buttonLayout, range0out, range1) {
        var axisLayout = setupAxis({
            _name: 'xaxis',
            range: ['1948-01-01', range1]
        });

        var update = getUpdateObject(axisLayout, buttonLayout);

        assertRanges(update, range0out, range1);
    }

    it('should return update object (1 month backward case)', function() {
        var buttonLayout = {
            step: 'month',
            stepmode: 'backward',
            count: 1
        };

        assertUpdateCase(buttonLayout, '2015-10-30', '2015-11-30');
        assertUpdateCase(buttonLayout, '2015-10-30 12:34:56', '2015-11-30 12:34:56');
    });

    it('should return update object (3 months backward case)', function() {
        var buttonLayout = {
            step: 'month',
            stepmode: 'backward',
            count: 3
        };

        assertUpdateCase(buttonLayout, '2015-08-30', '2015-11-30');
        assertUpdateCase(buttonLayout, '2015-08-30 12:34:56', '2015-11-30 12:34:56');
    });

    it('should return update object (6 months backward case)', function() {
        var buttonLayout = {
            step: 'month',
            stepmode: 'backward',
            count: 6
        };

        assertUpdateCase(buttonLayout, '2015-05-30', '2015-11-30');
        assertUpdateCase(buttonLayout, '2015-05-30 12:34:56', '2015-11-30 12:34:56');
    });

    it('should return update object (5 months to-date case)', function() {
        var buttonLayout = {
            step: 'month',
            stepmode: 'todate',
            count: 5
        };

        assertUpdateCase(buttonLayout, '2015-07-01', '2015-11-30');
        assertUpdateCase(buttonLayout, '2015-07-01', '2015-12-01');
        assertUpdateCase(buttonLayout, '2015-08-01', '2015-12-01 00:00:01');
    });

    it('should return update object (1 year to-date case)', function() {
        var buttonLayout = {
            step: 'year',
            stepmode: 'todate',
            count: 1
        };

        assertUpdateCase(buttonLayout, '2015-01-01', '2015-11-30');
        assertUpdateCase(buttonLayout, '2015-01-01', '2016-01-01');
        assertUpdateCase(buttonLayout, '2016-01-01', '2016-01-01 00:00:01');
    });

    it('should return update object (10 year to-date case)', function() {
        var buttonLayout = {
            step: 'year',
            stepmode: 'todate',
            count: 10
        };

        assertUpdateCase(buttonLayout, '2006-01-01', '2015-11-30');
        assertUpdateCase(buttonLayout, '2006-01-01', '2016-01-01');
        assertUpdateCase(buttonLayout, '2007-01-01', '2016-01-01 00:00:01');
    });

    it('should return update object (1 year backward case)', function() {
        var buttonLayout = {
            step: 'year',
            stepmode: 'backward',
            count: 1
        };

        assertUpdateCase(buttonLayout, '2014-11-30', '2015-11-30');
        assertUpdateCase(buttonLayout, '2014-11-30 12:34:56', '2015-11-30 12:34:56');
    });

    it('should return update object (reset case)', function() {
        var axisLayout = setupAxis({
            _name: 'xaxis',
            range: ['1948-01-01', '2015-11-30']
        });

        var buttonLayout = {
            step: 'all'
        };

        var update = getUpdateObject(axisLayout, buttonLayout);

        expect(update).toEqual({'xaxis.autorange': true});
    });

    it('should return update object (10 day backward case)', function() {
        var buttonLayout = {
            step: 'day',
            stepmode: 'backward',
            count: 10
        };

        assertUpdateCase(buttonLayout, '2015-11-20', '2015-11-30');
        assertUpdateCase(buttonLayout, '2015-11-20 12:34:56', '2015-11-30 12:34:56');
    });

    it('should return update object (5 hour backward case)', function() {
        var buttonLayout = {
            step: 'hour',
            stepmode: 'backward',
            count: 5
        };

        assertUpdateCase(buttonLayout, '2015-11-29 19:00', '2015-11-30');
        assertUpdateCase(buttonLayout, '2015-11-30 07:34:56', '2015-11-30 12:34:56');
    });

    it('should return update object (15 minute backward case)', function() {
        var buttonLayout = {
            step: 'minute',
            stepmode: 'backward',
            count: 15
        };

        assertUpdateCase(buttonLayout, '2015-11-29 23:45', '2015-11-30');
        assertUpdateCase(buttonLayout, '2015-11-30 12:19:56', '2015-11-30 12:34:56');
    });

    it('should return update object (10 second backward case)', function() {
        var buttonLayout = {
            step: 'second',
            stepmode: 'backward',
            count: 10
        };

        assertUpdateCase(buttonLayout, '2015-11-29 23:59:50', '2015-11-30');
        assertUpdateCase(buttonLayout, '2015-11-30 12:34:46', '2015-11-30 12:34:56');
    });

    it('should return update object (12 hour to-date case)', function() {
        var buttonLayout = {
            step: 'hour',
            stepmode: 'todate',
            count: 12
        };

        assertUpdateCase(buttonLayout, '2015-11-30', '2015-11-30 12');
        assertUpdateCase(buttonLayout, '2015-11-30 01:00', '2015-11-30 12:00:01');
        assertUpdateCase(buttonLayout, '2015-11-30 01:00', '2015-11-30 13');
    });

    it('should return update object (20 minute to-date case)', function() {
        var buttonLayout = {
            step: 'minute',
            stepmode: 'todate',
            count: 20
        };

        assertUpdateCase(buttonLayout, '2015-11-30 12:00', '2015-11-30 12:20');
        assertUpdateCase(buttonLayout, '2015-11-30 12:01', '2015-11-30 12:20:01');
        assertUpdateCase(buttonLayout, '2015-11-30 12:01', '2015-11-30 12:21');
    });

    it('should return update object (2 second to-date case)', function() {
        var buttonLayout = {
            step: 'second',
            stepmode: 'todate',
            count: 2
        };

        assertUpdateCase(buttonLayout, '2015-11-30 12:20', '2015-11-30 12:20:02');
        assertUpdateCase(buttonLayout, '2015-11-30 12:20:01', '2015-11-30 12:20:02.001');
        assertUpdateCase(buttonLayout, '2015-11-30 12:20:01', '2015-11-30 12:20:03');
    });

    it('should return update object with correct axis names', function() {
        var axisLayout = setupAxis({
            _name: 'xaxis5',
            range: ['1948-01-01', '2015-11-30']
        });

        var buttonLayout = {
            step: 'month',
            stepmode: 'backward',
            count: 1
        };

        var update = getUpdateObject(axisLayout, buttonLayout);

        expect(update).toEqual({
            'xaxis5.range[0]': '2015-10-30',
            'xaxis5.range[1]': '2015-11-30'
        });

    });
});

describe('range selector interactions:', function() {
    'use strict';

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

    function checkActiveButton(activeIndex, msg) {
        d3.selectAll('.button').each(function(d, i) {
            expect(d.isActive).toBe(activeIndex === i, msg + ': button #' + i);
        });
    }

    function checkButtonColor(bgColor, activeColor) {
        d3.selectAll('.button').each(function(d) {
            var rect = d3.select(this).select('rect');

            expect(rect.style('fill')).toEqual(
                d.isActive ? activeColor : bgColor
            );
        });
    }

    it('should display the correct nodes', function() {
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

    it('should be able to remove button(s) on `relayout`', function(done) {
        var len = mockCopy.layout.xaxis.rangeselector.buttons.length;

        assertNodeCount('.button', len);

        Plotly.relayout(gd, 'xaxis.rangeselector.buttons[0]', null).then(function() {
            assertNodeCount('.button', len - 1);

            return Plotly.relayout(gd, 'xaxis.rangeselector.buttons[1]', 'remove');
        }).then(function() {
            assertNodeCount('.button', len - 2);

            done();
        });
    });

    it('should be able to change its style on `relayout`', function(done) {
        var prefix = 'xaxis.rangeselector.';

        checkButtonColor('rgb(238, 238, 238)', 'rgb(212, 212, 212)');

        Plotly.relayout(gd, prefix + 'bgcolor', 'red').then(function() {
            checkButtonColor('rgb(255, 0, 0)', 'rgb(255, 128, 128)');

            return Plotly.relayout(gd, prefix + 'activecolor', 'blue');
        }).then(function() {
            checkButtonColor('rgb(255, 0, 0)', 'rgb(0, 0, 255)');

            done();
        });
    });

    it('should update range and active button when clicked', function() {
        var range0 = gd.layout.xaxis.range[0];
        var buttons = d3.selectAll('.button').select('rect');

        checkActiveButton(buttons.size() - 1);

        var pos0 = getRectCenter(buttons[0][0]);
        var posReset = getRectCenter(buttons[0][buttons.size() - 1]);

        mouseEvent('click', pos0[0], pos0[1]);
        expect(gd.layout.xaxis.range[0]).toBeGreaterThan(range0);

        checkActiveButton(0);

        mouseEvent('click', posReset[0], posReset[1]);
        expect(gd.layout.xaxis.range[0]).toEqual(range0);

        checkActiveButton(buttons.size() - 1);
    });

    it('should change color on mouse over', function() {
        var button = d3.select('.button').select('rect');
        var pos = getRectCenter(button.node());

        var fillColor = Color.rgb(gd._fullLayout.xaxis.rangeselector.bgcolor);
        var activeColor = 'rgb(212, 212, 212)';

        expect(button.style('fill')).toEqual(fillColor);

        mouseEvent('mouseover', pos[0], pos[1]);
        expect(button.style('fill')).toEqual(activeColor);

        mouseEvent('mouseout', pos[0], pos[1]);
        expect(button.style('fill')).toEqual(fillColor);
    });

    it('should update is active relayout calls', function(done) {
        var buttons = d3.selectAll('.button').select('rect');

        // 'all' should be active at first
        checkActiveButton(buttons.size() - 1, 'initial');

        var update = {
            'xaxis.range[0]': '2015-10-30',
            'xaxis.range[1]': '2015-11-30'
        };

        Plotly.relayout(gd, update).then(function() {

            // '1m' should be active after the relayout
            checkActiveButton(0, '1m');

            return Plotly.relayout(gd, 'xaxis.autorange', true);
        }).then(function() {

            // 'all' should be after an autoscale
            checkActiveButton(buttons.size() - 1, 'back to all');

            done();
        });
    });
});
