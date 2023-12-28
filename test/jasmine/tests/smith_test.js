var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var Smith = require('../../../src/plots/smith');

var basicMock = require('../../image/mocks/smith_basic.json');

var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var mouseEvent = require('../assets/mouse_event');
var click = require('../assets/click');
var doubleClick = require('../assets/double_click');

describe('Test smith plots defaults:', function() {
    var layoutOut;

    function _supply(layoutIn, fullData) {
        fullData = fullData || [{
            type: 'scattersmith',
            real: [],
            imag: [],
            subplot: 'smith'
        }];

        layoutOut = {
            noUirevision: true,
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

    it('should propagate axis *color* settings', function() {
        _supply({
            smith: {
                imaginaryaxis: {color: 'red'},
                realaxis: {color: 'blue'}
            }
        });

        expect(layoutOut.smith.imaginaryaxis.linecolor).toBe('red');
        expect(layoutOut.smith.imaginaryaxis.gridcolor).toBe('rgb(255, 153, 153)', 'blend by 60% with bgcolor');

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
            real: [1, 2],
            imag: [90, 180],
            visible: true,
            subplot: 'smith'
        }]);

        expect(layoutOut.smith.realaxis.hoverformat).toBe('g');
        expect(layoutOut.smith.imaginaryaxis.hoverformat).toBe('g');
    });
});

describe('Test relayout on smith subplots:', function() {
    afterEach(destroyGraphDiv);

    it('should be able to relayout imaginary axis ticks', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, basicMock);

        function check(cnt, expected) {
            var ticks = d3SelectAll('path.imaginaryaxistick');

            expect(ticks.size()).toBe(cnt, '# of ticks');
            ticks.each(function() {
                expect(d3Select(this).attr('d')).toBe(expected);
            });
        }

        Plotly.newPlot(gd, fig).then(function() {
            check(0);
            return Plotly.relayout(gd, 'smith.imaginaryaxis', {ticks: 'inside'});
        })
        .then(function() {
            check(26, 'M-0.5,0h-5');
            return Plotly.relayout(gd, 'smith.imaginaryaxis', {ticks: 'outside'});
        })
        .then(function() {
            check(26, 'M0.5,0h5');
            return Plotly.relayout(gd, 'smith.imaginaryaxis', {ticks: ''});
        })
        .then(function() {
            check(0);
            return Plotly.relayout(gd, 'smith.imaginaryaxis', {ticks: 'inside'});
        })
        .then(function() {
            check(26, 'M-0.5,0h-5');
        })
        .then(done, done.fail);
    });

    it('should be able to relayout real axis ticks', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, basicMock);

        function check(cnt, expected) {
            var ticks = d3SelectAll('path.xtick');

            expect(ticks.size()).toBe(cnt, '# of ticks');
            ticks.each(function() {
                expect(d3Select(this).attr('d')).toBe(expected);
            });
        }

        Plotly.newPlot(gd, fig).then(function() {
            check(0);
            return Plotly.relayout(gd, 'smith.realaxis', {ticks: 'top'});
        })
        .then(function() {
            check(5, 'M0,-0.5v-5');
            return Plotly.relayout(gd, 'smith.realaxis', {ticks: 'bottom'});
        })
        .then(function() {
            check(5, 'M0,0.5v5');
            return Plotly.relayout(gd, 'smith.realaxis', {ticks: ''});
        })
        .then(function() {
            check(0);
            return Plotly.relayout(gd, 'smith.realaxis', {ticks: 'top'});
        })
        .then(function() {
            check(5, 'M0,-0.5v-5');
        })
        .then(done, done.fail);
    });

    it('should clean up its framework, clip paths and info layers when getting deleted', function(done) {
        var gd = createGraphDiv();
        var fig = Lib.extendDeep({}, basicMock);
        var traces = Lib.extendDeep([], fig.data);
        var inds = traces.map(function(_, i) { return i; });

        function _assert(exp) {
            expect(d3SelectAll('g.smith').size()).toBe(exp.subplot, '# subplot layer');

            var clipCnt = 0;
            d3SelectAll('clipPath').each(function() {
                if(/smith-for-traces/.test(this.id)) clipCnt++;
            });
            expect(clipCnt).toBe(exp.clip, '# clip paths');
        }

        Plotly.newPlot(gd, fig).then(function() {
            _assert({subplot: 1, clip: 1});

            return Plotly.deleteTraces(gd, inds);
        })
        .then(function() {
            _assert({subplot: 0, clip: 0});

            return Plotly.addTraces(gd, traces);
        })
        .then(function() {
            _assert({subplot: 1, clip: 1});
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
        var fig = Lib.extendDeep({}, basicMock);
        var ptPos = [400, 60];
        var blankPos = [400, 100];
        var marginPos = [20, 20];

        var exp = [{
            real: 0,
            imag: 1
        }];

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
            _assert(exp, {
                plotly_hover: 1
            }, 'after hover on pt');
        })

        .then(function() { _unhover(blankPos);})
        .then(function() {
            _assert(exp, {
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
            _assert(exp, {
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
            _assert(exp, {
                plotly_hover: 2,
                plotly_unhover: 1,
                plotly_click: 4,
                plotly_doubleclick: 1,
                plotly_relayout: 1
            }, 'after modified click');
        })
        .then(function() { _click(ptPos, rightClickOpts); })
        .then(function() {
            _assert(exp, {
                plotly_hover: 2,
                plotly_unhover: 1,
                plotly_click: 5,
                plotly_doubleclick: 1,
                plotly_relayout: 1
            }, 'after right click');
        })
        .then(done, done.fail);
    });
});
