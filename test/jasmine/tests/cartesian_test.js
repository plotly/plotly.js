var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;

var Plotly = require('@lib/index');
var Lib = require('@src/lib');
var Drawing = require('@src/components/drawing');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');

var assertD3Data = require('../assets/custom_assertions').assertD3Data;

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
            function getFills() {
                return d3SelectAll('g.trace.scatter .fills>g');
            }

            Plotly.newPlot(gd, mock.data, mock.layout).then(function() {
                fills = getFills();

                // Assert there are two fills, first is tozero, second is tonext
                assertD3Data(fills, ['_ownFill', '_nextFill']);

                firstToZero = fills[0][0];
                firstToNext = fills[0][1];

                return Plotly.restyle(gd, {visible: [false]}, [1]);
            }).then(function() {
                fills = getFills();
                // Trace 1 hidden leaves only trace zero's tozero fill:
                assertD3Data(fills, ['_ownFill']);

                return Plotly.restyle(gd, {visible: [true]}, [1]);
            }).then(function() {
                fills = getFills();

                // Reshow means two fills again AND order is preserved
                // First is tozero, second is tonext:
                assertD3Data(fills, ['_ownFill', '_nextFill']);

                secondToZero = fills[0][0];
                secondToNext = fills[0][1];

                // The identity of the first is retained:
                expect(firstToZero).toBe(secondToZero);

                // The second has been recreated so is different:
                expect(firstToNext).not.toBe(secondToNext);

                return Plotly.restyle(gd, 'visible', false);
            }).then(function() {
                expect(d3SelectAll('g.trace.scatter').size()).toBe(0);
            })
            .then(done, done.fail);
        });

        it('reuses SVG lines', function(done) {
            var lines, firstLine1, secondLine1, firstLine2, secondLine2;
            var mock = Lib.extendDeep({}, require('@mocks/basic_line.json'));

            Plotly.newPlot(gd, mock.data, mock.layout).then(function() {
                lines = d3SelectAll('g.scatter.trace .js-line');

                firstLine1 = lines[0][0];
                firstLine2 = lines[0][1];

                // One line for each trace:
                expect(lines.size()).toEqual(2);
            }).then(function() {
                return Plotly.restyle(gd, {visible: [false]}, [0]);
            }).then(function() {
                lines = d3SelectAll('g.scatter.trace .js-line');

                // Only one line now and it's equal to the second trace's line from above:
                expect(lines.size()).toEqual(1);
                expect(lines[0][0]).toBe(firstLine2);
            }).then(function() {
                return Plotly.restyle(gd, {visible: [true]}, [0]);
            }).then(function() {
                lines = d3SelectAll('g.scatter.trace .js-line');
                secondLine1 = lines[0][0];
                secondLine2 = lines[0][1];

                // Two lines once again:
                expect(lines.size()).toEqual(2);

                // First line has been removed and recreated:
                expect(firstLine1).not.toBe(secondLine1);

                // Second line was persisted:
                expect(firstLine2).toBe(secondLine2);
            })
            .then(done, done.fail);
        });

        it('can change scatter mode', function(done) {
            var mock = Lib.extendDeep({}, require('@mocks/text_chart_basic.json'));

            function assertScatterModeSizes(lineSize, pointSize, textSize) {
                var gd3 = d3Select(gd);
                var lines = gd3.selectAll('g.scatter.trace .js-line');
                var points = gd3.selectAll('g.scatter.trace path.point');
                var texts = gd3.selectAll('g.scatter.trace text');

                expect(lines.size()).toEqual(lineSize);
                expect(points.size()).toEqual(pointSize);
                expect(texts.size()).toEqual(textSize);
            }

            Plotly.newPlot(gd, mock.data, mock.layout).then(function() {
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
            .then(done, done.fail);
        });

        it('can legend-hide the second and only scatter trace', function(done) {
            Plotly.newPlot(gd, [
                {y: [1, 2, 3], type: 'bar'},
                {y: [1, 2, 3], xaxis: 'x2', yaxis: 'y2', type: 'scatter'}
            ], {
                xaxis: {domain: [0, 0.4]},
                xaxis2: {domain: [0.6, 1]},
                yaxis2: {anchor: 'x2'},
                width: 600,
                height: 400
            })
            .then(function() {
                expect(d3Select('.scatter').size()).toBe(1);
                return Plotly.restyle(gd, {visible: 'legendonly'}, 1);
            })
            .then(function() {
                expect(d3Select('.scatter').size()).toBe(0);
                return Plotly.restyle(gd, {visible: true}, 1);
            })
            .then(function() {
                expect(d3Select('.scatter').size()).toBe(1);
            })
            .then(done, done.fail);
        });

        it('@gl can legend-hide the second and only scattergl trace', function(done) {
            Plotly.newPlot(gd, [
                {y: [1, 2, 3], type: 'bar'},
                {y: [1, 2, 3], xaxis: 'x2', yaxis: 'y2', type: 'scattergl'}
            ], {
                xaxis: {domain: [0, 0.4]},
                xaxis2: {domain: [0.6, 1]},
                yaxis2: {anchor: 'x2'},
                width: 600,
                height: 400
            })
            .then(function() {
                expect(!!gd._fullLayout._plots.x2y2._scene).toBe(true);
                return Plotly.restyle(gd, {visible: 'legendonly'}, 1);
            })
            .then(function() {
                expect(!!gd._fullLayout._plots.x2y2._scene).toBe(true);
                return Plotly.restyle(gd, {visible: true}, 1);
            })
            .then(function() {
                expect(!!gd._fullLayout._plots.x2y2._scene).toBe(true);
            })
            .then(done, done.fail);
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
                d3SelectAll('g.xtick').each(function(_, i) {
                    var tick = d3Select(this).select('text');
                    expect(tick.html()).toEqual(list[i]);
                });
            }

            Plotly.newPlot(gd, mockCopy.data, mockCopy.layout).then(function() {
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
            .then(done, done.fail);
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

                var gd3 = d3Select(gd);
                var points = gd3.selectAll('g.scatter.trace path.point');
                var texts = gd3.selectAll('g.scatter.trace text');

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

            Plotly.newPlot(gd, mockData).then(function() {
                assertPointTranslate([270, 135], [270, 135]);

                return Plotly.relayout(gd, 'xaxis.range', [2, 3]);
            })
            .then(function() {
                assertPointTranslate([-540, 135], [-540, 135]);
            })
            .then(done, done.fail);
        });

        it('should autorange correctly with margin pushers', function(done) {
            // lock down https://github.com/plotly/plotly.js/issues/2428
            var expectedXRange = [-0.3068, 1.3068];
            var expectedYRange = [0.5184, 2.4816];
            var foundXRange, foundYRange;
            Plotly.newPlot(gd, [{
                // really long name, so legend pushes margins and decreases xaxis._length
                name: 'loooooooooooongloooooooooooong',
                y: [1, 2],
                // really big markers, so autorange depends on length
                // and with markers x range is padded (and 5% padding depends on length)
                marker: {size: 100}
            }], {
                showlegend: true,
                width: 800,
                height: 500
            })
            .then(function() {
                foundXRange = gd.layout.xaxis.range;
                foundYRange = gd.layout.yaxis.range;
                // less stringent test at first - for some reason I get a slightly different
                // legend size even in my regular browser from when I run the tests locally
                expect(foundXRange).toBeCloseToArray(expectedXRange, 1.5);
                expect(foundYRange).toBeCloseToArray(expectedYRange, 1.5);

                return Plotly.relayout(gd, {'xaxis.autorange': true, 'yaxis.autorange': true});
            })
            .then(function() {
                // the most important thing is that the ranges don't change when you re-autorange
                expect(gd.layout.xaxis.range).toBeCloseToArray(foundXRange, 5);
                expect(gd.layout.yaxis.range).toBeCloseToArray(foundYRange, 5);
            })
            .then(done, done.fail);
        });
    });

    describe('axis line visibility', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('can show and hide axis lines', function(done) {
            Plotly.newPlot(gd, [{y: [1, 2]}], {width: 400, height: 400})
            .then(function() {
                expect(gd.querySelector('.xlines-above').attributes.d.value).toBe('M0,0');
                expect(gd.querySelector('.ylines-above').attributes.d.value).toBe('M0,0');

                return Plotly.relayout(gd, {'xaxis.showline': true, 'yaxis.showline': true});
            })
            .then(function() {
                expect(gd.querySelector('.xlines-above').attributes.d.value).not.toBe('M0,0');
                expect(gd.querySelector('.ylines-above').attributes.d.value).not.toBe('M0,0');

                return Plotly.relayout(gd, {'xaxis.showline': false, 'yaxis.showline': false});
            })
            .then(function() {
                expect(gd.querySelector('.xlines-above').attributes.d.value).toBe('M0,0');
                expect(gd.querySelector('.ylines-above').attributes.d.value).toBe('M0,0');
            })
            .then(done, done.fail);
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
        function assertOrphanSubplot(len) {
            expect(d3Select('.subplot.xy').size()).toEqual(len);
            expect(d3Select('.ytitle').size()).toEqual(len);
            expect(d3Select('.ytitle').size()).toEqual(len);

            // we only make one orphan subplot now
            expect(d3Select('.subplot.x2y2').size()).toEqual(0);
            expect(d3Select('.x2title').size()).toEqual(0);
            expect(d3Select('.x2title').size()).toEqual(0);
        }

        Plotly.newPlot(gd, [], {
            xaxis: { title: 'X' },
            yaxis: { title: 'Y' },
            xaxis2: { title: 'X2', anchor: 'y2' },
            yaxis2: { title: 'Y2', anchor: 'x2' }
        })
        .then(function() {
            assertOrphanSubplot(1);

            return Plotly.addTraces(gd, [{
                type: 'scattergeo',
                lon: [10, 20, 30],
                lat: [20, 30, 10]
            }]);
        })
        .then(function() {
            assertOrphanSubplot(0);
        })
        .then(done, done.fail);
    });

    it('should remove unused axes when deleting traces', function(done) {
        Plotly.newPlot(gd,
            [{y: [1, 2, 3]}, {y: [10, 30, 20], yaxis: 'y2'}],
            {yaxis2: {side: 'right', overlaying: 'y', title: 'Hi!'}}
        )
        .then(function() {
            expect(gd.querySelectorAll('.xy2,.xy2-x,.xy2-y').length).not.toBe(0);
            expect(gd.querySelectorAll('.y2title').length).toBe(1);
            expect(gd._fullLayout._subplots.cartesian).toEqual(['xy', 'xy2']);
            expect(gd._fullLayout._subplots.yaxis).toEqual(['y', 'y2']);

            return Plotly.deleteTraces(gd, [1]);
        })
        .then(function() {
            expect(gd.querySelectorAll('.xy2,.xy2-x,.xy2-y').length).toBe(0);
            expect(gd.querySelectorAll('.y2title').length).toBe(0);
            expect(gd._fullLayout._subplots.cartesian).toEqual(['xy']);
            expect(gd._fullLayout._subplots.yaxis).toEqual(['y']);
        })
        .then(done, done.fail);
    });

    function checkBGLayers(behindCount, x2y2Count, subplots) {
        expect(gd.querySelectorAll('.bglayer rect.bg').length).toBe(behindCount);
        expect(gd.querySelectorAll('.subplot.x2y2 rect.bg').length).toBe(x2y2Count);

        // xy is the first subplot, so it never gets put in front of others
        expect(gd.querySelectorAll('.subplot.xy rect.bg').length).toBe(0);

        // xy3 is an overlay, so never gets its own bg
        expect(gd.querySelectorAll('.subplot.xy3 rect.bg').length).toBe(0);

        // verify that these are *all* the subplots and backgrounds we have
        expect(gd.querySelectorAll('.subplot').length).toBe(subplots.length);
        subplots.forEach(function(subplot) {
            expect(gd.querySelectorAll('.subplot.' + subplot).length).toBe(1);
        });
        expect(gd.querySelectorAll('.bg').length).toBe(behindCount + x2y2Count);
    }

    it('makes new backgrounds when switching between overlaying and separate subplots', function(done) {
        Plotly.newPlot(gd, [
            {x: [1], y: [2]},
            {x: [3], y: [4], xaxis: 'x2', yaxis: 'y2'}
        ], {
            xaxis2: {overlaying: 'x'},
            yaxis2: {overlaying: 'y'},
            plot_bgcolor: 'red',
            showlegend: false
        })
        .then(function() {
            checkBGLayers(1, 0, ['xy', 'x2y2']);

            return Plotly.relayout(gd, {
                'xaxis.domain': [0, 0.4],
                'xaxis2.domain': [0.6, 1],
                'xaxis2.overlaying': null
            });
        })
        .then(function() {
            checkBGLayers(2, 0, ['xy', 'x2y2']);

            return Plotly.relayout(gd, {
                'xaxis2.overlaying': 'x'
            });
        })
        .then(function() {
            checkBGLayers(1, 0, ['xy', 'x2y2']);

            return Plotly.relayout(gd, {
                'xaxis.domain': [0, 0.6],
                'xaxis2.domain': [0.4, 1],
                'xaxis2.overlaying': null
            });
        })
        .then(function() {
            checkBGLayers(1, 1, ['xy', 'x2y2']);
        })
        .then(done, done.fail);
    });

    it('puts plot backgrounds behind everything except if they overlap', function(done) {
        Plotly.newPlot(gd, [
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
            showlegend: false,
            plot_bgcolor: '#d3d3d3'
        })
        .then(function() {
            // touching but not overlapping: all backgrounds are in back
            checkBGLayers(2, 0, ['xy', 'x2y2', 'xy3']);

            // now add a slight overlap: that's enough to put x2y2 in front
            return Plotly.relayout(gd, {'xaxis2.domain': [0.49, 1]});
        })
        .then(function() {
            checkBGLayers(1, 1, ['xy', 'x2y2', 'xy3']);

            // x ranges overlap, but now y ranges are disjoint
            return Plotly.relayout(gd, {'xaxis2.domain': [0, 1], 'yaxis.domain': [0, 0.5]});
        })
        .then(function() {
            checkBGLayers(2, 0, ['xy', 'x2y2', 'xy3']);

            // regular inset
            return Plotly.relayout(gd, {
                'xaxis.domain': [0, 1],
                'yaxis.domain': [0, 1],
                'xaxis2.domain': [0.6, 0.9],
                'yaxis2.domain': [0.6, 0.9]
            });
        })
        .then(function() {
            checkBGLayers(1, 1, ['xy', 'x2y2', 'xy3']);
        })
        .then(done, done.fail);
    });

    it('puts not have backgrounds nodes when plot and paper color match', function(done) {
        Plotly.newPlot(gd, [
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
            showlegend: false,
            plot_bgcolor: 'white',
            paper_bgcolor: 'white'
        })
        .then(function() {
            // touching but not overlapping, matching colors -> no <rect.bg>
            checkBGLayers(0, 0, ['xy', 'x2y2', 'xy3']);

            // now add a slight overlap: that's enough to put x2y2 in front
            return Plotly.relayout(gd, {'xaxis2.domain': [0.49, 1]});
        })
        .then(function() {
            // need to draw one background <rect>
            checkBGLayers(0, 1, ['xy', 'x2y2', 'xy3']);

            // x ranges overlap, but now y ranges are disjoint
            return Plotly.relayout(gd, {'xaxis2.domain': [0, 1], 'yaxis.domain': [0, 0.5]});
        })
        .then(function() {
            // disjoint, matching colors -> no <rect.bg>
            checkBGLayers(0, 0, ['xy', 'x2y2', 'xy3']);

            // regular inset
            return Plotly.relayout(gd, {
                'xaxis.domain': [0, 1],
                'yaxis.domain': [0, 1],
                'xaxis2.domain': [0.6, 0.9],
                'yaxis2.domain': [0.6, 0.9]
            });
        })
        .then(function() {
            // need to draw one background <rect>
            checkBGLayers(0, 1, ['xy', 'x2y2', 'xy3']);

            // change paper color
            return Plotly.relayout(gd, 'paper_bgcolor', 'black');
        })
        .then(function() {
            // need a background <rect> on main subplot to distinguish plot from
            // paper color
            checkBGLayers(1, 1, ['xy', 'x2y2', 'xy3']);

            // change bg colors to same semi-transparent color
            return Plotly.relayout(gd, {
                'paper_bgcolor': 'rgba(255,0,0,0.2)',
                'plot_bgcolor': 'rgba(255,0,0,0.2)'
            });
        })
        .then(function() {
            // still need a <rect.bg> to get correct semi-transparent look
            checkBGLayers(1, 1, ['xy', 'x2y2', 'xy3']);
        })
        .then(done, done.fail);
    });

    it('should clear overlaid subplot trace layers on restyle', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/overlaying-axis-lines.json'));

        function _assert(xyCnt, x2y2Cnt) {
            expect(d3Select('.subplot.xy').select('.plot').selectAll('.trace').size())
                .toBe(xyCnt, 'has correct xy subplot trace count');
            expect(d3Select('.overplot').select('.x2y2').selectAll('.trace').size())
                .toBe(x2y2Cnt, 'has correct x2y2 oveylaid subplot trace count');
        }

        Plotly.newPlot(gd, fig).then(function() {
            _assert(1, 1);
            return Plotly.restyle(gd, 'visible', false, [1]);
        })
        .then(function() {
            _assert(1, 0);
            return Plotly.restyle(gd, 'visible', true);
        })
        .then(function() {
            _assert(1, 1);
            return Plotly.restyle(gd, 'visible', false);
        })
        .then(function() {
            _assert(0, 0);
        })
        .then(done, done.fail);
    });

    it('should clear obsolete content out of axis layers when relayout\'ing *layer*', function(done) {
        var fig = Lib.extendDeep({}, require('@mocks/overlaying-axis-lines.json'));

        function assertPathDatum(sel, expected, msg) {
            expect(sel.attr('d') === null ? false : true).toBe(expected, msg);
        }

        function assertChildrenCnt(sel, expected, msg) {
            expect(sel.selectAll('*').size()).toBe(expected, msg);
        }

        function _assert(xBelow, yBelow, xAbove, yAbove) {
            var g = d3Select('.subplot.xy');

            assertPathDatum(g.select('.xlines-below'), xBelow[0], 'xlines below');
            assertChildrenCnt(g.select('.xaxislayer-below'), xBelow[1], 'xaxislayer below');

            assertPathDatum(g.select('.ylines-below'), yBelow[0], 'ylines below');
            assertChildrenCnt(g.select('.yaxislayer-below'), yBelow[1], 'yaxislayer below');

            assertPathDatum(g.select('.xlines-above'), xAbove[0], 'xlines above');
            assertChildrenCnt(g.select('.xaxislayer-above'), xAbove[1], 'xaxislayer above');

            assertPathDatum(g.select('.ylines-above'), yAbove[0], 'ylines above');
            assertChildrenCnt(g.select('.yaxislayer-above'), yAbove[1], 'yaxislayer above');
        }

        Plotly.newPlot(gd, fig).then(function() {
            _assert(
                [false, 0],
                [false, 0],
                [true, 10],
                [true, 10]
            );
            return Plotly.relayout(gd, 'xaxis.layer', 'below traces');
        })
        .then(function() {
            _assert(
                [true, 10],
                [false, 0],
                [false, 0],
                [true, 10]
            );
            return Plotly.relayout(gd, 'yaxis.layer', 'below traces');
        })
        .then(function() {
            _assert(
                [true, 10],
                [true, 10],
                [false, 0],
                [false, 0]
            );
            return Plotly.relayout(gd, { 'xaxis.layer': null, 'yaxis.layer': null });
        })
        .then(function() {
            _assert(
                [false, 0],
                [false, 0],
                [true, 10],
                [true, 10]
            );
            return Plotly.relayout(gd, { 'xaxis.layer': 'below traces', 'yaxis.layer': 'below traces' });
        })
        .then(function() {
            _assert(
                [true, 10],
                [true, 10],
                [false, 0],
                [false, 0]
            );
        })
        .then(done, done.fail);
    });

    it('should clear obsolete content out of axis layers when changing overlaying configuation', function(done) {
        function data() {
            return [
                {x: [1, 2], y: [1, 2]},
                {x: [1, 2], y: [1, 2], xaxis: 'x2', yaxis: 'y2'}
            ];
        }

        function fig0() {
            return {
                data: data(),
                layout: {
                    xaxis2: {side: 'top', overlaying: 'x'},
                    yaxis2: {side: 'right', overlaying: 'y'}
                }
            };
        }

        function fig1() {
            return {
                data: data(),
                layout: {
                    xaxis2: {side: 'top', domain: [0.37, 1]},
                    yaxis2: {side: 'right', overlaying: 'y'}
                }
            };
        }

        function getParentClassName(query, level) {
            level = level || 1;
            var cl = gd.querySelector('g.cartesianlayer');
            var node = cl.querySelector(query);
            while(level--) node = node.parentNode;
            return node.getAttribute('class');
        }

        function _assert(msg, exp) {
            expect(getParentClassName('.xtick'))
                .toBe(exp.xtickParent, 'xitck parent - ' + msg);
            expect(getParentClassName('.x2tick'))
                .toBe(exp.x2tickParent, 'x2tick parent - ' + msg);
            expect(getParentClassName('.trace' + gd._fullData[0].uid, 2))
                .toBe(exp.trace0Parent, 'data[0] parent - ' + msg);
            expect(getParentClassName('.trace' + gd._fullData[1].uid, 2))
                .toBe(exp.trace1Parent, 'data[1] parent - ' + msg);
        }

        Plotly.react(gd, fig0())
        .then(function() {
            _assert('x2/y2 both overlays', {
                xtickParent: 'xaxislayer-above',
                x2tickParent: 'x2y2-x',
                trace0Parent: 'plot',
                trace1Parent: 'x2y2'
            });
        })
        .then(function() {
            return Plotly.react(gd, fig1());
        })
        .then(function() {
            _assert('x2 free / y2 overlaid', {
                xtickParent: 'xaxislayer-above',
                x2tickParent: 'xaxislayer-above',
                trace0Parent: 'plot',
                trace1Parent: 'plot'
            });
        })
        .then(function() {
            return Plotly.react(gd, fig0());
        })
        .then(function() {
            _assert('back to x2/y2 both overlays', {
                xtickParent: 'xaxislayer-above',
                x2tickParent: 'x2y2-x',
                trace0Parent: 'plot',
                trace1Parent: 'x2y2'
            });
        })
        .then(done, done.fail);
    });

    it('clear axis ticks, labels and title when relayout an axis to `*visible:false*', function(done) {
        function _assert(xaxis, yaxis) {
            var g = d3Select('.subplot.xy');
            var info = d3Select('.infolayer');

            expect(g.selectAll('.xtick').size()).toBe(xaxis[0], 'x tick cnt');
            expect(g.selectAll('.gridlayer .xgrid').size()).toBe(xaxis[1], 'x gridline cnt');
            expect(info.selectAll('.g-xtitle').size()).toBe(xaxis[2], 'x title cnt');

            expect(g.selectAll('.ytick').size()).toBe(yaxis[0], 'y tick cnt');
            expect(g.selectAll('.gridlayer .ygrid').size()).toBe(yaxis[1], 'y gridline cnt');
            expect(info.selectAll('.g-ytitle').size()).toBe(yaxis[2], 'y title cnt');
        }

        Plotly.newPlot(gd, [{
            y: [1, 2, 1]
        }], {
            xaxis: {title: 'X'},
            yaxis: {title: 'Y'}
        })
        .then(function() {
            _assert([5, 4, 1], [6, 6, 1]);
            return Plotly.relayout(gd, 'xaxis.visible', false);
        })
        .then(function() {
            _assert([0, 0, 0], [6, 6, 1]);
            return Plotly.relayout(gd, 'yaxis.visible', false);
        })
        .then(function() {
            _assert([0, 0, 0], [0, 0, 0]);
            return Plotly.relayout(gd, {
                'xaxis.visible': true,
                'yaxis.visible': true
            });
        })
        .then(function() {
            _assert([5, 4, 1], [6, 6, 1]);
        })
        .then(done, done.fail);
    });

    it('clears secondary labels and divider when updating out of axis type multicategory', function(done) {
        function _assert(msg, exp) {
            var gd3 = d3Select(gd);
            expect(gd3.selectAll('.xtick > text').size())
                .toBe(exp.tickCnt, msg + ' # labels');
            expect(gd3.selectAll('.xtick2 > text').size())
                .toBe(exp.tick2Cnt, msg + ' # secondary labels');
            expect(gd3.selectAll('.xdivider').size())
                .toBe(exp.dividerCnt, msg + ' # dividers');
        }

        Plotly.react(gd, [{
            type: 'bar',
            x: ['a', 'b', 'c'],
            y: [1, 2, 1]
        }])
        .then(function() {
            _assert('base - category axis', {
                tickCnt: 3,
                tick2Cnt: 0,
                dividerCnt: 0
            });
        })
        .then(function() {
            return Plotly.react(gd, [{
                type: 'bar',
                x: [
                    ['d', 'd', 'e'],
                    ['a', 'b', 'c']
                ],
                y: [1, 2, 3]
            }]);
        })
        .then(function() {
            _assert('multicategory axis', {
                tickCnt: 3,
                tick2Cnt: 2,
                dividerCnt: 3
            });
        })
        .then(function() {
            return Plotly.react(gd, [{
                type: 'bar',
                x: ['a', 'b', 'c'],
                y: [1, 2, 1]
            }]);
        })
        .then(function() {
            _assert('back to category axis', {
                tickCnt: 3,
                tick2Cnt: 0,
                dividerCnt: 0
            });
        })
        .then(done, done.fail);
    });

    it('clears secondary labels and divider when updating out of axis type multicategory (y-axis case)', function(done) {
        function _assert(msg, exp) {
            var gd3 = d3Select(gd);
            expect(gd3.selectAll('.ytick > text').size())
                .toBe(exp.tickCnt, msg + ' # labels');
            expect(gd3.selectAll('.ytick2 > text').size())
                .toBe(exp.tick2Cnt, msg + ' # secondary labels');
            expect(gd3.selectAll('.ydivider').size())
                .toBe(exp.dividerCnt, msg + ' # dividers');
        }

        Plotly.react(gd, [{
            type: 'bar',
            orientation: 'h',
            y: ['a', 'b', 'c'],
            x: [1, 2, 1]
        }])
        .then(function() {
            _assert('base - category axis', {
                tickCnt: 3,
                tick2Cnt: 0,
                dividerCnt: 0
            });
        })
        .then(function() {
            return Plotly.react(gd, [{
                type: 'bar',
                orientation: 'h',
                y: [
                    ['d', 'd', 'e'],
                    ['a', 'b', 'c']
                ],
                x: [1, 2, 3]
            }]);
        })
        .then(function() {
            _assert('multicategory axis', {
                tickCnt: 3,
                tick2Cnt: 2,
                dividerCnt: 3
            });
        })
        .then(function() {
            return Plotly.react(gd, [{
                type: 'bar',
                orientation: 'h',
                y: ['a', 'b', 'c'],
                x: [1, 2, 1]
            }]);
        })
        .then(function() {
            _assert('back to category axis', {
                tickCnt: 3,
                tick2Cnt: 0,
                dividerCnt: 0
            });
        })
        .then(done, done.fail);
    });
});
