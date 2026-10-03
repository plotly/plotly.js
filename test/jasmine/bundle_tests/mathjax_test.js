var Plotly = require('../../../lib/index');
var Fx = require('../../../src/components/fx');
var Lib = require('../../../src/lib');
var d3Select = require('../../strict-d3').select;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var loadScript = require('../assets/load_script');
var delay = require('../assets/delay');

// eslint-disable-next-line no-undef
var mathjaxVersion = __karma__.config.mathjaxVersion;

describe('Test MathJax v' + mathjaxVersion + ':', function() {
    beforeAll(function(done) {
        const src = mathjaxVersion === 3 ?
            '/base/node_modules/@plotly/mathjax-v3/es5/tex-svg.js' :
            '/base/node_modules/@plotly/mathjax-v4/tex-svg.js';

        // TODO: `?config=` is not needed for MathJax v3 and onward,
        // should we adjust these tests?
        
        // N.B. we have to load MathJax "dynamically" as Karma
        // does not undefined the MathJax's `?config=` parameter.
        //
        // Now with the mathjax_config no longer needed,
        // it might be nice to move these tests in the "regular" test
        // suites, but to do that we'll need to find a way to remove MathJax from
        // page without breaking things downstream.

        loadScript(src, done);
    });

    describe('Test axis title scoot:', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        function assertNoIntersect(msg) {
            var gd3 = d3Select(gd);
            var xTitle = gd3.select('.g-xtitle');
            var xTicks = gd3.selectAll('.xtick > text');

            expect(xTitle.size()).toBe(1, '1 x-axis title');
            expect(xTicks.size()).toBeGreaterThan(1, 'x-axis ticks');

            var titleTop = xTitle.node().getBoundingClientRect().top;

            xTicks.each(function(_, i) {
                var tickBottom = this.getBoundingClientRect().bottom;
                expect(tickBottom).toBeLessThan(titleTop, 'xtick #' + i + ' - ' + msg);
            });
        }

        function testTitleScoot(fig, opts) {
            var xCategories = opts.xCategories;

            return Plotly.newPlot(gd, fig)
                .then(function() { assertNoIntersect('base'); })
                .then(function() { return Plotly.relayout(gd, 'xaxis.title.font.size', 40); })
                .then(function() { assertNoIntersect('large title font size'); })
                .then(function() { return Plotly.relayout(gd, 'xaxis.title.font.size', null); })
                .then(function() { assertNoIntersect('back to base'); })
                .then(function() { return Plotly.relayout(gd, 'xaxis.tickfont.size', 40); })
                .then(function() { assertNoIntersect('large title font size'); })
                .then(function() { return Plotly.relayout(gd, 'xaxis.tickfont.size', null); })
                .then(function() { assertNoIntersect('back to base 2'); })
                .then(function() { return Plotly.update(gd, {x: [xCategories]}, {'xaxis.tickangle': 90}); })
                .then(function() { assertNoIntersect('long tick labels'); })
                .then(function() { return Plotly.update(gd, {x: [null]}, {'xaxis.tickangle': null}); })
                .then(function() { assertNoIntersect('back to base 3'); });
        }

        var longCats = ['aaaaaaaaa', 'bbbbbbbbb', 'cccccccc'];
        var texTitle = '$f(x) = \\int_0^\\infty \\psi(t) dt$';
        var texCats = ['$\\phi$', '$\\nabla \\cdot \\vec{F}$', '$\\frac{\\partial x}{\\partial y}$'];
        var longTexCats = [
            '$\\int_0^\\infty \\psi(t) dt$',
            '$\\alpha \\int_0^\\infty \\eta(t) dt$',
            '$\\int_0^\\infty \\zeta(t) dt$'
        ];

        it('should scoot x-axis title below x-axis ticks', function(done) {
            testTitleScoot({
                data: [{
                    y: [1, 2, 1]
                }],
                layout: {
                    xaxis: { title: { text: 'TITLE' } },
                    width: 500,
                    height: 500,
                    margin: {t: 100, b: 100, l: 100, r: 100}
                }
            }, {
                xCategories: longCats
            })
            .then(done, done.fail);
        });


        // Firefox bug - see https://bugzilla.mozilla.org/show_bug.cgi?id=1350755
        // it('should scoot x-axis title (with MathJax) below x-axis ticks', function(done) {
        //     expect(window.MathJax).toBeDefined();

        //     testTitleScoot({
        //         data: [{
        //             y: [1, 2, 1]
        //         }],
        //         layout: {
        //             xaxis: {title: texTitle},
        //             width: 500,
        //             height: 500,
        //             margin: {t: 100, b: 100, l: 100, r: 100}
        //         }
        //     }, {
        //         xCategories: longCats
        //     })
        //     .then(done, done.fail);
        // });

        it('should scoot x-axis title below x-axis ticks (with MathJax)', function(done) {
            expect(window.MathJax).toBeDefined();

            testTitleScoot({
                data: [{
                    x: texCats,
                    y: [1, 2, 1]
                }],
                layout: {
                    xaxis: { title: { text: 'TITLE' } },
                    width: 500,
                    height: 500,
                    margin: {t: 100, b: 100, l: 100, r: 100}
                }
            }, {
                xCategories: longTexCats
            })
            .then(done, done.fail);
        });

        it('should scoot x-axis title (with MathJax) below x-axis ticks (with MathJax)', function(done) {
            expect(window.MathJax).toBeDefined();

            testTitleScoot({
                data: [{
                    x: texCats,
                    y: [1, 2, 1]
                }],
                layout: {
                    xaxis: { title: { text: texTitle } },
                    width: 500,
                    height: 500,
                    margin: {t: 100, b: 100, l: 100, r: 100}
                }
            }, {
                xCategories: longTexCats
            })
            .then(done, done.fail);
        });
    });

    describe('Test tex rendering:', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        it('should hand tex titles and tick labels off to MathJax', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: ['$\\phi$', '$\\nabla \\cdot \\vec{F}$'],
                    y: [1, 2]
                }],
                layout: {
                    title: { text: '$E = mc^2$' }
                }
            })
            .then(function() {
                var gd3 = d3Select(gd);

                // '.gtitle-math-group' is only added once MathJax has typeset the
                // string, so its presence is what tells us the tex was rendered
                expect(gd3.selectAll('.gtitle-math-group').size()).toBe(1, 'title math group');

                // tick label math groups carry the default 'text-math-group' class
                expect(gd3.selectAll('.text-math-group').size()).toBe(2, 'tick label math groups');

                var rendered = [];
                gd3.selectAll('[class*=-math-group]').each(function() {
                    expect(this.getAttribute('data-math')).toBe('Y');
                    rendered.push(this.getAttribute('data-unformatted'));
                });
                expect(rendered.sort()).toEqual([
                    '$E = mc^2$',
                    '$\\nabla \\cdot \\vec{F}$',
                    '$\\phi$'
                ]);
            })
            .then(done, done.fail);
        });

        it('should strip a javascript: url from a tex \\href, but keep a safe one', function(done) {
            Plotly.newPlot(gd, {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {
                    title: {text: '$\\href{javascript:alert(1)}{unsafe}$'},
                    xaxis: {title: {text: '$\\href{https://plotly.com}{safe}$'}}
                }
            })
            .then(function() {
                var gd3 = d3Select(gd);

                var unsafeLink = gd3.select('.gtitle-math-group a');
                expect(unsafeLink.size()).toBe(1, 'title link exists');
                expect(unsafeLink.attr('href')).toBe(null, 'javascript: url stripped');

                var safeLink = gd3.select('.g-xtitle .xtitle-math-group a');
                expect(safeLink.size()).toBe(1, 'axis title link exists');
                expect(safeLink.attr('href')).toBe('https://plotly.com', 'https: url kept');
            })
            .then(done, done.fail);
        });

        it('should strip a javascript: url from a tex \\href in an annotation', function(done) {
            Plotly.newPlot(gd, {
                data: [{x: [1, 2, 3], y: [1, 2, 3]}],
                layout: {
                    annotations: [{
                        x: 2,
                        y: 2,
                        showarrow: false,
                        text: '$\\href{javascript:alert(1)}{unsafe}$'
                    }]
                }
            })
            .then(function() {
                var gd3 = d3Select(gd);
                var link = gd3.select('.annotation-text-math-group a');

                expect(link.size()).toBe(1, 'annotation link exists');
                expect(link.attr('href')).toBe(null, 'javascript: url stripped');
            })
            .then(done, done.fail);
        });

        it('should strip a javascript: url from a tex \\href in non-hover legend text', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    x: [1, 2, 3],
                    y: [1, 2, 3],
                    name: '$\\href{javascript:alert(1)}{unsafe}$'
                }],
                layout: {showlegend: true}
            })
            .then(function() {
                var gd3 = d3Select(gd);
                var link = gd3.select('.legendtext-math-group a');

                expect(link.size()).toBe(1, 'legend link exists');
                expect(link.attr('href')).toBe(null, 'javascript: url stripped');
            })
            .then(done, done.fail);
        });
    });

    describe('Test hover tex rendering:', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        function _hover(xpx, ypx) {
            // 'xy' is the subplot id, not the hovermode -- hovermode comes
            // from the figure's own layout.hovermode.
            Fx.hover(gd, {xpx: xpx, ypx: ypx}, 'xy');
            Lib.clearThrottle();
        }

        it('should hand a pure-tex hover label off to MathJax, sized to its final content', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    type: 'scatter',
                    mode: 'markers',
                    x: [1, 2, 3],
                    y: [1, 2, 3],
                    text: ['$\\alpha^2 + \\beta^2 = \\gamma^2$', 'b', 'c'],
                    hoverinfo: 'text'
                }],
                layout: {
                    width: 500,
                    height: 400,
                    margin: {l: 0, t: 0, r: 0, b: 0},
                    xaxis: {range: [0, 4]},
                    yaxis: {range: [0, 4]}
                }
            })
            .then(function() {
                _hover(125, 300);
                return delay(30)();
            })
            .then(function() {
                var gd3 = d3Select(gd);
                var mathGroup = gd3.select('g.hovertext .nums-math-group');

                expect(mathGroup.size()).toBe(1, 'hover label math group');
                expect(mathGroup.attr('data-unformatted')).toBe('$\\alpha^2 + \\beta^2 = \\gamma^2$');

                // A rendered formula this long is much wider than the
                // ~15px placeholder box a not-yet-typeset label starts at;
                // this is what distinguishes a corrected box from one still
                // sized off the pre-MathJax placeholder measurement.
                var bg = gd3.select('g.hovertext > path').node().getBBox();
                expect(bg.width).toBeGreaterThan(50, 'hover box width, once corrected for the real label size');

                // The path/text/math-group coordinates must all be real
                // numbers -- this is what distinguishes a corrected box
                // from one still carrying NaN from an unresolved layout.
                expect(gd3.select('g.hovertext > path').attr('d')).not.toContain('NaN');
                expect(mathGroup.select('svg').attr('x')).not.toBe('NaN');
                expect(mathGroup.select('svg').attr('y')).not.toBe('NaN');
            })
            .then(done, done.fail);
        });

        it('should strip a javascript: url from a tex \\href in a hover label', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    type: 'scatter',
                    mode: 'markers',
                    x: [1, 2, 3],
                    y: [1, 2, 3],
                    text: ['$\\href{javascript:alert(document.cookie)}{click me}$', 'b', 'c'],
                    hoverinfo: 'text'
                }],
                layout: {
                    width: 500,
                    height: 400,
                    margin: {l: 0, t: 0, r: 0, b: 0},
                    xaxis: {range: [0, 4]},
                    yaxis: {range: [0, 4]}
                }
            })
            .then(function() {
                _hover(125, 300);
                return delay(30)();
            })
            .then(function() {
                var gd3 = d3Select(gd);
                var link = gd3.select('g.hovertext .nums-math-group a');

                // MathJax still wraps the text in an <a>; only the
                // javascript: url must be gone, not the tex rendering.
                expect(link.size()).toBe(1, 'link exists');
                expect(link.attr('href')).toBe(null, 'javascript: url stripped');
            })
            .then(done, done.fail);
        });

        it('should leave a mixed tex/plain-text hover label as literal text', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    type: 'scatter',
                    mode: 'markers',
                    x: [1, 2, 3],
                    y: [1, 2, 3],
                    text: ['Value: $\\alpha$ units', 'b', 'c'],
                    hoverinfo: 'text'
                }],
                layout: {
                    width: 500,
                    height: 400,
                    margin: {l: 0, t: 0, r: 0, b: 0},
                    xaxis: {range: [0, 4]},
                    yaxis: {range: [0, 4]}
                }
            })
            .then(function() {
                _hover(125, 300);
                return delay(30)();
            })
            .then(function() {
                var gd3 = d3Select(gd);
                var numsText = gd3.select('g.hovertext text.nums');

                expect(gd3.select('g.hovertext .nums-math-group').size()).toBe(0, 'no math group');
                expect(numsText.text()).toBe('Value: $\\alpha$ units');
                expect(numsText.node().style.display).not.toBe('none');
            })
            .then(done, done.fail);
        });

        it('should hand a pure-tex common hover label off to MathJax, sized to its final content', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    type: 'scatter',
                    mode: 'markers',
                    x: ['$\\alpha^2 + \\beta^2 = \\gamma^2$', 'b', 'c'],
                    y: [1, 2, 3]
                }],
                layout: {
                    width: 500,
                    height: 400,
                    margin: {l: 0, t: 0, r: 0, b: 0},
                    // category positions are 0, 1, 2; this range puts
                    // category 0 at pixel 125, matching the other two tests
                    xaxis: {range: [-1, 3]},
                    yaxis: {range: [0, 4]},
                    hovermode: 'x'
                }
            })
            .then(function() {
                _hover(125, 300);
                return delay(30)();
            })
            .then(function() {
                var gd3 = d3Select(gd);
                var mathGroup = gd3.select('g.axistext .text-math-group');

                expect(mathGroup.size()).toBe(1, 'common label math group');
                expect(mathGroup.attr('data-unformatted')).toBe('$\\alpha^2 + \\beta^2 = \\gamma^2$');

                var bg = gd3.select('g.axistext > path').node().getBBox();
                expect(bg.width).toBeGreaterThan(50, 'common label width, once corrected for the real label size');

                expect(gd3.select('g.axistext > path').attr('d')).not.toContain('NaN');
                expect(mathGroup.select('svg').attr('x')).not.toBe('NaN');
                expect(mathGroup.select('svg').attr('y')).not.toBe('NaN');
            })
            .then(done, done.fail);
        });

        it('should hand both the value and the name off to MathJax when both are tex', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    type: 'scatter',
                    mode: 'markers',
                    x: [1, 2, 3],
                    y: [1, 2, 3],
                    text: ['$\\alpha^2$', 'b', 'c'],
                    name: '$\\beta^2$',
                    hoverinfo: 'text+name'
                }],
                layout: {
                    width: 500,
                    height: 400,
                    margin: {l: 0, t: 0, r: 0, b: 0},
                    xaxis: {range: [0, 4]},
                    yaxis: {range: [0, 4]}
                }
            })
            .then(function() {
                _hover(125, 300);
                return delay(30)();
            })
            .then(function() {
                var gd3 = d3Select(gd);
                var numsMathGroup = gd3.select('g.hovertext .nums-math-group');
                var nameMathGroup = gd3.select('g.hovertext .name-math-group');

                expect(numsMathGroup.size()).toBe(1, 'value math group');
                expect(numsMathGroup.attr('data-unformatted')).toBe('$\\alpha^2$');
                expect(nameMathGroup.size()).toBe(1, 'name math group');
                expect(nameMathGroup.attr('data-unformatted')).toBe('$\\beta^2$');

                expect(gd3.select('g.hovertext > path').attr('d')).not.toContain('NaN');
            })
            .then(done, done.fail);
        });

        it('should size and position two simultaneous tex hover labels correctly', function(done) {
            Plotly.newPlot(gd, {
                data: [
                    {type: 'scatter', mode: 'markers', x: [1], y: [1], text: ['$\\alpha^2$'], hoverinfo: 'text', name: 'A'},
                    {type: 'scatter', mode: 'markers', x: [1], y: [1], text: ['$\\beta^2$'], hoverinfo: 'text', name: 'B'}
                ],
                layout: {
                    width: 500,
                    height: 400,
                    margin: {l: 0, t: 0, r: 0, b: 0},
                    xaxis: {range: [0, 4]},
                    yaxis: {range: [0, 4]},
                    hovermode: 'x'
                }
            })
            .then(function() {
                _hover(125, 300);
                return delay(30)();
            })
            .then(function() {
                var gd3 = d3Select(gd);
                var hoverTexts = gd3.selectAll('g.hovertext');
                var mathGroups = gd3.selectAll('g.hovertext .nums-math-group');

                expect(hoverTexts.size()).toBe(2, 'two hover labels, both identical points');
                expect(mathGroups.size()).toBe(2, 'both labels typeset');

                var unformatted = [];
                mathGroups.each(function() { unformatted.push(this.getAttribute('data-unformatted')); });
                expect(unformatted.sort()).toEqual(['$\\alpha^2$', '$\\beta^2$']);

                hoverTexts.select('path').each(function() {
                    expect(d3Select(this).attr('d')).not.toContain('NaN');
                });

                // hoverAvoidOverlaps must have pushed the two labels apart,
                // since both points sit at the exact same (x, y). The
                // separation is applied inside each label (an offset on
                // text.nums), not to the outer <g>'s own transform, so
                // compare each label's on-screen position, not its <g>.
                var tops = [];
                hoverTexts.select('path').each(function() {
                    tops.push(this.getBoundingClientRect().top);
                });
                expect(tops[0]).not.toBeNaN();
                expect(tops[1]).not.toBeNaN();
                expect(Math.abs(tops[0] - tops[1])).toBeGreaterThan(5, 'labels pushed apart, not stacked on each other');
            })
            .then(done, done.fail);
        });

        it('should hand a unified hover title off to MathJax when set through unifiedhovertitle', function(done) {
            Plotly.newPlot(gd, {
                data: [{
                    type: 'scatter',
                    mode: 'markers',
                    x: [1, 2, 3],
                    y: [1, 2, 3]
                }],
                layout: {
                    width: 500,
                    height: 400,
                    margin: {l: 0, t: 0, r: 0, b: 0},
                    xaxis: {range: [0, 4], unifiedhovertitle: {text: '$\\alpha^2$'}},
                    yaxis: {range: [0, 4]},
                    hovermode: 'x unified'
                }
            })
            .then(function() {
                _hover(125, 300);
                return delay(30)();
            })
            .then(function() {
                var gd3 = d3Select(gd);
                var mathGroup = gd3.select('g.legend [class*="titletext-math-group"]');

                expect(mathGroup.size()).toBe(1, 'unified hover title math group');
                expect(mathGroup.attr('data-unformatted')).toBe('$\\alpha^2$');
            })
            .then(done, done.fail);
        });

        it('should hand a pure-tex Fx.loneHover label off to MathJax, sized to its final content', function(done) {
            Plotly.newPlot(gd, {
                data: [{type: 'scatter', mode: 'markers', x: [1], y: [1]}],
                layout: {width: 500, height: 400, margin: {l: 0, t: 0, r: 0, b: 0}}
            })
            .then(function() {
                var fullLayout = gd._fullLayout;
                Fx.loneHover({
                    x: 100,
                    y: 100,
                    text: '$\\alpha^2 + \\beta^2 = \\gamma^2$',
                    color: 'blue'
                }, {
                    gd: gd,
                    container: fullLayout._hoverlayer.node(),
                    outerContainer: fullLayout._paper.node()
                });
                return delay(30)();
            })
            .then(function() {
                var gd3 = d3Select(gd);
                var mathGroup = gd3.select('g.hovertext .nums-math-group');

                expect(mathGroup.size()).toBe(1, 'loneHover math group');
                expect(mathGroup.attr('data-unformatted')).toBe('$\\alpha^2 + \\beta^2 = \\gamma^2$');

                var bg = gd3.select('g.hovertext > path').node().getBBox();
                expect(bg.width).toBeGreaterThan(50, 'loneHover box width, once corrected for the real label size');
                expect(gd3.select('g.hovertext > path').attr('d')).not.toContain('NaN');
            })
            .then(done, done.fail);
        });
    });
});
