var d3 = require('d3');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Drawing = require('@src/components/drawing');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');
var failTest = require('../assets/fail_test');


describe('zoom box element', function() {
    var mock = require('@mocks/14.json');

    var gd;
    beforeEach(function(done) {
        gd = createGraphDiv();

        var mockCopy = Lib.extendDeep({}, mock);
        mockCopy.layout.dragmode = 'zoom';

        Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(done);
    });

    afterEach(destroyGraphDiv);

    it('should be appended to the zoom layer', function() {
        var x0 = 100;
        var y0 = 200;
        var x1 = 150;
        var y1 = 200;

        mouseEvent('mousemove', x0, y0);
        expect(d3.selectAll('.zoomlayer > .zoombox').size())
            .toEqual(0);
        expect(d3.selectAll('.zoomlayer > .zoombox-corners').size())
            .toEqual(0);

        mouseEvent('mousedown', x0, y0);
        mouseEvent('mousemove', x1, y1);
        expect(d3.selectAll('.zoomlayer > .zoombox').size())
            .toEqual(1);
        expect(d3.selectAll('.zoomlayer > .zoombox-corners').size())
            .toEqual(1);

        mouseEvent('mouseup', x1, y1);
        expect(d3.selectAll('.zoomlayer > .zoombox').size())
            .toEqual(0);
        expect(d3.selectAll('.zoomlayer > .zoombox-corners').size())
            .toEqual(0);
    });
});

describe('restyle', function() {
    describe('scatter traces', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('reuses SVG fills', function(done) {
            var fills, firstToZero, secondToZero, firstToNext, secondToNext;
            var mock = Lib.extendDeep({}, require('@mocks/basic_area.json'));

            Plotly.plot(gd, mock.data, mock.layout).then(function() {
                // Assert there are two fills:
                fills = d3.selectAll('g.trace.scatter .js-fill')[0];

                // First is tozero, second is tonext:
                expect(d3.selectAll('g.trace.scatter .js-fill').size()).toEqual(2);
                expect(fills[0].classList.contains('js-tozero')).toBe(true);
                expect(fills[0].classList.contains('js-tonext')).toBe(false);
                expect(fills[1].classList.contains('js-tozero')).toBe(false);
                expect(fills[1].classList.contains('js-tonext')).toBe(true);

                firstToZero = fills[0];
                firstToNext = fills[1];
            }).then(function() {
                return Plotly.restyle(gd, {visible: [false]}, [1]);
            }).then(function() {
                // Trace 1 hidden leaves only trace zero's tozero fill:
                expect(d3.selectAll('g.trace.scatter .js-fill').size()).toEqual(1);
                expect(fills[0].classList.contains('js-tozero')).toBe(true);
                expect(fills[0].classList.contains('js-tonext')).toBe(false);
            }).then(function() {
                return Plotly.restyle(gd, {visible: [true]}, [1]);
            }).then(function() {
                // Reshow means two fills again AND order is preserved:
                fills = d3.selectAll('g.trace.scatter .js-fill')[0];

                // First is tozero, second is tonext:
                expect(d3.selectAll('g.trace.scatter .js-fill').size()).toEqual(2);
                expect(fills[0].classList.contains('js-tozero')).toBe(true);
                expect(fills[0].classList.contains('js-tonext')).toBe(false);
                expect(fills[1].classList.contains('js-tozero')).toBe(false);
                expect(fills[1].classList.contains('js-tonext')).toBe(true);

                secondToZero = fills[0];
                secondToNext = fills[1];

                // The identity of the first is retained:
                expect(firstToZero).toBe(secondToZero);

                // The second has been recreated so is different:
                expect(firstToNext).not.toBe(secondToNext);

                return Plotly.restyle(gd, 'visible', false);
            }).then(function() {
                expect(d3.selectAll('g.trace.scatter').size()).toEqual(0);

            })
            .catch(failTest)
            .then(done);
        });

        it('reuses SVG lines', function(done) {
            var lines, firstLine1, secondLine1, firstLine2, secondLine2;
            var mock = Lib.extendDeep({}, require('@mocks/basic_line.json'));

            Plotly.plot(gd, mock.data, mock.layout).then(function() {
                lines = d3.selectAll('g.scatter.trace .js-line');

                firstLine1 = lines[0][0];
                firstLine2 = lines[0][1];

                // One line for each trace:
                expect(lines.size()).toEqual(2);
            }).then(function() {
                return Plotly.restyle(gd, {visible: [false]}, [0]);
            }).then(function() {
                lines = d3.selectAll('g.scatter.trace .js-line');

                // Only one line now and it's equal to the second trace's line from above:
                expect(lines.size()).toEqual(1);
                expect(lines[0][0]).toBe(firstLine2);
            }).then(function() {
                return Plotly.restyle(gd, {visible: [true]}, [0]);
            }).then(function() {
                lines = d3.selectAll('g.scatter.trace .js-line');
                secondLine1 = lines[0][0];
                secondLine2 = lines[0][1];

                // Two lines once again:
                expect(lines.size()).toEqual(2);

                // First line has been removed and recreated:
                expect(firstLine1).not.toBe(secondLine1);

                // Second line was persisted:
                expect(firstLine2).toBe(secondLine2);
            })
            .catch(failTest)
            .then(done);
        });

        it('can change scatter mode', function(done) {
            var mock = Lib.extendDeep({}, require('@mocks/text_chart_basic.json'));

            function assertScatterModeSizes(lineSize, pointSize, textSize) {
                var gd3 = d3.select(gd),
                    lines = gd3.selectAll('g.scatter.trace .js-line'),
                    points = gd3.selectAll('g.scatter.trace path.point'),
                    texts = gd3.selectAll('g.scatter.trace text');

                expect(lines.size()).toEqual(lineSize);
                expect(points.size()).toEqual(pointSize);
                expect(texts.size()).toEqual(textSize);
            }

            Plotly.plot(gd, mock.data, mock.layout).then(function() {
                assertScatterModeSizes(2, 6, 9);

                return Plotly.restyle(gd, 'mode', 'lines');
            })
            .then(function() {
                assertScatterModeSizes(3, 0, 0);

                return Plotly.restyle(gd, 'mode', 'markers');
            })
            .then(function() {
                assertScatterModeSizes(0, 9, 0);

                return Plotly.restyle(gd, 'mode', 'markers+text');
            })
            .then(function() {
                assertScatterModeSizes(0, 9, 9);

                return Plotly.restyle(gd, 'mode', 'text');
            })
            .then(function() {
                assertScatterModeSizes(0, 0, 9);

                return Plotly.restyle(gd, 'mode', 'markers+text+lines');
            })
            .then(function() {
                assertScatterModeSizes(3, 9, 9);
            })
            .catch(failTest)
            .then(done);

        });
    });
});

describe('relayout', function() {

    describe('axis category attributes', function() {
        var mock = require('@mocks/basic_bar.json');

        var gd, mockCopy;

        beforeEach(function() {
            mockCopy = Lib.extendDeep({}, mock);
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should response to \'categoryarray\' and \'categoryorder\' updates', function(done) {
            function assertCategories(list) {
                d3.selectAll('g.xtick').each(function(_, i) {
                    var tick = d3.select(this).select('text');
                    expect(tick.html()).toEqual(list[i]);
                });
            }

            Plotly.plot(gd, mockCopy.data, mockCopy.layout).then(function() {
                assertCategories(['giraffes', 'orangutans', 'monkeys']);

                return Plotly.relayout(gd, 'xaxis.categoryorder', 'category descending');
            }).then(function() {
                var list = ['orangutans', 'monkeys', 'giraffes'];

                expect(gd._fullLayout.xaxis._initialCategories).toEqual(list);
                assertCategories(list);

                return Plotly.relayout(gd, 'xaxis.categoryorder', null);
            }).then(function() {
                assertCategories(['giraffes', 'orangutans', 'monkeys']);

                return Plotly.relayout(gd, {
                    'xaxis.categoryarray': ['monkeys', 'giraffes', 'orangutans']
                });
            }).then(function() {
                var list = ['monkeys', 'giraffes', 'orangutans'];

                expect(gd.layout.xaxis.categoryarray).toEqual(list);
                expect(gd._fullLayout.xaxis.categoryarray).toEqual(list);
                expect(gd._fullLayout.xaxis._initialCategories).toEqual(list);
                assertCategories(list);
            })
            .catch(failTest)
            .then(done);
        });

    });

    describe('axis ranges', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should translate points and text element', function(done) {
            var mockData = [{
                x: [1],
                y: [1],
                text: ['A'],
                mode: 'markers+text'
            }];

            function assertPointTranslate(pointT, textT) {
                var TOLERANCE = 10;

                var gd3 = d3.select(gd),
                    points = gd3.selectAll('g.scatter.trace path.point'),
                    texts = gd3.selectAll('g.scatter.trace text');

                expect(points.size()).toEqual(1);
                expect(texts.size()).toEqual(1);

                expect(points.attr('x')).toBe(null);
                expect(points.attr('y')).toBe(null);
                expect(texts.attr('transform')).toBe(null);

                var translate = Drawing.getTranslate(points);
                expect(Math.abs(translate.x - pointT[0])).toBeLessThan(TOLERANCE);
                expect(Math.abs(translate.y - pointT[1])).toBeLessThan(TOLERANCE);

                expect(Math.abs(texts.attr('x') - textT[0])).toBeLessThan(TOLERANCE);
                expect(Math.abs(texts.attr('y') - textT[1])).toBeLessThan(TOLERANCE);
            }

            Plotly.plot(gd, mockData).then(function() {
                assertPointTranslate([270, 135], [270, 135]);

                return Plotly.relayout(gd, 'xaxis.range', [2, 3]);
            })
            .then(function() {
                assertPointTranslate([-540, 135], [-540, 135]);
            })
            .catch(failTest)
            .then(done);
        });

    });

});

describe('subplot creation / deletion:', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    it('should clear orphan subplot when adding traces to blank graph', function(done) {

        function assertCartesianSubplot(len) {
            expect(d3.select('.subplot.xy').size()).toEqual(len);
            expect(d3.select('.subplot.x2y2').size()).toEqual(len);
            expect(d3.select('.x2title').size()).toEqual(len);
            expect(d3.select('.x2title').size()).toEqual(len);
            expect(d3.select('.ytitle').size()).toEqual(len);
            expect(d3.select('.ytitle').size()).toEqual(len);
        }

        Plotly.plot(gd, [], {
            xaxis: { title: 'X' },
            yaxis: { title: 'Y' },
            xaxis2: { title: 'X2', anchor: 'y2' },
            yaxis2: { title: 'Y2', anchor: 'x2' }
        })
        .then(function() {
            assertCartesianSubplot(1);

            return Plotly.addTraces(gd, [{
                type: 'scattergeo',
                lon: [10, 20, 30],
                lat: [20, 30, 10]
            }]);
        })
        .then(function() {
            assertCartesianSubplot(0);
        })
        .catch(failTest)
        .then(done);
    });

    it('puts plot backgrounds behind everything except if they overlap', function(done) {
        function checkBGLayers(behindCount, x2y2Count) {
            expect(gd.querySelectorAll('.bglayer rect.bg').length).toBe(behindCount);
            expect(gd.querySelectorAll('.subplot.x2y2 rect.bg').length).toBe(x2y2Count);

            // xy is the first subplot, so it never gets put in front of others
            expect(gd.querySelectorAll('.subplot.xy rect.bg').length).toBe(0);

            // xy3 is an overlay, so never gets its own bg
            expect(gd.querySelectorAll('.subplot.xy3 rect.bg').length).toBe(0);

            // verify that these are *all* the subplots and backgrounds we have
            expect(gd.querySelectorAll('.subplot').length).toBe(3);
            ['xy', 'x2y2', 'xy3'].forEach(function(subplot) {
                expect(gd.querySelectorAll('.subplot.' + subplot).length).toBe(1);
            });
            expect(gd.querySelectorAll('.bg').length).toBe(behindCount + x2y2Count);
        }

        Plotly.plot(gd, [
            {y: [1, 2, 3]},
            {y: [2, 3, 1], xaxis: 'x2', yaxis: 'y2'},
            {y: [3, 1, 2], yaxis: 'y3'}
        ], {
            xaxis: {domain: [0, 0.5]},
            xaxis2: {domain: [0.5, 1], anchor: 'y2'},
            yaxis: {domain: [0, 1]},
            yaxis2: {domain: [0.5, 1], anchor: 'x2'},
            yaxis3: {overlaying: 'y'},
            // legend makes its own .bg rect - delete so we can ignore that here
            showlegend: false
        })
        .then(function() {
            // touching but not overlapping: all backgrounds are in back
            checkBGLayers(2, 0);

            // now add a slight overlap: that's enough to put x2y2 in front
            return Plotly.relayout(gd, {'xaxis2.domain': [0.49, 1]});
        })
        .then(function() {
            checkBGLayers(1, 1);

            // x ranges overlap, but now y ranges are disjoint
            return Plotly.relayout(gd, {'xaxis2.domain': [0, 1], 'yaxis.domain': [0, 0.5]});
        })
        .then(function() {
            checkBGLayers(2, 0);

            // regular inset
            return Plotly.relayout(gd, {
                'xaxis.domain': [0, 1],
                'yaxis.domain': [0, 1],
                'xaxis2.domain': [0.6, 0.9],
                'yaxis2.domain': [0.6, 0.9]
            });
        })
        .then(function() {
            checkBGLayers(1, 1);
        })
        .catch(failTest)
        .then(done);
    });
});
