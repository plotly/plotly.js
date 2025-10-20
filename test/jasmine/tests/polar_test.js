var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var Polar = require('../../../src/plots/polar');
var constants = require('../../../src/plots/polar/constants');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var negateIf = require('../assets/negate_if');
var mouseEvent = require('../assets/mouse_event');
var click = require('../assets/click');
var doubleClick = require('../assets/double_click');
var drag = require('../assets/drag');
var delay = require('../assets/delay');

var customAssertions = require('../assets/custom_assertions');
var assertNodeDisplay = customAssertions.assertNodeDisplay;

describe('Test polar plots defaults:', function() {
    var layoutOut;

    function _supply(layoutIn, fullData) {
        fullData = fullData || [{
            type: 'scatterpolar',
            r: [],
            theta: [],
            subplot: 'polar'
        }];

        layoutOut = {
            autotypenumbers: 'convert types',
            font: {color: 'red'},
            _subplots: {polar: ['polar']}
        };

        Polar.supplyLayoutDefaults(layoutIn, layoutOut, fullData);
    }

    it('should default *radialaxis.angle* to first sector angle', function() {
        _supply({
            polar: {
                sector: [45, 135]
            }
        });
        expect(layoutOut.polar.radialaxis.angle).toBe(45);
    });

    it('should coerce *angularaxis.thetaunit* only for linear angular axes', function() {
        _supply({
            polar: {
                angularaxis: {thetaunit: 'radians'}
            }
        });
        expect(layoutOut.polar.angularaxis.thetaunit).toBe('radians');

        _supply({
            polar: {
                angularaxis: {
                    type: 'category',
                    thetaunit: 'radians'
                }
            }
        });
        expect(layoutOut.polar.angularaxis.thetaunit).toBeUndefined();
    });

    it('should not try to autotype visible false traces', function() {
        _supply({
            polar: {}
        }, [{
            type: 'scatterpolar',
            visible: false,
            r: ['2017-01-20', '2017-02-10', '2017-03-03'],
            theta: ['a', 'b', 'c'],
            subplot: 'polar'
        }]);

        expect(layoutOut.polar.radialaxis.type).toBe('linear', 'not date');
        expect(layoutOut.polar.angularaxis.type).toBe('linear', 'not category');
    });

    it('should propagate axis *color* settings', function() {
        _supply({
            polar: {
                angularaxis: {color: 'red'},
                radialaxis: {color: 'blue'}
            }
        });

        expect(layoutOut.polar.angularaxis.linecolor).toBe('red');
        expect(layoutOut.polar.angularaxis.gridcolor).toBe('rgb(255, 153, 153)', 'blend by 60% with bgcolor');

        expect(layoutOut.polar.radialaxis.title.font.color).toBe('blue');
        expect(layoutOut.polar.radialaxis.linecolor).toBe('blue');
        expect(layoutOut.polar.radialaxis.gridcolor).toBe('rgb(153, 153, 255)', 'blend by 60% with bgcolor');
    });

    it('should default *rotation* to 90 when clockwise *direction*', function() {
        _supply({
            polar: {}
        });

        expect(layoutOut.polar.angularaxis.direction).toBe('counterclockwise');
        expect(layoutOut.polar.angularaxis.rotation).toBe(0);

        _supply({
            polar: {
                angularaxis: {direction: 'clockwise'}
            }
        });

        expect(layoutOut.polar.angularaxis.direction).toBe('clockwise');
        expect(layoutOut.polar.angularaxis.rotation).toBe(90);
    });

    it('(for now) should log message when detecting *date* angular axes and fallback to *linear*', function() {
        spyOn(Lib, 'log');

        _supply({}, [{
            type: 'scatterpolar',
            r: [1, 2],
            theta: ['2017-01-01', '2018-01-01'],
            visible: true,
            subplot: 'polar'
        }]);

        expect(Lib.log).toHaveBeenCalledWith('Polar plots do not support date angular axes yet.');
        expect(layoutOut.polar.angularaxis.type).toBe('linear');
    });

    it('should not coerce hoverformat on category axes', function() {
        _supply({}, [{
            type: 'scatterpolar',
            r: ['a', 'b'],
            theta: ['c', 'd'],
            visible: true,
            subplot: 'polar'
        }]);

        expect(layoutOut.polar.radialaxis.hoverformat).toBeUndefined();
        expect(layoutOut.polar.angularaxis.hoverformat).toBeUndefined();
    });

    it('should coerce hoverformat even for `visible: false` axes', function() {
        _supply({
            polar: {
                radialaxis: {
                    visible: false,
                    hoverformat: 'g'
                },
                angularaxis: {
                    visible: false,
                    hoverformat: 'g'
                }
            }
        }, [{
            type: 'scatterpolar',
            r: [1, 2],
            theta: [90, 180],
            visible: true,
            subplot: 'polar'
        }]);

        expect(layoutOut.polar.radialaxis.hoverformat).toBe('g');
        expect(layoutOut.polar.angularaxis.hoverformat).toBe('g');
    });

    it('should disable converting numeric strings using axis.autotypenumbers', function() {
        _supply({
            polar: {
                radialaxis: {
                    autotypenumbers: 'strict'
                },
                angularaxis: {
                    autotypenumbers: 'strict'
                }
            }
        }, [{
            visible: true,
            type: 'scatterpolar',
            r: ['0', '1', '1970', '2000'],
            theta: ['0', '1', '1970', '2000'],
            subplot: 'polar'
        }]);

        expect(layoutOut.polar.angularaxis.autotypenumbers).toBe('strict');
        expect(layoutOut.polar.radialaxis.autotypenumbers).toBe('strict');
        expect(layoutOut.polar.radialaxis.type).toBe('category');
        expect(layoutOut.polar.angularaxis.type).toBe('category');
    });

    it('should enable converting numeric strings using axis.autotypenumbers and inherit defaults from layout.autotypenumbers', function() {
        layoutOut.autotypenumbers = 'strict';

        _supply({
            polar: {
                radialaxis: {
                    autotypenumbers: 'convert types'
                },
                angularaxis: {
                    autotypenumbers: 'convert types'
                }
            }
        }, [{
            visible: true,
            type: 'scatterpolar',
            r: ['0', '1', '1970', '2000'],
            theta: ['0', '1', '1970', '2000'],
            subplot: 'polar'
        }]);

        expect(layoutOut.polar.angularaxis.autotypenumbers).toBe('convert types');
        expect(layoutOut.polar.radialaxis.autotypenumbers).toBe('convert types');
        expect(layoutOut.polar.radialaxis.type).toBe('linear');
        expect(layoutOut.polar.angularaxis.type).toBe('linear');
    });
});

describe('Test relayout on polar subplots:', function() {
    afterEach(destroyGraphDiv);

    it('should be able to reorder axis layers when relayout\'ing *layer*', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('../../image/mocks/polar_line.json'));
        var dflt = constants.layerNames;

        function _assert(expected) {
            var actual = d3SelectAll('g.polar > .polarsublayer');

            expect(actual.size()).toBe(expected.length, '# of layer');

            actual.each(function(d, i) {
                var className = d3Select(this)
                    .attr('class')
                    .split('polarsublayer ')[1];

                expect(className).toBe(expected[i], 'layer ' + i);
            });
        }

        Plotly.newPlot(gd, fig).then(function() {
            _assert(dflt);
            return Plotly.relayout(gd, 'polar.radialaxis.layer', 'below traces');
        })
        .then(function() {
            _assert([
                'draglayer', 'plotbg', 'backplot', 'angular-grid', 'radial-grid',
                'radial-line', 'radial-axis',
                'frontplot',
                'angular-line', 'angular-axis'
            ]);
            return Plotly.relayout(gd, 'polar.angularaxis.layer', 'below traces');
        })
        .then(function() {
            _assert([
                'draglayer', 'plotbg', 'backplot', 'angular-grid', 'radial-grid',
                'angular-line',
                'radial-line',
                'angular-axis',
                'radial-axis',
                'frontplot'
            ]);
            return Plotly.relayout(gd, 'polar.radialaxis.layer', 'above traces');
        })
        .then(function() {
            _assert([
                'draglayer', 'plotbg', 'backplot', 'angular-grid', 'radial-grid',
                'angular-line', 'angular-axis',
                'frontplot',
                'radial-line', 'radial-axis'
            ]);
            return Plotly.relayout(gd, 'polar.angularaxis.layer', null);
        })
        .then(function() {
            _assert(dflt);
        })
        .then(done, done.fail);
    });

    it('should be able to relayout axis types', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));

        Plotly.newPlot(gd, fig).then(function() {
            expect(gd._fullLayout.polar._subplot.viewInitial['radialaxis.range'])
                .toBeCloseToArray([0, 11.225]);
            expect(gd._fullLayout.polar.radialaxis.range)
                .toBeCloseToArray([0, 11.225]);

            return Plotly.relayout(gd, 'polar.radialaxis.type', 'log');
        })
        .then(function() {
            expect(gd._fullLayout.polar._subplot.viewInitial['radialaxis.range'])
                .toBeCloseToArray([-0.53, 1.158]);
            expect(gd._fullLayout.polar.radialaxis.range)
                .toBeCloseToArray([-0.53, 1.158]);

            return Plotly.relayout(gd, 'polar.radialaxis.type', 'linear');
        })
        .then(function() {
            expect(gd._fullLayout.polar._subplot.viewInitial['radialaxis.range'])
                .toBeCloseToArray([0, 11.225]);
            expect(gd._fullLayout.polar.radialaxis.range)
                .toBeCloseToArray([0, 11.225]);
        })
        .then(done, done.fail);
    });

    it('should be propagate angular settings down to tick labels', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));
        var pos0 = [];
        var pos1 = [];

        Plotly.newPlot(gd, fig).then(function() {
            d3SelectAll('.angularaxistick > text').each(function() {
                var tx = d3Select(this);
                pos0.push([tx.attr('x'), tx.attr('y')]);
            });
            return Plotly.relayout(gd, 'polar.angularaxis.rotation', 90);
        })
        .then(function() {
            d3SelectAll('.angularaxistick > text').each(function() {
                var tx = d3Select(this);
                pos1.push([tx.attr('x'), tx.attr('y')]);
            });

            // if they're the same, the tick label position did not update
            expect(pos1).not.toBeCloseTo2DArray(pos0);
        })
        .then(done, done.fail);
    });

    it('should be able to relayout angular ticks layout', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));

        function check(cnt, expected) {
            var ticks = d3SelectAll('path.angularaxistick');

            expect(ticks.size()).toBe(cnt, '# of ticks');
            ticks.each(function() {
                expect(d3Select(this).attr('d')).toBe(expected);
            });
        }

        Plotly.newPlot(gd, fig).then(function() {
            check(8, 'M1.5,0h5');
            return Plotly.relayout(gd, 'polar.angularaxis.ticks', 'inside');
        })
        .then(function() {
            check(8, 'M-1.5,0h-5');
            return Plotly.relayout(gd, 'polar.angularaxis.ticks', 'outside');
        })
        .then(function() {
            check(8, 'M1.5,0h5');
            return Plotly.relayout(gd, 'polar.angularaxis.ticks', '');
        })
        .then(function() {
            check(0);
            return Plotly.relayout(gd, 'polar.angularaxis.ticks', 'inside');
        })
        .then(function() {
            check(8, 'M-1.5,0h-5');
        })
        .then(done, done.fail);
    });

    it('should be able to toggle axis features', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));

        function assertCnt(selector, expected, msg) {
            var sel = d3Select(gd).selectAll(selector);
            expect(sel.size()).toBe(expected, msg);
        }

        function assertDisplay(selector, expected, msg) {
            var sel = d3Select(gd).selectAll(selector);

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
            'polar.radialaxis.showline',
            [true, false], [null, 'none'],
            '.radial-line > line', assertDisplay
        ))
        .then(toggle(
            'polar.radialaxis.showgrid',
            [true, false], [null, 'none'],
            '.radial-grid', assertDisplay
        ))
        .then(toggle(
            'polar.radialaxis.showticklabels',
            [true, false], [6, 0],
            '.radial-axis > .xtick > text', assertCnt
        ))
        .then(toggle(
            'polar.radialaxis.ticks',
            ['outside', ''], [6, 0],
            '.radial-axis > path.xtick', assertCnt
        ))
        .then(toggle(
            'polar.angularaxis.showline',
            [true, false], [null, 'none'],
            '.angular-line > path', assertDisplay
        ))
        .then(toggle(
            'polar.angularaxis.showgrid',
            [true, false], [8, 0],
            '.angular-grid > path', assertCnt
        ))
        .then(toggle(
            'polar.angularaxis.showticklabels',
            [true, false], [8, 0],
            '.angular-axis > .angularaxistick > text', assertCnt
        ))
        .then(toggle(
            'polar.angularaxis.ticks',
            ['outside', ''], [8, 0],
            '.angular-axis > path.angularaxistick', assertCnt
        ))
        .then(done, done.fail);
    });

    it('@noCI should be able to restyle radial axis title', function(done) {
        var gd = createGraphDiv();
        var lastBBox;

        function assertTitle(content, didBBoxChanged) {
            var radialAxisTitle = d3Select('g.g-polartitle');
            var txt = radialAxisTitle.select('text');
            var bb = radialAxisTitle.node().getBBox();
            var newBBox = [bb.x, bb.y, bb.width, bb.height];

            if(content === '') {
                expect(txt.size()).toBe(0, 'cleared <text>');
            } else {
                expect(txt.text()).toBe(content, 'radial axis title');
            }

            negateIf(didBBoxChanged, expect(newBBox)).toEqual(lastBBox, 'did bbox change');
            lastBBox = newBBox;
        }

        Plotly.newPlot(gd, [{
            type: 'scatterpolar',
            r: [1, 2, 3],
            theta: [10, 20, 30]
        }], {
            polar: {
                radialaxis: { title: { text: 'yo' } }
            }
        })
        .then(function() {
            assertTitle('yo', true);
            return Plotly.relayout(gd, 'polar.radialaxis.title.text', '');
        })
        .then(function() {
            assertTitle('', true);
            return Plotly.relayout(gd, 'polar.radialaxis.title.text', 'yo2');
        })
        .then(function() {
            assertTitle('yo2', true);
            return Plotly.relayout(gd, 'polar.radialaxis.ticklen', 20);
        })
        .then(function() {
            assertTitle('yo2', true);
            return Plotly.relayout(gd, 'polar.radialaxis.title.font.color', 'red');
        })
        .then(function() {
            assertTitle('yo2', false);
            return Plotly.relayout(gd, 'title.text', 'dummy');
        })
        .then(function() {
            assertTitle('yo2', false);
        })
        .then(done, done.fail);
    });

    it('should clean up its framework, clip paths and info layers when getting deleted', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));
        var traces = Lib.extendDeep([], fig.data);
        var inds = traces.map(function(_, i) { return i; });

        function _assert(exp) {
            expect(d3SelectAll('g.polar').size()).toBe(exp.subplot, '# subplot layer');
            expect(d3SelectAll('g.g-polartitle').size()).toBe(exp.rtitle, '# radial title');

            var clipCnt = 0;
            d3SelectAll('clipPath').each(function() {
                if(/polar-for-traces/.test(this.id)) clipCnt++;
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

    it('should update axis ranges when extending traces', function(done) {
        var gd = createGraphDiv();

        function _assert(msg, exp) {
            expect(gd._fullLayout.polar.radialaxis.autorange).toBe(true);

            expect(gd.layout.polar.radialaxis.range)
                .toBeCloseToArray(exp.rRange, 2, 'radial range in user layout - ' + msg);
            expect(gd._fullLayout.polar.radialaxis.range)
                .toBeCloseToArray(exp.rRange, 2, 'radial range in full layout - ' + msg);

            expect(gd._fullLayout.polar._subplot.angularAxis.range)
                .toBeCloseToArray([0, exp.period], 2, 'range in mocked angular axis - ' + msg);

            expect(d3SelectAll('path.angularaxistick').size())
                .toBe(exp.nTicks, '# of visible angular ticks - ' + msg);

            expect([gd.calcdata[0][5].x, gd.calcdata[0][5].y])
                .toBeCloseToArray(exp.sampleXY, -1, 'sample (x,y) px coords in calcdata - ' + msg);
        }

        Plotly.newPlot(gd, [{
            type: 'scatterpolar',
            r: [39, 28, 8, 7, 28, 39, 40, 30, 30, 30, 30],
            theta: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'A']
        }])
        .then(function() {
            _assert('base', {
                rRange: [0, 41.14],
                period: 10,
                nTicks: 10,
                sampleXY: [-39, 0]
            });
            return Plotly.extendTraces(gd, {
                r: [[-10, -5]],
                theta: [['y', 'z']]
            }, [0]);
        })
        .then(function() {
            _assert('after extending trace', {
                rRange: [-11.47, 41.47],
                period: 12,
                nTicks: 12,
                sampleXY: [-43, 25]
            });
            return Plotly.relayout(gd, 'polar.angularaxis.period', 15);
        })
        .then(function() {
            _assert('after angularaxis.period relayout', {
                rRange: [-11.47, 41.47],
                period: 15,
                nTicks: 12,
                sampleXY: [-25, 43]
            });
        })
        .then(done, done.fail);
    });

    it('should be able to relayout *gridshape*', function(done) {
        var gd = createGraphDiv();

        // check number of arcs ('A') or lines ('L') in svg paths
        function _assert(msg, exp) {
            var sp = d3Select(gd).select('g.polar');

            function assertLetterCount(query) {
                var d = sp.select(query).attr('d');
                var re = new RegExp(exp.letter, 'g');
                var actual = (d.match(re) || []).length;
                expect(actual).toBe(exp.cnt, msg + ' - ' + query);
            }

            assertLetterCount('.plotbg > path');
            assertLetterCount('.radial-grid > path');
            assertLetterCount('.angular-line > path');
        }

        Plotly.newPlot(gd, [{
            type: 'scatterpolar',
            r: [1, 2, 3, 2, 3, 1],
            theta: ['a', 'b', 'c', 'd', 'e', 'a']
        }])
        .then(function() {
            _assert('base', {letter: 'A', cnt: 2});
            return Plotly.relayout(gd, 'polar.gridshape', 'linear');
        })
        .then(function() {
            _assert('relayout -> linear', {letter: 'L', cnt: 5});
            return Plotly.relayout(gd, 'polar.gridshape', 'circular');
        })
        .then(function() {
            _assert('relayout -> circular', {letter: 'A', cnt: 2});
        })
        .then(done, done.fail);
    });

    it('should not attempt to draw radial axis when *polar.hole* is set to 1', function(done) {
        var gd = createGraphDiv();

        var queries = [
            '.radial-axis', '.radial-grid', '.radial-line > line',
            '.radialdrag', '.radialdrag-inner'
        ];

        function _assert(msg, showing) {
            var exp = showing ? null : 'none';
            var sp3 = d3Select(gd).select('.polarlayer > .polar');
            queries.forEach(function(q) {
                assertNodeDisplay(sp3.selectAll(q), [exp], msg + ' ' + q);
            });
        }

        Plotly.newPlot(gd, [{
            type: 'scatterpolar',
            r: ['a', 'b', 'c']
        }])
        .then(function() { _assert('base', true); })
        .then(function() { return Plotly.relayout(gd, 'polar.hole', 1); })
        .then(function() { _assert('hole=1', false); })
        .then(function() { return Plotly.relayout(gd, 'polar.hole', 0.2); })
        .then(function() { _assert('hole=0.2', true); })
        .then(done, done.fail);
    });
});

describe('Test polar interactions:', function() {
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

    function _click(pos, opts) {
        eventData = '';
        gd._mouseDownTime = 0;
        click(pos[0], pos[1], opts);
    }

    function _doubleClick(pos) {
        gd._mouseDownTime = 0;
        eventData = '';
        return doubleClick(pos[0], pos[1]);
    }

    var modClickOpts = {
        altKey: true,
        ctrlKey: true, // this makes it effectively into a right-click
        metaKey: true,
        shiftKey: true,
        button: 0,
        cancelContext: true
    };

    var rightClickOpts = {
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        button: 2,
        cancelContext: true
    };

    it('should trigger hover/unhover/click/doubleclick events', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));
        var ptPos = [250, 200];
        var blankPos = [200, 120];
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
                r: 3.26,
                theta: 68.08
            }], {
                plotly_hover: 1
            }, 'after hover on pt');
        })
        .then(function() { _unhover(blankPos);})
        .then(function() {
            _assert([{
                r: 3.26,
                theta: 68.08
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
        .then(function() { _click(ptPos); })
        .then(function() {
            _assert([{
                r: 3.26,
                theta: 68.08
            }], {
                plotly_hover: 2,
                plotly_unhover: 1,
                plotly_click: 1
            }, 'after click');
        })
        .then(function() { return _doubleClick(ptPos); })
        .then(function() {
            assertEventCnt({
                plotly_hover: 2,
                plotly_unhover: 1,
                plotly_click: 3,
                plotly_doubleclick: 1,
                plotly_relayout: 1
            }, 'after doubleclick');
        })
        .then(function() { _click(ptPos, modClickOpts); })
        .then(function() {
            _assert([{
                r: 3.26,
                theta: 68.08
            }], {
                plotly_hover: 2,
                plotly_unhover: 1,
                plotly_click: 4,
                plotly_doubleclick: 1,
                plotly_relayout: 1
            }, 'after modified click');
        })
        .then(function() { _click(ptPos, rightClickOpts); })
        .then(function() {
            _assert([{
                r: 3.26,
                theta: 68.08
            }], {
                plotly_hover: 2,
                plotly_unhover: 1,
                plotly_click: 5,
                plotly_doubleclick: 1,
                plotly_relayout: 1
            }, 'after right click');
        })
        .then(done, done.fail);
    });

    it('should respond to drag interactions on plot area', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));

        // to avoid dragging on hover labels
        fig.layout.hovermode = false;

        // adjust margins so that middle of plot area is at 300x300
        // with its middle at [200,200]
        fig.layout.width = 400;
        fig.layout.height = 400;
        fig.layout.margin = {l: 50, t: 50, b: 50, r: 50};

        var mid = [200, 200];
        var relayoutNumber = 0;
        var resetNumber = 0;

        function _drag(p0, dp) {
            var node = d3Select('.polar > .draglayer > .maindrag').node();
            return drag({node: node, dpos: dp, pos0: p0});
        }

        function _assertRange(rng, msg) {
            expect(gd._fullLayout.polar.radialaxis.range).toBeCloseToArray(rng, 1, msg);
        }

        function _assertDrag(rng, msg) {
            relayoutNumber++;
            _assertRange(rng, msg);

            if(eventCnts.plotly_relayout === relayoutNumber) {
                expect(eventData['polar.radialaxis.range'])
                    .toBeCloseToArray(rng, 1, msg + '- event data');
            } else {
                fail('incorrect number of plotly_relayout events triggered - ' + msg);
            }
        }

        function _assertBase(extra) {
            var msg = 'base range' + (extra ? ' ' + extra : '');
            _assertRange([0, 11.1], msg);
        }

        function _reset() {
            relayoutNumber++;
            resetNumber++;

            var extra = '(reset ' + resetNumber + ')';
            _assertBase(extra);
            expect(eventCnts.plotly_doubleclick).toBe(resetNumber, 'doubleclick event #' + extra);
        }

        _plot(fig)
        .then(_assertBase)
        .then(function() { return _drag(mid, [50, 50]); })
        .then(function() {
            _assertDrag([0, 5.24], 'from center move toward bottom-right');
        })
        .then(delay(20))
        .then(function() { return _doubleClick(mid); })
        .then(delay(20))
        .then(_reset)
        .then(function() { return _drag(mid, [-50, -50]); })
        .then(function() {
            _assertDrag([0, 5.24], 'from center move toward top-left');
        })
        .then(delay(20))
        .then(function() { return _doubleClick(mid); })
        .then(delay(20))
        .then(_reset)
        .then(function() { return _drag([mid[0] + 30, mid[0] - 30], [50, -50]); })
        .then(function() {
            _assertDrag([3.1, 8.4], 'from quadrant #1 move top-right');
        })
        .then(delay(20))
        .then(function() { return _doubleClick(mid); })
        .then(delay(20))
        .then(_reset)
        .then(function() { return _drag([345, 200], [-50, 0]); })
        .then(function() {
            _assertDrag([7.0, 11.1], 'from right edge move left');
        })
        .then(delay(20))
        .then(function() { return _doubleClick(mid); })
        .then(delay(20))
        .then(_reset)
        .then(function() { return _drag(mid, [10, 10]);})
        .then(function() { _assertBase('from center to not far enough'); })
        .then(function() { return _drag([mid[0] + 30, mid[0] - 30], [-10, 0]);})
        .then(function() { _assertBase('from quadrant #1 to not far enough'); })
        .then(function() { return _drag([345, 200], [-10, 0]);})
        .then(function() { _assertBase('from right edge to not far enough'); })
        .then(function() {
            expect(eventCnts.plotly_relayout)
                .toBe(relayoutNumber, 'no new relayout events after *not far enough* cases');
        })
        .then(delay(20))
        .then(function() { return _doubleClick(mid); })
        .then(delay(20))
        .then(_reset)
        .then(function() { return Plotly.relayout(gd, 'polar.hole', 0.2); })
        .then(function() { relayoutNumber++; })
        .then(function() { return _drag([mid[0] + 30, mid[0] - 30], [50, -50]); })
        .then(function() {
            _assertDrag([1.15, 7.70], 'with polar.hole>0, from quadrant #1 move top-right');
        })
        .then(done, done.fail);
    });

    it('should respond to drag interactions on radial drag area', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));

        // to avoid dragging on hover labels
        fig.layout.hovermode = false;

        // adjust margins so that middle of plot area is at 300x300
        // with its middle at [200,200]
        fig.layout.width = 400;
        fig.layout.height = 400;
        fig.layout.margin = {l: 50, t: 50, b: 50, r: 50};

        var dragPos0 = [375, 200];
        var resetNumber = 0;

        // use 'special' drag method - as we need two mousemove events
        // to activate the radial drag mode
        function _drag(p0, dp) {
            var node = d3Select('.polar > .draglayer > .radialdrag').node();
            return drag({node: node, dpos: dp, pos0: p0, nsteps: 2});
        }

        function _assert(rng, angle, evtRng1, evtAngle, msg) {
            expect(gd._fullLayout.polar.radialaxis.range)
                .toBeCloseToArray(rng, 1, msg + ' - range');
            expect(gd._fullLayout.polar.radialaxis.angle)
                .toBeCloseTo(angle, 1, msg + ' - angle');

            if(evtRng1 !== null) {
                expect(eventData['polar.radialaxis.range[1]'])
                    .toBeCloseTo(evtRng1, 1, msg + ' - range[1] event data');
            }
            if(evtAngle !== null) {
                expect(eventData['polar.radialaxis.angle'])
                    .toBeCloseTo(evtAngle, 1, msg + ' - angle event data');
            }
        }

        function _assertBase(extra) {
            extra = extra ? ' ' + extra : '';
            _assert([0, 11.1], 0, null, null, 'base' + extra);
        }

        function _reset() {
            return delay(100)()
                .then(function() { return _doubleClick([200, 200]); })
                .then(function() {
                    resetNumber++;

                    var extra = '(reset ' + resetNumber + ')';
                    _assertBase(extra);
                    expect(eventCnts.plotly_doubleclick).toBe(resetNumber, 'doubleclick event #' + extra);
                });
        }

        _plot(fig)
        .then(_assertBase)
        .then(function() { return _drag(dragPos0, [-50, 0]); })
        .then(function() {
            _assert([0, 13.9], 0, 13.9, null, 'move inward');
        })
        .then(_reset)
        .then(function() { return _drag(dragPos0, [50, 0]); })
        .then(function() {
            _assert([0, 8.33], 0, 8.33, null, 'move outward');
        })
        .then(_reset)
        .then(function() { return _drag(dragPos0, [0, -50]); })
        .then(function() {
            _assert([0, 11.1], 15.94, null, 15.94, 'move counterclockwise');
        })
        .then(_reset)
        .then(function() { return _drag(dragPos0, [0, 50]); })
        .then(function() {
            _assert([0, 11.1], -15.94, null, -15.94, 'move clockwise');
        })
        .then(_reset)
        .then(function() {
            expect(eventCnts.plotly_relayout).toBe(8, 'total # of relayout events');
        })
        .then(done, done.fail);
    });

    it('should respond to drag interactions on inner radial drag area', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));
        fig.layout.polar.hole = 0.2;
        // to avoid dragging on hover labels
        fig.layout.hovermode = false;
        // adjust margins so that middle of plot area is at 300x300
        // with its middle at [200,200]
        fig.layout.width = 400;
        fig.layout.height = 400;
        fig.layout.margin = {l: 50, t: 50, b: 50, r: 50};

        var dragPos0 = [200, 200];

        // use 'special' drag method - as we need two mousemove events
        // to activate the radial drag mode
        function _drag(p0, dp) {
            var node = d3Select('.polar > .draglayer > .radialdrag-inner').node();
            return drag({node: node, dpos: dp, pos0: p0, nsteps: 2});
        }

        function _assert(rng, msg) {
            expect(gd._fullLayout.polar.radialaxis.range)
                .toBeCloseToArray(rng, 1, msg + ' - range');
        }

        _plot(fig)
        .then(function() { return _drag(dragPos0, [-50, 0]); })
        .then(function() {
            _assert([3.55, 11.36], 'move inward');
        })
        .then(function() { return Plotly.relayout(gd, 'polar.radialaxis.autorange', true); })
        .then(function() { return _drag(dragPos0, [50, 0]); })
        .then(function() {
            _assert([-3.55, 11.36], 'move outward');
        })
        .then(done, done.fail);
    });

    it('should respond to drag interactions on angular drag area', function(done) {
        var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));

        // to avoid dragging on hover labels
        fig.layout.hovermode = false;

        // adjust margins so that middle of plot area is at 300x300
        // with its middle at [200,200]
        fig.layout.width = 400;
        fig.layout.height = 400;
        fig.layout.margin = {l: 50, t: 50, b: 50, r: 50};

        var dragPos0 = [350, 150];
        var resetNumber = 0;

        function _drag(p0, dp) {
            var node = d3Select('.polar > .draglayer > .angulardrag').node();
            return drag({node: node, dpos: dp, pos0: p0});
        }

        function _assert(rot, msg, noEvent) {
            expect(gd._fullLayout.polar.angularaxis.rotation)
                .toBeCloseTo(rot, 1, msg + ' - rotation');
            if(!noEvent) {
                expect(eventData['polar.angularaxis.rotation'])
                    .toBeCloseTo(rot, 1, msg + ' - rotation event data');
            }
        }

        function _assertBase(extra) {
            extra = extra ? ' ' + extra : '';
            _assert(0, 'base' + extra, true);
        }

        function _reset() {
            return delay(100)()
                .then(function() { return _doubleClick([200, 200]); })
                .then(function() {
                    resetNumber++;

                    var extra = '(reset ' + resetNumber + ')';
                    _assertBase(extra);
                    expect(eventCnts.plotly_doubleclick).toBe(resetNumber, 'doubleclick event #' + extra);
                });
        }

        _plot(fig)
        .then(_assertBase)
        .then(function() { return _drag(dragPos0, [-20, -20]); })
        .then(function() {
            _assert(9.9, 'move counterclockwise');
        })
        .then(_reset)
        .then(function() { return _drag(dragPos0, [20, 20]); })
        .then(function() {
            _assert(-8.4, 'move clockwise');
        })
        .then(_reset)
        .then(function() {
            expect(eventCnts.plotly_relayout).toBe(4, 'total # of relayout events');
        })
        .then(done, done.fail);
    });

    describe('dragmode === false', function() {
        it('should not respond to drag interactions on plot area when dragmode === false', function(done) {
            var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));
            // adjust margins so that middle of plot area is at 300x300
            // with its middle at [200,200]
            fig.layout.width = 400;
            fig.layout.height = 400;
            fig.layout.margin = {l: 50, t: 50, b: 50, r: 50};

            var mid = [200, 200];
            var resetNumber = 0;

            function _drag(p0, dp) {
                var node = d3Select('.polar > .draglayer > .maindrag').node();
                return drag({node: node, dpos: dp, pos0: p0});
            }

            function _assertRange(rng, msg) {
                expect(gd._fullLayout.polar.radialaxis.range).toBeCloseToArray(rng, 1, msg);
            }

            function _assertBase(extra) {
                var msg = 'base range' + (extra ? ' ' + extra : '');
                _assertRange([0, 11.1], msg);
            }

            function _reset() {
                resetNumber++;

                var extra = '(reset ' + resetNumber + ')';
                _assertBase(extra);
                expect(eventCnts.plotly_doubleclick).toBe(0, 'doubleclick event #' + extra);
            }

            _plot(fig)
            .then(_assertBase)
            .then(function() { return Plotly.relayout(gd, 'dragmode', false); })
            .then(function() { return _drag(mid, [50, 50]); })
            .then(function() {
                _assertBase('from center move toward bottom-right');
            })
            .then(delay(20))
            .then(function() { return _doubleClick(mid); })
            .then(delay(20))
            .then(_reset)
            .then(function() { return _drag(mid, [-50, -50]); })
            .then(function() {
                _assertBase('from center move toward top-left');
            })
            .then(delay(20))
            .then(function() { return _doubleClick(mid); })
            .then(delay(20))
            .then(_reset)
            .then(function() { return _drag([mid[0] + 30, mid[0] - 30], [50, -50]); })
            .then(function() {
                _assertBase('from quadrant #1 move top-right');
            })
            .then(delay(20))
            .then(function() { return _doubleClick(mid); })
            .then(delay(20))
            .then(_reset)
            .then(function() { return _drag([345, 200], [-50, 0]); })
            .then(function() {
                _assertBase('from right edge move left');
            })
            .then(delay(20))
            .then(function() { return _doubleClick(mid); })
            .then(delay(20))
            .then(_reset)
            .then(function() { return _drag(mid, [10, 10]);})
            .then(function() { _assertBase('from center to not far enough'); })
            .then(function() { return _drag([mid[0] + 30, mid[0] - 30], [-10, 0]);})
            .then(function() { _assertBase('from quadrant #1 to not far enough'); })
            .then(function() { return _drag([345, 200], [-10, 0]);})
            .then(function() { _assertBase('from right edge to not far enough'); })
            .then(function() {
                expect(eventCnts.plotly_relayout)
                    .toBe(1, 'no new relayout events after *not far enough* cases');
            })
            .then(delay(20))
            .then(function() { return _doubleClick(mid); })
            .then(delay(20))
            .then(_reset)
            .then(function() { return Plotly.relayout(gd, 'polar.hole', 0.2); })
            .then(function() { return _drag([mid[0] + 30, mid[0] - 30], [50, -50]); })
            .then(function() {
                _assertRange([0, 11.4], 'with polar.hole>0, from quadrant #1 move top-right');
            })
            .then(done, done.fail);
        });

        it('should not respond to drag interactions on radial drag area when dragmode === false', function(done) {
            var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));
            // adjust margins so that middle of plot area is at 300x300
            // with its middle at [200,200]
            fig.layout.width = 400;
            fig.layout.height = 400;
            fig.layout.margin = {l: 50, t: 50, b: 50, r: 50};

            var dragPos0 = [375, 200];
            var resetNumber = 0;

            // use 'special' drag method - as we need two mousemove events
            // to activate the radial drag mode
            function _drag(p0, dp) {
                var node = d3Select('.polar > .draglayer > .radialdrag').node();
                return drag({node: node, dpos: dp, pos0: p0, nsteps: 2});
            }

            function _assert(rng, angle, evtRng1, evtAngle, msg) {
                expect(gd._fullLayout.polar.radialaxis.range)
                    .toBeCloseToArray(rng, 1, msg + ' - range');
                expect(gd._fullLayout.polar.radialaxis.angle)
                    .toBeCloseTo(angle, 1, msg + ' - angle');

                if(evtRng1 !== null) {
                    expect(eventData['polar.radialaxis.range[1]'])
                        .toBeCloseTo(evtRng1, 1, msg + ' - range[1] event data');
                }
                if(evtAngle !== null) {
                    expect(eventData['polar.radialaxis.angle'])
                        .toBeCloseTo(evtAngle, 1, msg + ' - angle event data');
                }
            }

            function _assertBase(extra) {
                extra = extra ? ' ' + extra : '';
                _assert([0, 11.1], 0, null, null, 'base' + extra);
            }

            function _reset() {
                return delay(100)()
                    .then(function() { return _doubleClick([200, 200]); })
                    .then(function() {
                        resetNumber++;

                        var extra = '(reset ' + resetNumber + ')';
                        _assertBase(extra);
                        expect(eventCnts.plotly_doubleclick).toBe(0, 'doubleclick event #' + extra);
                    });
            }

            _plot(fig)
            .then(_assertBase)
            .then(function() { return Plotly.relayout(gd, 'dragmode', false); })
            .then(function() { return _drag(dragPos0, [-50, 0]); })
            .then(function() {
                _assertBase('move inward');
            })
            .then(_reset)
            .then(function() { return _drag(dragPos0, [50, 0]); })
            .then(function() {
                _assertBase('move outward');
            })
            .then(_reset)
            .then(function() { return _drag(dragPos0, [0, -50]); })
            .then(function() {
                _assertBase('move counterclockwise');
            })
            .then(_reset)
            .then(function() { return _drag(dragPos0, [0, 50]); })
            .then(function() {
                _assertBase('move clockwise');
            })
            .then(_reset)
            .then(function() {
                expect(eventCnts.plotly_relayout).toBe(1, 'total # of relayout events');
            })
            .then(done, done.fail);
        });

        it('should not respond to drag interactions on inner radial drag area when dragmode === false', function(done) {
            var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));
            fig.layout.polar.hole = 0.2;
            // adjust margins so that middle of plot area is at 300x300
            // with its middle at [200,200]
            fig.layout.width = 400;
            fig.layout.height = 400;
            fig.layout.margin = {l: 50, t: 50, b: 50, r: 50};

            var dragPos0 = [200, 200];

            // use 'special' drag method - as we need two mousemove events
            // to activate the radial drag mode
            function _drag(p0, dp) {
                var node = d3Select('.polar > .draglayer > .radialdrag-inner').node();
                return drag({node: node, dpos: dp, pos0: p0, nsteps: 2});
            }

            function _assert(rng, msg) {
                expect(gd._fullLayout.polar.radialaxis.range)
                    .toBeCloseToArray(rng, 1, msg + ' - range');
            }

            function _assertBase(extra) {
                extra = extra ? ' ' + extra : '';
                _assert([0, 11.4], 'base' + extra);
            }

            _plot(fig)
            .then(_assertBase)
            .then(function() { return Plotly.relayout(gd, 'dragmode', false); })
            .then(function() { return _drag(dragPos0, [-50, 0]); })
            .then(function() {
                _assertBase('move inward');
            })
            .then(function() { return Plotly.relayout(gd, 'polar.radialaxis.autorange', true); })
            .then(function() { return _drag(dragPos0, [50, 0]); })
            .then(function() {
                _assertBase('move outward');
            })
            .then(done, done.fail);
        });

        it('should not respond to drag interactions on angular drag area when dragmode === false', function(done) {
            var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));
            // adjust margins so that middle of plot area is at 300x300
            // with its middle at [200,200]
            fig.layout.width = 400;
            fig.layout.height = 400;
            fig.layout.margin = {l: 50, t: 50, b: 50, r: 50};

            var dragPos0 = [350, 150];
            var resetNumber = 0;

            function _drag(p0, dp) {
                var node = d3Select('.polar > .draglayer > .angulardrag').node();
                return drag({node: node, dpos: dp, pos0: p0});
            }

            function _assert(rot, msg, noEvent) {
                expect(gd._fullLayout.polar.angularaxis.rotation)
                    .toBeCloseTo(rot, 1, msg + ' - rotation');
                if(!noEvent) {
                    expect(eventData['polar.angularaxis.rotation'])
                        .toBeCloseTo(rot, 1, msg + ' - rotation event data');
                }
            }

            function _assertBase(extra) {
                extra = extra ? ' ' + extra : '';
                _assert(0, 'base' + extra, true);
            }

            function _reset() {
                return delay(100)()
                    .then(function() { return _doubleClick([200, 200]); })
                    .then(function() {
                        resetNumber++;

                        var extra = '(reset ' + resetNumber + ')';
                        _assertBase(extra);
                        expect(eventCnts.plotly_doubleclick).toBe(0, 'doubleclick event #' + extra);
                    });
            }

            _plot(fig)
            .then(_assertBase)
            .then(function() { return Plotly.relayout(gd, 'dragmode', false); })
            .then(function() { return _drag(dragPos0, [-20, -20]); })
            .then(function() {
                _assertBase('move counterclockwise');
            })
            .then(_reset)
            .then(function() { return _drag(dragPos0, [20, 20]); })
            .then(function() {
                _assertBase('move clockwise');
            })
            .then(_reset)
            .then(function() {
                expect(eventCnts.plotly_relayout).toBe(1, 'total # of relayout events');
            })
            .then(done, done.fail);
        });
    });

    describe('should update scene during drag interactions on radial and angular drag area', function() {
        var objs = ['scatter2d', 'line2d'];
        var scene, gl, nTraces;

        function _dragRadial() {
            var node = d3Select('.polar > .draglayer > .radialdrag').node();
            var p0 = [375, 200];
            var dp = [-50, 0];
            return drag({node: node, dpos: dp, pos0: p0, nsteps: 2});
        }

        function _dragAngular() {
            var node = d3Select('.polar > .draglayer > .angulardrag').node();
            var p0 = [350, 150];
            var dp = [-20, 20];
            return drag({node: node, dpos: dp, pos0: p0});
        }

        // once on drag, once on mouseup relayout
        function _assert() {
            expect(gl.clear).toHaveBeenCalledTimes(2);
            gl.clear.calls.reset();

            objs.forEach(function(o) {
                if(scene[o]) {
                    expect(scene[o].draw).toHaveBeenCalledTimes(2 * nTraces);
                    scene[o].draw.calls.reset();
                }
            });
        }

        var specs = [{
            desc: 'scatter marker case',
            // mode: 'markers' by default
        }, {
            desc: 'line case',
            // start with lines to lock down fix for #2888
            patch: function(fig) {
                fig.data.forEach(function(trace) { trace.mode = 'lines'; });
            }
        }, {
            desc: 'line & markers case',
            patch: function(fig) {
                fig.data.forEach(function(trace) { trace.mode = 'markers+lines'; });
            }
        }, {
            desc: 'gl and non-gl on same subplot case',
            patch: function(fig) {
                fig.data.forEach(function(trace, i) {
                    trace.type = (i % 2) ? 'scatterpolar' : 'scatterpolargl';
                });
            }
        }];

        specs.forEach(function(s) {
            it('@gl - ' + s.desc, function(done) {
                var fig = Lib.extendDeep({}, require('../../image/mocks/glpolar_scatter.json'));
                scene = null;
                gl = null;

                fig.layout.hovermode = false;
                fig.layout.width = 400;
                fig.layout.height = 400;
                fig.layout.margin = {l: 50, t: 50, b: 50, r: 50};

                if(s.patch) s.patch(fig);
                nTraces = fig.data
                    .filter(function(trace) { return trace.type === 'scatterpolargl'; })
                    .length;

                Plotly.newPlot(gd, fig).then(function() {
                    scene = gd._fullLayout.polar._subplot._scene;

                    objs.forEach(function(o) {
                        if(scene[o]) {
                            spyOn(scene[o], 'draw').and.callThrough();
                            if(!gl) {
                                // all objects have the same _gl ref,
                                // spy on it just once
                                gl = scene[o].regl._gl;
                                spyOn(gl, 'clear').and.callThrough();
                            }
                        }
                    });
                })
                .then(function() { return _dragRadial(); })
                .then(_assert)
                .then(function() { return _dragAngular(); })
                .then(_assert)
                .then(done, done.fail);
            });
        });
    });

    describe('plotly_relayouting', function() {
        afterEach(destroyGraphDiv);

        it('should emit events on radial drag area', function(done) {
            var events = []; var path = [[375, 200], [-100, 0]]; var nsteps = 10;
            var relayoutEvents = [];
            var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));
            // to avoid dragging on hover labels
            fig.layout.hovermode = false;

            // adjust margins so that middle of plot area is at 300x300
            // with its middle at [200,200]
            fig.layout.width = 400;
            fig.layout.height = 400;
            fig.layout.margin = {l: 50, t: 50, b: 50, r: 50};

            function _drag(p0, dp, nsteps) {
                var node = d3Select('.polar > .draglayer > .radialdrag').node();
                return drag({node: node, dpos: dp, pos0: p0, nsteps: nsteps});
            }

            var gd = createGraphDiv();
            Plotly.newPlot(gd, fig)
            .then(function() {
                gd.on('plotly_relayout', function(e) {
                    relayoutEvents.push(e);
                });
                gd.on('plotly_relayouting', function(e) {
                    events.push(e);
                });
                return _drag(path[0], path[1], nsteps);
            })
            .then(function() {
                var len = events.length;
                expect(len).toEqual(nsteps);
                expect(events[len - 1]['polar.radialaxis.range[1]']).toBeCloseTo(16, -1);
                expect(relayoutEvents.length).toEqual(1);
                Object.keys(relayoutEvents[0]).sort().forEach(function(key) {
                    expect(Object.keys(events[len - 1])).toContain(key);
                });
            })
            .then(done, done.fail);
        });

        it('should emit events on inner radial drag area', function(done) {
            var events = []; var path = [[150, 250], [175, 250]];
            var relayoutEvents = [];
            var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));

            function _drag(p0, dp, nsteps) {
                var node = d3Select('.polar > .draglayer > .maindrag').node();
                return drag({node: node, dpos: dp, pos0: p0, nsteps: nsteps});
            }

            var gd = createGraphDiv();
            Plotly.newPlot(gd, fig)
            .then(function() {
                gd.on('plotly_relayout', function(e) {
                    relayoutEvents.push(e);
                });
                gd.on('plotly_relayouting', function(e) {
                    events.push(e);
                });
                return _drag(path[0], path[1]);
            })
            .then(function() {
                expect(events.length).toEqual(path.length - 1);
                expect(events[0]['polar.radialaxis.range']).toBeCloseToArray([6, 11], 0.1);
                expect(relayoutEvents.length).toEqual(1);
                Object.keys(relayoutEvents[0]).sort().forEach(function(key) {
                    expect(Object.keys(events[0])).toContain(key);
                });
            })
            .then(done, done.fail);
        });

        it('should emit events on angular drag area', function(done) {
            var events = []; var relayoutEvents = []; var nsteps = 10;
            var fig = Lib.extendDeep({}, require('../../image/mocks/polar_scatter.json'));

            function _drag(p0, dp, nsteps) {
                var node = d3Select('.polar > .draglayer > .angulardrag').node();
                return drag({node: node, dpos: dp, pos0: p0, nsteps: nsteps});
            }

            var dragPos0 = [360, 180];

            var gd = createGraphDiv();
            Plotly.newPlot(gd, fig)
            .then(function() {
                gd.on('plotly_relayout', function(e) {
                    relayoutEvents.push(e);
                });
                gd.on('plotly_relayouting', function(e) {
                    events.push(e);
                });
                return _drag(dragPos0, [0, -110], nsteps);
            })
            .then(function() {
                expect(events.length).toEqual(nsteps);
                expect(events.splice(-1, 1)[0]['polar.angularaxis.rotation']).toBeCloseTo(29, 0);
                expect(relayoutEvents.length).toEqual(1);
                Object.keys(relayoutEvents[0]).sort().forEach(function(key) {
                    expect(Object.keys(events[0])).toContain(key);
                });
            })
            .then(done, done.fail);
        });
    });
});

describe('Test polar *gridshape linear* interactions', function() {
    var gd;

    beforeEach(function() {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should snap radial axis rotation to polygon vertex angles', function(done) {
        var dragPos0 = [150, 25];
        var dragPos1 = [316, 82];
        var evtCnt = 0;

        // use 'special' drag method - as we need two mousemove events
        // to activate the radial drag mode
        function _drag(p0, dp) {
            var node = d3Select('.polar > .draglayer > .radialdrag').node();
            return drag({node: node, dpos: dp, pos0: p0, nsteps: 2});
        }

        function _assert(msg, angle) {
            expect(gd._fullLayout.polar.radialaxis.angle)
                .toBeCloseTo(angle, 1, msg + ' - angle');
        }

        Plotly.newPlot(gd, [{
            type: 'scatterpolar',
            // octogons have nice angles
            r: [1, 2, 3, 2, 3, 1, 2, 1, 2],
            theta: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'a']
        }], {
            polar: {
                gridshape: 'linear',
                angularaxis: {direction: 'clockwise'},
                radialaxis: {angle: 90}
            },
            width: 400,
            height: 400,
            margin: {l: 50, t: 50, b: 50, r: 50},
            // to avoid dragging on hover labels
            hovermode: false
        })
        .then(function() {
            gd.on('plotly_relayout', function() { evtCnt++; });
        })
        .then(function() { _assert('base', 90); })
        .then(function() { return _drag(dragPos0, [100, 50]); })
        .then(function() { _assert('rotate right', 45); })
        .then(function() { return _drag(dragPos1, [20, 20]); })
        .then(function() { _assert('rotate right, snapped back', 45); })
        .then(function() { return _drag(dragPos1, [-100, -50]); })
        .then(function() { _assert('rotate left', 90); })
        .then(function() { expect(evtCnt).toBe(3); })
        .then(done, done.fail);
    });

    it('should rotate all non-symmetrical layers on angular drag', function(done) {
        var evtCnt = 0;
        var evtData = {};

        var layersRotateFromZero = ['.plotbg > path', '.radial-grid'];
        var layersRotateFromRadialAxis = ['.radial-axis', '.radial-line > line'];

        function _assertTransformRotate(msg, query, rot) {
            var sp = d3Select(gd).select('g.polar');
            var t = sp.select(query).attr('transform');
            var rotate = (t.split('rotate(')[1] || '').split(')')[0];
            if(rot === null) {
                expect(rotate).toBe('', msg + ' - ' + query);
            } else {
                expect(Number(rotate)).toBeCloseTo(rot, 1, msg + ' - ' + query);
            }
        }

        function _run(msg, p0, dp, exp) {
            var node = d3Select('.polar > .draglayer > .angulardrag').node();
            var dragFns = drag.makeFns({node: node, dpos: dp, pos0: p0});

            return dragFns.start().then(function() {
                layersRotateFromZero.forEach(function(q) {
                    _assertTransformRotate(msg, q, exp.fromZero);
                });
                layersRotateFromRadialAxis.forEach(function(q) {
                    _assertTransformRotate(msg, q, exp.fromRadialAxis);
                });
            })
            .then(dragFns.end);
        }

        Plotly.newPlot(gd, [{
            type: 'scatterpolar',
            r: [1, 2, 3, 2, 3],
            theta: ['a', 'b', 'c', 'd', 'e']
        }], {
            polar: {
                gridshape: 'linear',
                angularaxis: {direction: 'clockwise'},
                radialaxis: {angle: 90}
            },
            width: 400,
            height: 400,
            margin: {l: 50, t: 50, b: 50, r: 50}
        })
        .then(function() {
            gd.on('plotly_relayout', function(d) {
                evtCnt++;
                evtData = d;
            });
        })
        .then(function() {
            layersRotateFromZero.forEach(function(q) {
                _assertTransformRotate('base', q, null);
            });
            layersRotateFromRadialAxis.forEach(function(q) {
                _assertTransformRotate('base', q, -90);
            });
        })
        .then(function() {
            return _run('rotate clockwise', [150, 20], [30, 30], {
                fromZero: 7.2,
                fromRadialAxis: -82.8
            });
        })
        .then(function() {
            expect(evtCnt).toBe(1, '# of plotly_relayout calls');
            expect(evtData['polar.angularaxis.rotation'])
                .toBeCloseTo(82.8, 1, 'polar.angularaxis.rotation event data');
            // have to rotate radial axis too here, to ensure it remains 'on scale'
            expect(evtData['polar.radialaxis.angle'])
                .toBeCloseTo(82.8, 1, 'polar.radialaxis.angle event data');
        })
        .then(done, done.fail);
    });

    it('should place zoombox handles at correct place on main drag', function(done) {
        // d attr to array of segment [x,y]
        function path2coords(path) {
            if(!path.size()) return [[]];
            return path.attr('d')
                .replace(/Z/g, '')
                .split('M')
                .filter(Boolean)
                .map(function(s) {
                    return s.split('L')
                        .map(function(s) { return s.split(',').map(Number); });
                })
                .reduce(function(a, b) { return a.concat(b); });
        }

        function _run(msg, p0, dp, exp) {
            var node = d3Select('.polar > .draglayer > .maindrag').node();
            var dragFns = drag.makeFns({node: node, dpos: dp, pos0: p0});

            return dragFns.start().then(function() {
                var zl = d3Select(gd).select('g.zoomlayer');

                expect(path2coords(zl.select('.zoombox')))
                    .toBeCloseTo2DArray(exp.zoombox, 2, msg + ' - zoombox');
                expect(path2coords(zl.select('.zoombox-corners')))
                    .toBeCloseTo2DArray(exp.corners, 2, msg + ' - corners');
            })
            .then(dragFns.end);
        }

        Plotly.newPlot(gd, [{
            type: 'scatterpolar',
            r: [1, 2, 3, 2, 3],
            theta: ['a', 'b', 'c', 'd', 'e']
        }], {
            polar: {
                gridshape: 'linear',
                angularaxis: {direction: 'clockwise'}
            },
            width: 400,
            height: 400,
            margin: {l: 50, t: 50, b: 50, r: 50}
        })
        .then(function() {
            return _run('drag outward toward bottom right', [170, 170], [220, 220], {
                zoombox: [
                    [-142.658, -46.353], [-88.167, 121.352],
                    [88.167, 121.352], [142.658, -46.352],
                    [0, -150], [-142.658, -46.352],
                    [-142.658, -46.352], [-88.167, 121.352],
                    [88.167, 121.352], [142.658, -46.352],
                    [0, -150], [-142.658, -46.352],
                    [-49.261, -16.005], [-30.445, 41.904],
                    [30.44508691777904, 41.904], [49.261, -16.005],
                    [0, -51.796], [-49.261, -16.005]
                ],
                corners: [
                    [-13.342, -39.630], [-33.567, -24.935],
                    [-35.918, -28.171], [-15.693, -42.866],
                    [-60.040, -103.905], [-80.266, -89.210],
                    [-82.617, -92.446], [-62.392, -107.141]
                ]
            });
        })
        .then(function() {
            return Plotly.relayout(gd, 'polar.sector', [-90, 90]);
        })
        .then(function() {
            return _run('half-sector, drag outward', [200, 200], [200, 230], {
                zoombox: [
                    [0, 121.352], [88.167, 121.352],
                    [142.658, -46.352], [0, -150],
                    [0, -150], [0, 0],
                    [0, 121.352], [0, 121.352],
                    [88.167, 121.352], [142.658, -46.352],
                    [0, -150], [0, -150],
                    [0, 0], [0, 121.352],
                    [0, 71.329], [51.823, 71.329],
                    [83.852, -27.245], [0, -88.16778784387097],
                    [0, -88.167], [0, 0],
                    [0, 71.329]
                ],
                corners: [
                    [73.602, 10.771], [65.877, 34.548],
                    [62.073, 33.312], [69.798, 9.535],
                    [121.177, 26.229], [113.452, 50.006],
                    [109.648, 48.770], [117.373, 24.993]
                ]
            });
        })
        .then(done, done.fail);
    });
});


describe('Polar plots with css transforms', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function _getLocalPos(element, point) {
        var bb = element.getBoundingClientRect();
        return [
            bb.left + point[0],
            bb.top + point[1]
        ];
    }

    function transformPlot(gd, transformString) {
        gd.style.webkitTransform = transformString;
        gd.style.MozTransform = transformString;
        gd.style.msTransform = transformString;
        gd.style.OTransform = transformString;
        gd.style.transform = transformString;
    }

    function _drag(start, dp) {
        var node = d3Select('.polar > .draglayer > .maindrag').node();
        var localStart = _getLocalPos(gd, start);
        return drag({node: node, dpos: dp, pos0: localStart});
    }

    function _hover(pos) {
        return new Promise(function(resolve, reject) {
            var localPos = _getLocalPos(gd, pos);
            gd.once('plotly_hover', function(d) {
                Lib.clearThrottle();
                resolve(d);
            });

            mouseEvent('mousemove', localPos[0], localPos[1]);

            setTimeout(function() {
                reject('plotly_hover did not get called!');
            }, 100);
        });
    }

    function _getVisiblePointsData() {
        return Array.from(
            document.querySelectorAll('.point').entries(),
            function(e) { return e[1]; }
        )
        .filter(function(e) { return window.getComputedStyle(e).display !== 'none'; })
        .map(function(e) { return e.__data__; });
    }

    var rVals = [100, 50, 50, 100];
    var thetaVals = [135, 135, 315, 315];
    var plotSize = [400, 400];
    var mock = {
        data: [{
            type: 'scatterpolar',
            r: rVals,
            theta: thetaVals,
            mode: 'markers',
            marker: {
                size: 20,
            }
        }],
        layout: {
            width: plotSize[0],
            height: plotSize[1],
            margin: {l: 0, t: 0, r: 0, b: 0},
            hovermode: 'closest'
        }
    };

    [{
        transform: 'scaleX(0.75)',
        hovered: 1,
        zoomed: [0, 1, 2, 3],
        selected: {numPoints: 2}
    }, {
        transform: 'scale(0.5)',
        hovered: 4,
        zoomed: [0, 3],
        selected: {numPoints: 3}
    }, {
        transform: 'scale(0.5) translate(-200px, 25%)',
        hovered: 4,
        zoomed: [0, 3],
        selected: {numPoints: 3}
    }].forEach(function(t) {
        var transform = t.transform;

        it('hover behaves correctly after css transform: ' + transform, function(done) {
            var hoverEvents = {};

            Plotly.newPlot(gd, Lib.extendDeep({}, mock))
            .then(function() {
                transformPlot(gd, transform);

                gd.on('plotly_hover', function(d) {
                    hoverEvents[d.points[0].pointIndex] = true;
                });
            })
            .then(function() { _hover([32, 32]); })
            .then(function() { _hover([65, 65]); })
            .then(function() { _hover([132, 132]); })
            .then(function() { _hover([165, 165]); })
            .then(function() {
                expect(Object.keys(hoverEvents).length).toBe(t.hovered);
            })
            .then(done, done.fail);
        });

        it('drag-zoom behaves correctly after css transform: ' + transform, function(done) {
            Plotly.newPlot(gd, Lib.extendDeep({}, mock))

            .then(function() {
                transformPlot(gd, transform);

                return _drag([10, 10], [50, 50]);
            })
            .then(function() {
                var points = _getVisiblePointsData();
                expect(points.map(function(e) { return e.i; })).toEqual(t.zoomed);
            })
            .then(done, done.fail);
        });

        it('select behaves correctly after css transform: ' + transform, function(done) {
            function _assertSelected(expectation) {
                var data = gd._fullData[0];
                var points = data.selectedpoints;
                expect(typeof(points) !== 'undefined').toBeTrue();
                if(expectation.numPoints) {
                    expect(points.length).toBe(expectation.numPoints);
                }
            }

            Plotly.newPlot(gd, Lib.extendDeep({}, mock))
            .then(function() {
                transformPlot(gd, transform);

                return Plotly.relayout(gd, 'dragmode', 'select');
            })
            .then(function() { return _drag([30, 30], [130, 130]); })
            .then(function() {
                _assertSelected(t.selected);
            })
            .then(done, done.fail);
        });
    });
});
