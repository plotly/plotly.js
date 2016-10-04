var d3 = require('d3');

var Plotly = require('@lib/index');
var Lib = require('@src/lib');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var mouseEvent = require('../assets/mouse_event');


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

            }).then(done);
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
            }).then(done);
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

                done();
            });
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

                var translate = Lib.getTranslate(points);
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
                assertPointTranslate([0, 540], [-540, 135]);
            })
            .then(done);
        });

    });

});
