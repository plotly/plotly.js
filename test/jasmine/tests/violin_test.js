var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var Plots = require('../../../src/plots/plots');

var Violin = require('../../../src/traces/violin');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var mouseEvent = require('../assets/mouse_event');
var supplyAllDefaults = require('../assets/supply_defaults');

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

    it('should default *.visible attributes when one of their corresponding style attributes is set & valid', function() {
        _supply({
            y: [1, 2, 1],
            box: { width: 0.1 },
            meanline: { color: 'red' }
        });
        expect(traceOut.box.visible).toBe(true);
        expect(traceOut.meanline.visible).toBe(true);

        _supply({
            y: [1, 2, 1],
            box: {
                visible: false,
                width: 0.1
            },
            meanline: {
                visible: false,
                color: 'red'
            }
        });
        expect(traceOut.box).toEqual({visible: false});
        expect(traceOut.meanline).toEqual({visible: false});
    });

    it('should use violin style settings to default inner style attribute', function() {
        _supply({
            y: [1, 2, 1],
            fillcolor: 'red',
            line: {color: 'blue', width: 10},
            box: {visible: true},
            meanline: {visible: true}
        });
        expect(traceOut.box.fillcolor).toBe('red');
        expect(traceOut.box.line.color).toBe('blue');
        expect(traceOut.box.line.width).toBe(10);
        expect(traceOut.meanline.color).toBe('blue');
        expect(traceOut.meanline.width).toBe(10);
    });

    it('should not coerce *scalegroup* and *scalemode* when *width* is set', function() {
        _supply({
            y: [1, 2, 1],
            width: 1
        });
        expect(traceOut.scalemode).toBeUndefined();
        expect(traceOut.scalegroup).toBeUndefined();

        _supply({
            y: [1, 2, 1],
            // width=0 is ignored during calc
            width: 0
        });
        expect(traceOut.scalemode).toBe('width');
        expect(traceOut.scalegroup).toBe('');
    });

    it('should not coerce hovertemplate when *hoveron* does not contains *points* flag', function() {
        var ht = '--- %{y} ---';

        _supply({
            y: [1, 2, 1],
            hoveron: 'points',
            hovertemplate: ht
        });
        expect(traceOut.hovertemplate).toBe(ht, 'hoveron:points');

        _supply({
            y: [1, 2, 1],
            hoveron: 'kde',
            hovertemplate: ht
        });
        expect(traceOut.hovertemplate).toBe(undefined, 'hoveron:kde');

        _supply({
            y: [1, 2, 1],
            hoveron: 'all',
            hovertemplate: ht
        });
        expect(traceOut.hovertemplate).toBe(ht, 'hoveron:all');

        _supply({
            y: [1, 2, 1],
            hoveron: 'violins+points',
            hovertemplate: ht
        });
        expect(traceOut.hovertemplate).toBe(ht, 'hoveron:violins+points');
    });

    it('should not include alignementgroup/offsetgroup when violinmode is not *group*', function() {
        var gd = {
            data: [{type: 'violin', y: [1], alignmentgroup: 'a', offsetgroup: '1'}],
            layout: {violinmode: 'group'}
        };

        supplyAllDefaults(gd);
        expect(gd._fullData[0].alignmentgroup).toBe('a', 'alignementgroup');
        expect(gd._fullData[0].offsetgroup).toBe('1', 'offsetgroup');

        gd.layout.violinmode = 'overlay';
        supplyAllDefaults(gd);
        expect(gd._fullData[0].alignmentgroup).toBe(undefined, 'alignementgroup');
        expect(gd._fullData[0].offsetgroup).toBe(undefined, 'offsetgroup');
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
        supplyAllDefaults(gd);
        Plots.doCalcdata(gd);
        cd = gd.calcdata[0];
        fullLayout = gd._fullLayout;
        return cd;
    }

    it('should compute q1/q3 depending on *quartilemethod*', function() {
        // samples from https://en.wikipedia.org/wiki/Quartile
        var specs = {
            // N is odd and is spanned by (4n+3)
            odd: {
                sample: [6, 7, 15, 36, 39, 40, 41, 42, 43, 47, 49],
                methods: {
                    linear: {q1: 20.25, q3: 42.75},
                    exclusive: {q1: 15, q3: 43},
                    inclusive: {q1: 25.5, q3: 42.5}
                }
            },
            // N is odd and is spanned by (4n+1)
            odd2: {
                sample: [6, 15, 36, 39, 40, 42, 43, 47, 49],
                methods: {
                    linear: {q1: 30.75, q3: 44},
                    exclusive: {q1: 25.5, q3: 45},
                    inclusive: {q1: 36, q3: 43}
                }
            },
            // N is even
            even: {
                sample: [7, 15, 36, 39, 40, 41],
                methods: {
                    linear: {q1: 15, q3: 40},
                    exclusive: {q1: 15, q3: 40},
                    inclusive: {q1: 15, q3: 40}
                }
            },
            // samples from http://jse.amstat.org/v14n3/langford.html
            s4: {
                sample: [1, 2, 3, 4],
                methods: {
                    linear: {q1: 1.5, q3: 3.5},
                    exclusive: {q1: 1.5, q3: 3.5},
                    inclusive: {q1: 1.5, q3: 3.5}
                }
            },
            s5: {
                sample: [1, 2, 3, 4, 5],
                methods: {
                    linear: {q1: 1.75, q3: 4.25},
                    exclusive: {q1: 1.5, q3: 4.5},
                    inclusive: {q1: 2, q3: 4}
                }
            },
            s6: {
                sample: [1, 2, 3, 4, 5, 6],
                methods: {
                    linear: {q1: 2, q3: 5},
                    exclusive: {q1: 2, q3: 5},
                    inclusive: {q1: 2, q3: 5}
                }
            },
            s7: {
                sample: [1, 2, 3, 4, 5, 6, 7],
                methods: {
                    linear: {q1: 2.25, q3: 5.75},
                    exclusive: {q1: 2, q3: 6},
                    inclusive: {q1: 2.5, q3: 5.5}
                }
            }
        };

        for(var name in specs) {
            var spec = specs[name];

            for(var m in spec.methods) {
                var cd = _calc({y: spec.sample, quartilemethod: m});
                expect(cd[0].q1).toBe(spec.methods[m].q1, ['q1', m, name].join(' | '));
                expect(cd[0].q3).toBe(spec.methods[m].q3, ['q3', m, name].join(' | '));
            }
        }
    });

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
        expect(fullLayout._violinScaleGroupStats.one.maxKDE).toBeCloseTo(0.055);
        expect(fullLayout._violinScaleGroupStats.one.maxCount).toBe(8);
    });

    it('handle multi-box / single-value case', function() {
        _calc({
            x: [1, 2, 3, 4, 5, 6],
            y: [1, 2, 3, 4, 5, 6]
        });

        expect(cd.length).toBe(6, '# of violins');
        expect(cd.every(function(d) { return d.bandwidth; })).toBe(false, 'bandwidth');
    });

    it('handle multi-value / single-but-unique-value case', function() {
        _calc({
            y: [1, 1, 1, 1, 1]
        });

        expect(cd.length).toBe(1, '# of violins');
        expect(cd[0].bandwidth).toBe(0, 'bandwidth');
    });
});

describe('Test violin hover:', function() {
    var gd;

    afterEach(destroyGraphDiv);

    function run(specs) {
        gd = createGraphDiv();

        var fig = Lib.extendDeep(
            {width: 700, height: 500},
            specs.mock || require('../../image/mocks/violin_grouped.json')
        );

        if(specs.patch) {
            fig = specs.patch(fig);
        }

        var pos = specs.pos || [200, 200];

        return Plotly.newPlot(gd, fig).then(function() {
            mouseEvent('mousemove', pos[0], pos[1]);
            assertHoverLabelContent(specs);

            if(specs.hoverLabelPos) {
                d3SelectAll('g.hovertext').each(function(_, i) {
                    var bbox = this.getBoundingClientRect();
                    expect([bbox.bottom, bbox.top])
                        .toBeWithinArray(specs.hoverLabelPos[i], 10, 'bottom--top hover label ' + i);
                });
            }
        });
    }

    [{
        desc: 'base',
        patch: function(fig) {
            fig.layout.hovermode = 'x';
            return fig;
        },
        nums: [
            'median: 0.55', 'min: 0', 'lower fence: 0', 'q1: 0.3', 'q3: 0.6', 'upper fence: 0.7', 'max: 0.7',
            'y: 0.9266848, kde: 0.182'
        ],
        name: ['radishes', '', '', '', '', '', '', ''],
        axis: 'day 1'
    }, {
        desc: 'with mean',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.meanline = {visible: true};
            });
            fig.layout.hovermode = 'x';
            return fig;
        },
        nums: [
            'median: 0.55', 'min: 0', 'lower fence: 0', 'q1: 0.3', 'q3: 0.6', 'upper fence: 0.7', 'max: 0.7', 'mean: 0.45',
            'y: 0.9266848, kde: 0.182'
        ],
        name: ['radishes', '', '', '', '', '', '', '', ''],
        axis: 'day 1'
    }, {
        desc: 'with overlaid violins',
        patch: function(fig) {
            fig.layout.violinmode = 'overlay';
            fig.layout.hovermode = 'x';
            fig.layout.height = 700;

            return fig;
        },
        nums: [
            'median: 0.45', 'median: 0.45', 'median: 0.55',
            'min: 0', 'min: 0.1', 'min: 0.2',
            'lower fence: 0', 'lower fence: 0.1', 'lower fence: 0.2',
            'q1: 0.1', 'q1: 0.2', 'q1: 0.3',
            'q3: 0.6', 'q3: 0.6', 'q3: 0.6',
            'upper fence: 0.7', 'upper fence: 0.9', 'upper fence: 1',
            'max: 0.7', 'max: 0.9', 'max: 1',
            'y: 1.211363, kde: 0.119',
            'y: 1.211363, kde: 0.168'
        ],
        name: [
            'carrots', 'kale', 'radishes',
            '', '', '',
            '', '', '',
            '', '', '',
            '', '', '',
            '', '', '',
            '', '', '',
            '',
            '',
        ],
        axis: 'day 1'
    }, {
        desc: 'hoveron points | hovermode closest',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.points = 'all';
                trace.hoveron = 'points';
            });
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
        nums: ['median: 0.55', 'min: 0', 'lower fence: 0', 'q1: 0.3', 'q3: 0.6', 'upper fence: 0.7', 'max: 0.7'],
        name: ['radishes', '', '', '', '', '', ''],
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
        nums: ['0.7', 'median: 0.55', 'min: 0', 'lower fence: 0', 'q1: 0.3', 'q3: 0.6', 'upper fence: 0.7', 'max: 0.7'],
        name: ['radishes', 'radishes', '', '', '', '', '', ''],
        axis: 'day 1'
    }, {
        desc: 'text items on hover',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.points = 'all';
                trace.hoveron = 'points';
                trace.text = trace.y.map(function(v) { return 'look:' + v; });
            });
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
            return fig;
        },
        pos: [180, 240],
        nums: 'look:0.7',
        name: ''
    }, {
        desc: 'only hovertext items on hover',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.points = 'all';
                trace.hoveron = 'points';
                trace.hovertext = trace.y.map(function(v) { return 'look:' + v; });
                trace.text = trace.y.map(function(v) { return 'NOT THIS:' + v; });
                trace.hoverinfo = 'text';
            });
            return fig;
        },
        pos: [180, 240],
        nums: 'look:0.7',
        name: ''
    }, {
        desc: 'one-sided violin under hovermode closest',
        // hoveron: 'kde+points'
        // width: 400
        // height: 700
        mock: require('../../image/mocks/violin_side-by-side.json'),
        pos: [250, 300],
        nums: '(x: 42.43046, kde: 0.083, Saturday)',
        name: ''
    }, {
        desc: 'one-sided violin under hovermode y',
        // hoveron: 'kde+points'
        // width: 400
        // height: 700
        mock: require('../../image/mocks/violin_side-by-side.json'),
        patch: function(fig) {
            fig.layout.hovermode = 'y';
            return fig;
        },
        pos: [250, 300],
        nums: 'x: 42.43046, kde: 0.083',
        name: '',
        axis: 'Saturday'
    }, {
        desc: 'one-sided violin under hovermode y (ridgeplot case)',
        mock: require('../../image/mocks/violin_ridgeplot.json'),
        patch: function(fig) {
            fig.data.forEach(function(t) { t.hoveron = 'violins'; });
            fig.layout.hovermode = 'y';
            return fig;
        },
        nums: [
            'max: 50.81', 'min: 3.07', 'median: 18.24',
            'q1: 13.8575', 'q3: 24.975', 'upper fence: 39.42', 'lower fence: 3.07'
        ],
        name: ['', '', '', '', '', '', ''],
        axis: 'Sat',
        hoverLabelPos: [
            [338, 270],
            [377, 270],
            [351, 270],
            [363, 270],
            [345, 270],
            [385, 270],
            [347, 270]
        ]
    }, {
        desc: 'single horizontal violin',
        mock: require('../../image/mocks/violin_non-linear.json'),
        patch: function(fig) {
            fig.layout.hovermode = 'y';
            return fig;
        },
        pos: [310, 160],
        nums: ['median: C', 'min: A', 'q1: B', 'q3: D', 'max: G', 'upper fence: D', 'lower fence: A', 'x: C, kde: 1.005'],
        name: ['categories', '', '', '', '', '', '', ''],
        axis: 'categories',
        isRotated: true
    }, {
        desc: 'multiple horizontal violins',
        mock: require('../../image/mocks/box_grouped_horz.json'),
        patch: function(fig) {
            fig.data.forEach(function(t) {
                t.type = 'violin';
                t.hoveron = 'violins';
            });
            fig.layout.violinmode = 'group';
            fig.layout.hovermode = 'y';
            return fig;
        },
        nums: ['median: 0.4', 'min: 0.1', 'lower fence: 0.1', 'q1: 0.2', 'q3: 0.7', 'upper fence: 0.9', 'max: 0.9'],
        name: ['kale', '', '', '', '', '', ''],
        axis: 'day 2',
        isRotated: true
    }, {
        desc: 'multiple horizontal violins (under hovermode:closest)',
        mock: require('../../image/mocks/box_grouped_horz.json'),
        patch: function(fig) {
            fig.data.forEach(function(t) {
                t.type = 'violin';
                t.hoveron = 'violins';
            });
            fig.layout.violinmode = 'group';
            return fig;
        },
        pos: [200, 175],
        nums: [
            '(median: 0.7, day 2)', '(min: 0.2, day 2)', '(lower fence: 0.2, day 2)', '(q1: 0.5, day 2)',
            '(q3: 0.8, day 2)', '(upper fence: 0.9, day 2)', '(max: 0.9, day 2)'
        ],
        name: ['radishes', '', '', '', '', '', ''],
        isRotated: true
    }, {
        desc: 'hovering over single pt on horizontal violin should not rotate labels',
        mock: require('../../image/mocks/violin_old-faithful.json'),
        patch: function(fig) {
            fig.data[0].x = fig.data[0].y;
            delete fig.data[0].y;
            fig.layout = {
                yaxis: {range: [-0.696, 0.5]}
            };
            return fig;
        },
        pos: [539, 293],
        nums: '(96, Old Faithful)',
        name: '',
        isRotated: false
    }, {
        desc: 'orientation:h | hovermode:y',
        mock: require('../../image/mocks/violin_grouped_horz-multicategory.json'),
        patch: function(fig) {
            // don't hover on kde, to avoid local vs CI discrepancies
            fig.data.forEach(function(t) {
                t.hoveron = 'violins';
            });
            fig.layout.hovermode = 'y';
            return fig;
        },
        pos: [430, 130],
        nums: ['upper fence: 0.9', 'lower fence: 0.1', 'max: 0.9', 'min: 0.1', 'q1: 0.2', 'q3: 0.7', 'median: 0.4'],
        name: ['', '', '', '', '', '', 'kale'],
        axis: '2018 - day 2',
    }, {
        desc: 'orientation:h | hovermode:closest',
        mock: require('../../image/mocks/violin_grouped_horz-multicategory.json'),
        patch: function(fig) {
            // don't hover on kde, to avoid local vs CI discrepancies
            fig.data.forEach(function(t) {
                t.hoveron = 'violins';
            });
            return fig;
        },
        pos: [430, 130],
        nums: [
            '(upper fence: 0.9, 2018 - day 2)', '(lower fence: 0.1, 2018 - day 2)',
            '(max: 0.9, 2018 - day 2)', '(min: 0.1, 2018 - day 2)',
            '(q1: 0.2, 2018 - day 2)', '(q3: 0.7, 2018 - day 2)',
            '(median: 0.4, 2018 - day 2)'
        ],
        name: ['', '', '', '', '', '', 'kale']
    }, {
        desc: 'on points with numeric positions | orientation:h | hovermode:closest',
        mock: {
            data: [{
                type: 'violin',
                points: 'all',
                jitter: 0,
                orientation: 'h',
                y: [2, 2, 2, 2, 2],
                x: [13.1, 14.2, 14, 13, 13.3]
            }]
        },
        pos: [417, 309],
        nums: '(14, 2)',
        name: ''
    }, {
        desc: 'with hovertemplate for points',
        patch: function(fig) {
            fig.data.forEach(function(trace) {
                trace.points = 'all';
                trace.hoveron = 'points';
                trace.hovertemplate = 'Sample pt %{pointNumber}: %{y:.3f}<extra></extra>';
            });
            return fig;
        },
        pos: [220, 200],
        nums: 'Sample pt 3: 0.900',
        name: ''
    }]
    .forEach(function(specs) {
        it('should generate correct hover labels ' + specs.desc, function(done) {
            run(specs).then(done, done.fail);
        });
    });

    describe('KDE lines inside violin under *kde* hoveron flag', function() {
        var fig;

        beforeEach(function() {
            gd = createGraphDiv();

            fig = Lib.extendDeep({}, require('../../image/mocks/violin_old-faithful.json'), {
                layout: {width: 500, height: 500}
            });
            fig.data[0].points = false;
        });

        function assertViolinHoverLine(pos) {
            var line = d3Select('.hoverlayer').selectAll('line');

            expect(line.size()).toBe(1, 'only one violin line at a time');
            expect(line.attr('class').indexOf('violinline')).toBe(0, 'correct class name');
            expect([
                line.attr('x1'), line.attr('y1'),
                line.attr('x2'), line.attr('y2')
            ]).toBeCloseToArray(pos, 'line position');
        }

        it('should show in two-sided base case', function(done) {
            Plotly.newPlot(gd, fig).then(function() {
                mouseEvent('mousemove', 250, 250);
                assertViolinHoverLine([299.35, 250, 200.65, 250]);
            })
            .then(done, done.fail);
        });

        it('should show in one-sided positive case', function(done) {
            fig.data[0].side = 'positive';

            Plotly.newPlot(gd, fig).then(function() {
                mouseEvent('mousemove', 300, 250);
                assertViolinHoverLine([277.3609, 250, 80, 250]);
            })
            .then(done, done.fail);
        });

        it('should show in one-sided negative case', function(done) {
            fig.data[0].side = 'negative';

            Plotly.newPlot(gd, fig).then(function() {
                mouseEvent('mousemove', 200, 250);
                assertViolinHoverLine([222.6391, 250, 420, 250]);
            })
            .then(done, done.fail);
        });
    });

    it('labels should avoid overlaps', function(done) {
        gd = createGraphDiv();

        var fig = Lib.extendDeep({}, require('../../image/mocks/violin_zoomed-in.json'));
        fig.layout.width = 700;
        fig.layout.height = 450;

        Plotly.newPlot(gd, fig)
        .then(function() {
            mouseEvent('mousemove', 350, 225);

            var actual = [];
            d3SelectAll('g.hovertext').each(function() {
                var bbox = this.getBoundingClientRect();
                var tx = d3Select(this).text();
                actual.push([tx, bbox]);
            });

            actual = actual.sort(function(a, b) { return a[1].top - b[1].top; });

            expect(actual.length).toBe(9, '# of value hover labels');

            for(var i = 0; i < actual.length - 1; i++) {
                var a = actual[i];
                var b = actual[i + 1];
                if(b[1].top < a[1].bottom) {
                    fail('Labels ' + a[0] + ' and ' + b[1] + ' overlap.');
                }
            }
        })
        .then(done, done.fail);
    });
});

describe('Test violin restyle:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should be able to add/remove innner parts', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/violin_old-faithful.json'));
        // start with just 1 violin
        delete fig.data[0].meanline;
        delete fig.data[0].points;

        function _assertOne(msg, exp, trace3, k, query) {
            expect(trace3.selectAll(query).size())
                .toBe(exp[k] || 0, k + ' - ' + msg);
        }

        function _assert(msg, exp) {
            var trace3 = d3Select(gd).select('.violinlayer > .trace');
            _assertOne(msg, exp, trace3, 'violinCnt', 'path.violin');
            _assertOne(msg, exp, trace3, 'boxCnt', 'path.box');
            _assertOne(msg, exp, trace3, 'meanlineInBoxCnt', 'path.mean');
            _assertOne(msg, exp, trace3, 'meanlineOutOfBoxCnt', 'path.meanline');
            _assertOne(msg, exp, trace3, 'ptsCnt', 'path.point');
        }

        Plotly.newPlot(gd, fig)
        .then(function() {
            _assert('base', {violinCnt: 1});
        })
        .then(function() { return Plotly.restyle(gd, 'box.visible', true); })
        .then(function() {
            _assert('with inner box', {violinCnt: 1, boxCnt: 1});
        })
        .then(function() { return Plotly.restyle(gd, 'meanline.visible', true); })
        .then(function() {
            _assert('with inner box & meanline', {violinCnt: 1, boxCnt: 1, meanlineInBoxCnt: 1});
        })
        .then(function() { return Plotly.restyle(gd, 'box.visible', false); })
        .then(function() {
            _assert('with meanline', {violinCnt: 1, meanlineOutOfBoxCnt: 1});
        })
        .then(function() { return Plotly.restyle(gd, 'points', 'all'); })
        .then(function() {
            _assert('with meanline & pts', {violinCnt: 1, meanlineOutOfBoxCnt: 1, ptsCnt: 272});
        })
        .then(function() { return Plotly.restyle(gd, 'meanline.visible', false); })
        .then(function() {
            _assert('with pts', {violinCnt: 1, ptsCnt: 272});
        })
        .then(done, done.fail);
    });
});
