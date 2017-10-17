var Plotly = require('@lib');
var Lib = require('@src/lib');

var Box = require('@src/traces/box');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

describe('Test boxes supplyDefaults', function() {
    var traceIn;
    var traceOut;
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

describe('Test box hover:', function() {
    var gd;

    afterEach(destroyGraphDiv);

    function run(specs) {
        gd = createGraphDiv();

        var fig = Lib.extendDeep(
            {width: 700, height: 500},
            specs.mock || require('@mocks/box_grouped.json')
        );

        if(specs.patch) {
            fig = specs.patch(fig);
        }

        var pos = specs.pos || [200, 200];

        return Plotly.plot(gd, fig).then(function() {
            mouseEvent('mousemove', pos[0], pos[1]);
            assertHoverLabelContent(specs);
        });
    }

    [{
        desc: 'base',
        nums: ['0.55', '0', '0.3', '0.6', '0.7'],
        name: ['radishes', '', '', '', ''],
        axis: 'day 1',

    }, {
        desc: 'with mean',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.boxmean = true;
            });
            return fig;
        },
        nums: ['0.55', '0', '0.3', '0.6', '0.7', '0.45'],
        name: ['radishes', '', '', '', '', ''],
        axis: 'day 1',

    }, {
        desc: 'with sd',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.boxmean = 'sd';
            });
            return fig;
        },
        nums: ['0.55', '0', '0.3', '0.6', '0.7', '0.45 ± 0.2362908'],
        name: ['radishes', '', '', '', '', ''],
        axis: 'day 1',
    }, {
        desc: 'with boxpoints fences',
        mock: require('@mocks/boxplots_outliercolordflt.json'),
        pos: [350, 200],
        nums: ['8.15', '0.75', '6.8', '10.25', '23.25', '5.25', '12'],
        name: ['', '', '', '', '', '', ''],
        axis: 'trace 0',
    }, {
        desc: 'hoveron points | hovermode closest',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.boxpoints = 'all';
                trace.hoveron = 'points';
            });
            fig.layout.hovermode = 'closest';
            return fig;
        },
        nums: ['(day 1, 0.7)', '(day 1, 0.6)', '(day 1, 0.6)'],
        name: ['radishes', 'radishes', 'radishes']
    }, {
        desc: 'hoveron points | hovermode x',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.boxpoints = 'all';
                trace.hoveron = 'points';
            });
            fig.layout.hovermode = 'x';
            return fig;
        },
        nums: ['0', '0.3', '0.5', '0.6', '0.6', '0.7'],
        name: ['radishes', 'radishes', 'radishes', 'radishes', 'radishes', 'radishes'],
        axis: 'day 1'
    }, {
        desc: 'hoveron boxes+points | hovermode x',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.boxpoints = 'all';
                trace.hoveron = 'points+boxes';
            });
            fig.layout.hovermode = 'x';
            return fig;
        },
        nums: [
            '0', '0.7', '0.6', '0.6', '0.5', '0.3', '0', '0.7', '0.6', '0.3', '0.55'
        ],
        name: [
            '', '', '', '', '', '', '', '', '', '', 'radishes'
        ],
        axis: 'day 1'
    }, {
        desc: 'text items on hover',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.boxpoints = 'all';
                trace.hoveron = 'points';
                trace.text = trace.y.map(function(v) { return 'look:' + v; });
            });
            fig.layout.hovermode = 'closest';
            return fig;
        },
        nums: ['(day 1, 0.7)\nlook:0.7', '(day 1, 0.6)\nlook:0.6', '(day 1, 0.6)\nlook:0.6'],
        name: ['radishes', 'radishes', 'radishes']
    }, {
        desc: 'only text items on hover',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.boxpoints = 'all';
                trace.hoveron = 'points';
                trace.text = trace.y.map(function(v) { return 'look:' + v; });
                trace.hoverinfo = 'text';
            });
            fig.layout.hovermode = 'closest';
            return fig;
        },
        nums: ['look:0.7', 'look:0.6', 'look:0.6'],
        name: ['', '', '']
    }].forEach(function(specs) {
        it('should generate correct hover labels ' + specs.desc, function(done) {
            run(specs).catch(fail).then(done);
        });
    });
});
