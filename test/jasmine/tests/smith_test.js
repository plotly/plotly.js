var Plotly = require('@lib/index');
var constants = require('@src/plots/smith/constants');
var Smith = require('@src/plots/smith');
var Lib = require('@src/lib');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;

var destroyGraphDiv = require('../assets/destroy_graph_div');
var createGraphDiv = require('../assets/create_graph_div');

var mouseEvent = require('../assets/mouse_event');

describe('Test smith plot defaults:', function() {
    var layoutOut;

    function _supply(layoutIn, fullData) {
        fullData = fullData || [{
            type: 'scattersmith',
            r: [],
            theta: [],
            subplot: 'smith'
        }];

        layoutOut = {
            autotypenumbers: 'convert types',
            font: {color: 'red'},
            _subplots: {smith: ['smith']}
        };

        Smith.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
    }

    it('should contain correct default top level values', function() {
        _supply({
            smith: {}
        });

        var smith = layoutOut.smith;

        expect(smith.domain.x).toEqual([0, 1]);
        expect(smith.domain.y).toEqual([0, 1]);
        expect(smith.bgcolor).toBe('#fff');
    });

    it('should contain correct defaults for the axes', function() {
        _supply({
            smith: {}
        });

        var imag = layoutOut.smith.imaginaryaxis;
        var real = layoutOut.smith.realaxis;

        expect(imag.type).toBe('linear');
        expect(real.type).toBe('linear');
    });

    it('should propagate axis *color* settings', function() {
        _supply({
            smith: {
                imaginaryaxis: {color: 'red'},
                realaxis: {color: 'blue'}
            }
        });

        expect(layoutOut.smith.imaginaryaxis.linecolor).toBe('red');
        expect(layoutOut.smith.imaginaryaxis.gridcolor).toBe('rgb(255, 153, 153)', 'blend by 60% with bgcolor');

        expect(layoutOut.smith.realaxis.title.font.color).toBe('blue');
        expect(layoutOut.smith.realaxis.linecolor).toBe('blue');
        expect(layoutOut.smith.realaxis.gridcolor).toBe('rgb(153, 153, 255)', 'blend by 60% with bgcolor');
    });

    it('should coerce hoverformat even for `visible: false` axes', function() {
        _supply({
            smith: {
                realaxis: {
                    visible: false,
                    hoverformat: 'g'
                },
                imaginaryaxis: {
                    visible: false,
                    hoverformat: 'g'
                }
            }
        }, [{
            type: 'scattersmith',
            re: [1, 2],
            im: [90, 180],
            visible: true,
            subplot: 'smith'
        }]);

        expect(layoutOut.smith.realaxis.hoverformat).toBe('g');
        expect(layoutOut.smith.imaginaryaxis.hoverformat).toBe('g');
    });
});

describe('Test relayout on smith subplots:', function() {
    afterEach(destroyGraphDiv);

    it('should be able to reorder axis layers when relayout\'ing *layer*', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('@mocks/zzz_smith_axes.json'));
        var dflt = constants.layerNames;

        function _assert(expected) {
            var actual = d3SelectAll('g.smith > .smithsublayer');

            expect(actual.size()).toBe(expected.length, '# of layer');

            actual.each(function(d, i) {
                var className = d3Select(this)
                    .attr('class')
                    .split('smithsublayer ')[1];

                expect(className).toBe(expected[i], 'layer ' + i);
            });
        }

        Plotly.newPlot(gd, fig).then(function() {
            _assert(dflt);
            return Plotly.relayout(gd, 'smith.realaxis.layer', 'below traces');
        })
        .then(function() {
            _assert([
                'draglayer', 'plotbg', 'angular-grid', 'radial-grid',
                'radial-line', 'radial-axis',
                'frontplot',
                'angular-line', 'angular-axis'
            ]);
            return Plotly.relayout(gd, 'smith.imaginaryaxis.layer', 'below traces');
        })
        .then(function() {
            _assert([
                'draglayer', 'plotbg', 'angular-grid', 'radial-grid',
                'angular-line',
                'radial-line',
                'angular-axis',
                'radial-axis',
                'frontplot'
            ]);
            return Plotly.relayout(gd, 'smith.realaxis.layer', 'above traces');
        })
        .then(function() {
            _assert([
                'draglayer', 'plotbg', 'angular-grid', 'radial-grid',
                'angular-line', 'angular-axis',
                'frontplot',
                'radial-line', 'radial-axis'
            ]);
            return Plotly.relayout(gd, 'smith.imaginaryaxis.layer', null);
        })
        .then(function() {
            _assert(dflt);
        })
        .then(done, done.fail);
    });

    it('should be able to toggle axis features', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('@mocks/zzz_smith_single.json'));

        function assertCnt(selector, expected, msg) {
            var sel = d3Select(gd).selectAll(selector);
            expect(sel.size()).toBe(expected, msg);
        }

        function assertDisplay(selector, expected, msg) {
            var sel = d3Select(gd).select(selector);

            if(!sel.size()) fail(selector + ' not found');

            sel.each(function() {
                expect(d3Select(this).attr('display')).toBe(expected, msg);
            });
        }

        function toggle(astr, vals, exps, selector, fn) {
            return function() {
                return Plotly.relayout(gd, astr, vals[0]).then(function() {
                    fn(selector, exps[0], astr + ' ' + vals[0]);
                    return Plotly.relayout(gd, astr, vals[1]);
                })
                .then(function() {
                    fn(selector, exps[1], astr + ' ' + vals[1]);
                    return Plotly.relayout(gd, astr, vals[0]);
                })
                .then(function() {
                    fn(selector, exps[0], astr + ' ' + vals[0]);
                });
            };
        }

        Plotly.newPlot(gd, fig)
        .then(toggle(
            'smith.realaxis.showline',
            [true, false], [null, 'none'],
            '.radial-line > line', assertDisplay
        ))
        .then(toggle(
            'smith.realaxis.showgrid',
            [true, false], [null, 'none'],
            '.radial-grid', assertDisplay
        ))
        .then(toggle(
            'smith.realaxis.showticklabels',
            [true, false], [5, 0],
            '.radial-axis > .realaxis2tick > text', assertCnt
        ))
        .then(toggle(
            'smith.imaginaryaxis.showline',
            [true, false], [null, 'none'],
            '.angular-line > path', assertDisplay
        ))
        .then(toggle(
            'smith.imaginaryaxis.showgrid',
            [true, false], [10, 0],
            '.angular-grid > path', assertCnt
        ))
        .then(toggle(
            'smith.imaginaryaxis.showticklabels',
            [true, false], [12, 0],
            '.angular-axis > .imaginaryaxistick > text', assertCnt
        ))
        .then(done, done.fail);
    });

    it('should clean up its framework, clip paths and info layers when getting deleted', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('@mocks/zzz_smith_fill.json'));
        var traces = Lib.extendDeep([], fig.data);
        var inds = traces.map(function(_, i) { return i; });

        function _assert(exp) {
            expect(d3SelectAll('g.smith').size()).toBe(exp.subplot, '# subplot layer');
            expect(d3SelectAll('g.g-smithtitle').size()).toBe(exp.rtitle, '# radial title');

            var clipCnt = 0;
            d3SelectAll('clipPath').each(function() {
                if(/smith-for-traces/.test(this.id)) clipCnt++;
            });
            expect(clipCnt).toBe(exp.clip, '# clip paths');
        }

        Plotly.newPlot(gd, fig).then(function() {
            _assert({subplot: 1, clip: 1, rtitle: 1});

            return Plotly.deleteTraces(gd, inds);
        })
        .then(function() {
            _assert({subplot: 0, clip: 0, rtitle: 0});

            return Plotly.addTraces(gd, traces);
        })
        .then(function() {
            _assert({subplot: 1, clip: 1, rtitle: 1});
        })
        .then(done, done.fail);
    });
});

describe('Test smith interactions:', function() {
    var gd;
    var eventData;
    var eventCnts;

    var eventNames = [
        'plotly_hover', 'plotly_unhover',
        'plotly_click', 'plotly_doubleclick',
        'plotly_relayout'
    ];

    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        eventData = '';
        eventCnts = {};
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function _plot(fig) {
        return Plotly.newPlot(gd, fig).then(function() {
            eventNames.forEach(function(k) {
                eventCnts[k] = 0;
                gd.on(k, function(d) {
                    eventData = d;
                    eventCnts[k]++;
                    Lib.clearThrottle();
                });
            });
        });
    }

    function assertEventPointData(expected, msg) {
        var actual = eventData.points || [];

        expect(actual.length)
            .toBe(expected.length, msg + ' same number of pts');

        expected.forEach(function(e, i) {
            var a = actual[i];
            var m = msg + ' (pt ' + i + ')';

            for(var k in e) {
                expect(a[k]).toBeCloseTo(e[k], 1, m + ' ' + k);
            }
        });
    }

    function assertEventCnt(expected, msg) {
        eventNames.forEach(function(k) {
            var m = msg + ' event cnt for ' + k;

            if(k in expected) {
                expect(eventCnts[k]).toBe(expected[k], m);
            } else {
                expect(eventCnts[k]).toBe(0, m);
            }
        });
    }

    function _hover(pos) {
        eventData = '';
        mouseEvent('mousemove', pos[0], pos[1]);
    }

    function _unhover(pos) {
        eventData = '';
        mouseEvent('mouseout', pos[0], pos[1]);
    }

    it('should trigger hover/unhover/click/doubleclick events', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/zzz_smith_axes.json'));
        var ptPos = [159, 138];
        var blankPos = [109, 109];
        var marginPos = [20, 20];

        function _assert(ptExpectation, cntExpecation, msg) {
            if(Array.isArray(ptExpectation)) {
                assertEventPointData(ptExpectation, msg);
            } else {
                expect(eventData).toBe(ptExpectation, msg);
            }
            assertEventCnt(cntExpecation, msg);
        }

        _plot(fig)
        .then(function() { _hover(ptPos); })
        .then(function() {
            _assert([{
                re: 0.5,
                im: 0.5
            }], {
                plotly_hover: 1
            }, 'after hover on pt');
        })
        .then(function() { _unhover(blankPos);})
        .then(function() {
            _assert([{
                re: 0.5,
                im: 0.5
            }], {
                plotly_hover: 1,
                plotly_unhover: 1
            }, 'after unhover off pt');
        })
        .then(function() { _hover(marginPos);})
        .then(function() {
            _assert('', {
                plotly_hover: 1,
                plotly_unhover: 1,
            }, 'after hovering in margin');
        })
        .then(done, done.fail);
    });
});
