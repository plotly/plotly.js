var Plotly = require('@lib');
var Lib = require('@src/lib');
var Plots = require('@src/plots/plots');

var Violin = require('@src/traces/violin');

var d3 = require('d3');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');
var mouseEvent = require('../assets/mouse_event');

var customAssertions = require('../assets/custom_assertions');
var assertHoverLabelContent = customAssertions.assertHoverLabelContent;

describe('Test violin defaults', function() {
    var traceOut;

    function _supply(traceIn, layout) {
        traceOut = {};
        Violin.supplyDefaults(traceIn, traceOut, '#444', layout || {});
    }

    it('should set visible to false when x and y are empty', function() {
        _supply({
            x: [],
            y: []
        });

        expect(traceOut.visible).toBe(false);
    });

    it('should inherit layout.calendar', function() {
        _supply({y: [1, 2, 3]}, {calendar: 'islamic'});

        // we always fill calendar attributes, because it's hard to tell if
        // we're on a date axis at this point.
        expect(traceOut.xcalendar).toBe('islamic');
        expect(traceOut.ycalendar).toBe('islamic');
    });

    it('should take its own calendars', function() {
        _supply({
            y: [1, 2, 3],
            xcalendar: 'coptic',
            ycalendar: 'ethiopian'
        }, {
            calendar: 'islamic'
        });

        // we always fill calendar attributes, because it's hard to tell if
        // we're on a date axis at this point.
        expect(traceOut.xcalendar).toBe('coptic');
        expect(traceOut.ycalendar).toBe('ethiopian');
    });

    it('should not coerce point attributes when *points* is false', function() {
        _supply({
            y: [1, 1, 2],
            points: false
        });

        expect(traceOut.points).toBe(false);
        expect(traceOut.jitter).toBeUndefined();
        expect(traceOut.pointpos).toBeUndefined();
        expect(traceOut.marker).toBeUndefined();
        expect(traceOut.text).toBeUndefined();
    });

    it('should default *points* to suspectedoutliers when marker.outliercolor is set & valid', function() {
        _supply({
            y: [1, 1, 2],
            marker: { outliercolor: 'blue' }
        });

        expect(traceOut.points).toBe('suspectedoutliers');
    });

    it('should default *points* to suspectedoutliers when marker.line.outliercolor is set & valid', function() {
        _supply({
            y: [1, 1, 2],
            marker: { line: {outliercolor: 'blue'} }
        });

        expect(traceOut.points).toBe('suspectedoutliers');
        expect(traceOut.marker).toBeDefined();
        expect(traceOut.text).toBeDefined();
    });

    it('should default *spanmode* to manual when *span* is set to an array', function() {
        _supply({
            y: [1, 1, 2],
            span: [0, 1]
        });
        expect(traceOut.span).toEqual([0, 1]);
        expect(traceOut.spanmode).toBe('manual');

        _supply({
            x: [1, 1, 2],
            span: 'not-gonna-work'
        });
        expect(traceOut.span).toBeUndefined();
        expect(traceOut.spanmode).toBe('soft');
    });

    it('should default show* attributes when one of their corresponding style attributes is set & valid', function() {
        _supply({
            y: [1, 2, 1],
            innerboxwidth: 0.1,
            meanlinecolor: 'red'
        });
        expect(traceOut.showinnerbox).toBe(true);
        expect(traceOut.showmeanline).toBe(true);

        _supply({
            y: [1, 2, 1],
            showinnerbox: false,
            showmeanline: false,
            innerboxwidth: 0.1,
            meanlinecolor: 'red'
        });
        expect(traceOut.showinnerbox).toBe(false);
        expect(traceOut.innerboxwidth).toBeUndefined();
        expect(traceOut.showmeanline).toBe(false);
        expect(traceOut.meanlinecolor).toBeUndefined();
    });

    it('should use violin style settings to default inner style attribute', function() {
        _supply({
            y: [1, 2, 1],
            fillcolor: 'red',
            line: {color: 'blue', width: 10},
            showinnerbox: true,
            showmeanline: true,
        });
        expect(traceOut.innerboxfillcolor).toBe('red');
        expect(traceOut.innerboxlinecolor).toBe('blue');
        expect(traceOut.innerboxlinewidth).toBe(10);
        expect(traceOut.meanlinecolor).toBe('blue');
        expect(traceOut.meanlinewidth).toBe(10);
    });
});

describe('Test violin calc:', function() {
    var cd, fullLayout;

    function _calc(attrs, layout) {
        var gd = {
            data: [Lib.extendFlat({type: 'violin'}, attrs)],
            layout: layout || {},
            calcdata: []
        };
        Plots.supplyDefaults(gd);
        Plots.doCalcdata(gd);
        cd = gd.calcdata[0];
        fullLayout = gd._fullLayout;
    }

    it('should compute bandwidth and span based on the sample and *spanmode*', function() {
        var y = [1, 1, 2, 2, 3];

        _calc({y: y});
        expect(cd[0].bandwidth).toBeCloseTo(0.64);
        expect(cd[0].span).toBeCloseToArray([-0.28, 4.28]);

        _calc({
            y: y,
            spanmode: 'hard'
        });
        expect(cd[0].span).toBeCloseToArray([1, 3]);

        _calc({
            y: y,
            span: [0, 0]
        });
        expect(cd[0].span).toBeCloseToArray([-1, 1], 'cleans up invalid range');

        _calc({
            y: y,
            span: [null, 5]
        });
        expect(cd[0].span).toBeCloseToArray([-0.28, 5], 'defaults to soft bound');

        _calc({
            y: y,
            span: [0, null]
        });
        expect(cd[0].span).toBeCloseToArray([0, 4.28], 'defaults to soft bound');
    });

    it('should honor set bandwidth in span calculations', function() {
        var y = [1, 1, 2, 2, 3];
        var bw = 0.1;

        _calc({
            y: y,
            bandwidth: bw
        });
        expect(cd[0].bandwidth).toBeCloseTo(0.1);
        expect(cd[0].span).toBeCloseToArray([0.8, 3.2]);

        _calc({
            y: y,
            bandwidth: bw,
            spanmode: 'hard'
        });
        expect(cd[0].span).toBeCloseToArray([1, 3]);

        _calc({
            y: y,
            bandwidth: bw,
            span: [0, 0]
        });
        expect(cd[0].span).toBeCloseToArray([-1, 1], 'cleans up invalid range');

        _calc({
            y: y,
            bandwidth: bw,
            span: [null, 5]
        });
        expect(cd[0].span).toBeCloseToArray([0.8, 5], 'defaults to soft bound');

        _calc({
            y: y,
            bandwidth: bw,
            span: [0, null]
        });
        expect(cd[0].span).toBeCloseToArray([0, 3.2], 'defaults to soft bound');
    });

    it('should fill in scale-group stats', function() {
        _calc({
            name: 'one',
            y: [0, 0, 0, 0, 10, 10, 10, 10]
        });
        expect(fullLayout._violinScaleGroupStats.one.maxWidth).toBeCloseTo(0.055);
        expect(fullLayout._violinScaleGroupStats.one.maxCount).toBe(8);
    });
});

describe('Test violin hover:', function() {
    var gd;

    afterEach(destroyGraphDiv);

    function run(specs) {
        gd = createGraphDiv();

        var fig = Lib.extendDeep(
            {width: 700, height: 500},
            specs.mock || require('@mocks/violin_grouped.json')
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
        nums: [
            'median: 0.55', 'min: 0', 'q1: 0.3', 'q3: 0.6', 'max: 0.7',
            'y: 0.9266848, kde: 0.182'
        ],
        name: ['radishes', '', '', '', '', ''],
        axis: 'day 1'
    }, {
        desc: 'with mean',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.showmeanline = true;
            });
            return fig;
        },
        nums: [
            'median: 0.55', 'min: 0', 'q1: 0.3', 'q3: 0.6', 'max: 0.7', 'mean: 0.45',
            'y: 0.9266848, kde: 0.182'
        ],
        name: ['radishes', '', '', '', '', '', ''],
        axis: 'day 1'
    }, {
        desc: 'with overlaid violins',
        patch: function(fig) {
            fig.layout.violinmode = 'overlay';
            return fig;
        },
        nums: [
            'q3: 0.6', 'median: 0.45', 'q3: 0.6', 'max: 1', 'y: 0.9266848, kde: 0.383',
            'median: 0.55', 'max: 0.7', 'y: 0.9266848, kde: 0.182',
            'median: 0.45', 'q3: 0.6', 'max: 0.9', 'y: 0.9266848, kde: 0.435',
            'q3: 0.6', 'max: 0.9'
        ],
        name: [
            '', 'kale', '', '', '', 'radishes', '',
            '', 'carrots', '', '', ''
        ],
        axis: 'day 1'
    }, {
        desc: 'hoveron points | hovermode closest',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.points = 'all';
                trace.hoveron = 'points';
            });
            fig.layout.hovermode = 'closest';
            return fig;
        },
        pos: [220, 200],
        nums: '(day 1, 0.9)',
        name: 'carrots'
    }, {
        desc: 'hoveron points | hovermode x',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.points = 'all';
                trace.hoveron = 'points';
            });
            fig.layout.hovermode = 'x';
            return fig;
        },
        pos: [220, 200],
        nums: '0.9',
        name: 'carrots',
        axis: 'day 1'
    }, {
        desc: 'hoveron violins+points | hovermode x (hover on violin only - same result as base)',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.points = 'all';
                trace.hoveron = 'points+violins';
            });
            fig.layout.hovermode = 'x';
            return fig;
        },
        nums: ['median: 0.55', 'min: 0', 'q1: 0.3', 'q3: 0.6', 'max: 0.7'],
        name: ['radishes', '', '', '', ''],
        axis: 'day 1'
    }, {
        desc: 'hoveron violins+points | hovermode x (violin AND closest point)',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.points = 'all';
                trace.hoveron = 'points+violins';
                trace.pointpos = 0;
            });
            fig.layout.hovermode = 'x';
            return fig;
        },
        pos: [207, 240],
        nums: ['0.7', 'median: 0.55', 'min: 0', 'q1: 0.3', 'q3: 0.6', 'max: 0.7'],
        name: ['radishes', 'radishes', '', '', '', ''],
        axis: 'day 1'
    }, {
        desc: 'text items on hover',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.points = 'all';
                trace.hoveron = 'points';
                trace.text = trace.y.map(function(v) { return 'look:' + v; });
            });
            fig.layout.hovermode = 'closest';
            return fig;
        },
        pos: [180, 240],
        nums: '(day 1, 0.7)\nlook:0.7',
        name: 'radishes'
    }, {
        desc: 'only text items on hover',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.points = 'all';
                trace.hoveron = 'points';
                trace.text = trace.y.map(function(v) { return 'look:' + v; });
                trace.hoverinfo = 'text';
            });
            fig.layout.hovermode = 'closest';
            return fig;
        },
        pos: [180, 240],
        nums: 'look:0.7',
        name: ''
    }, {
        desc: 'one-sided violin under hovermode closest',
        // hoveron: 'kde+points'
        // hovermode: 'closest'
        // width: 400
        // height: 700
        mock: require('@mocks/violin_side-by-side.json'),
        pos: [250, 300],
        nums: '(x: 42.43046, kde: 0.083, Saturday)',
        name: ''
    }, {
        desc: 'one-sided violin under hovermode y',
        // hoveron: 'kde+points'
        // width: 400
        // height: 700
        mock: require('@mocks/violin_side-by-side.json'),
        patch: function(fig) {
            fig.layout.hovermode = 'y';
            return fig;
        },
        pos: [250, 300],
        nums: 'x: 42.43046, kde: 0.083',
        name: '',
        axis: 'Saturday'
    }]
    .forEach(function(specs) {
        it('should generate correct hover labels ' + specs.desc, function(done) {
            run(specs).catch(fail).then(done);
        });
    });

    describe('KDE lines inside violin under *kde* hoveron flag', function() {
        var fig;

        beforeEach(function() {
            gd = createGraphDiv();

            fig = Lib.extendDeep({}, require('@mocks/violin_old-faithful.json'), {
                layout: {width: 500, height: 500}
            });
            fig.data[0].points = false;
        });

        function assertViolinHoverLine(pos) {
            var line = d3.select('.hoverlayer').selectAll('line');

            expect(line.size()).toBe(1, 'only one violin line at a time');
            expect(line.attr('class').indexOf('violinline')).toBe(0, 'correct class name');
            expect([
                line.attr('x1'), line.attr('y1'),
                line.attr('x2'), line.attr('y2')
            ]).toBeCloseToArray(pos, 'line position');
        }

        it('should show in two-sided base case', function(done) {
            Plotly.plot(gd, fig).then(function() {
                mouseEvent('mousemove', 250, 250);
                assertViolinHoverLine([299.35, 250, 200.65, 250]);
            })
            .catch(fail)
            .then(done);
        });

        it('should show in one-sided positive case', function(done) {
            fig.data[0].side = 'positive';

            Plotly.plot(gd, fig).then(function() {
                mouseEvent('mousemove', 300, 250);
                assertViolinHoverLine([299.35, 250, 250, 250]);
            })
            .catch(fail)
            .then(done);
        });

        it('should show in one-sided negative case', function(done) {
            fig.data[0].side = 'negative';

            Plotly.plot(gd, fig).then(function() {
                mouseEvent('mousemove', 200, 250);
                assertViolinHoverLine([200.65, 250, 250, 250]);
            })
            .catch(fail)
            .then(done);
        });
    });
});
