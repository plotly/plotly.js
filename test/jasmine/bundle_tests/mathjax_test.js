var Plotly = require('../../../lib/index');
var Lib = require('../../../src/lib');
var d3Select = require('../../strict-d3').select;

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var loadScript = require('../assets/load_script');
var click = require('../assets/click');

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
    });

    describe('Test scatter text labels:', function() {
        var gd;

        var layout = {
            width: 500,
            height: 500,
            margin: {l: 50, r: 50, t: 50, b: 50},
            xaxis: {range: [0, 4]},
            yaxis: {range: [0, 4]}
        };

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        function hiddenSourceCount() {
            return d3Select(gd).selectAll('.textpoint text').filter(function() {
                return this.style.display === 'none';
            }).size();
        }

        it('should keep the tex source hidden when a point is selected', function(done) {
            Plotly.newPlot(gd, [{
                mode: 'markers+text',
                x: [1, 2],
                y: [1, 2],
                text: ['$\\alpha$', '$\\beta$'],
                textposition: 'top center'
            }], Lib.extendFlat({clickmode: 'event+select'}, layout))
            .then(function() {
                expect(d3Select(gd).selectAll('.textpoint .text-math-group').size()).toBe(2, 'math groups');
                expect(hiddenSourceCount()).toBe(2, 'before selection');
                return new Promise(function(resolve) {
                    gd.once('plotly_selected', resolve);
                    click(150, 350);
                });
            })
            .then(function() {
                expect(gd._fullData[0].selectedpoints).toEqual([0]);
                expect(hiddenSourceCount()).toBe(2, 'after selection');
            })
            .then(done, done.fail);
        });

        it('should place *auto* labels by their rendered box and hide the whole label', function(done) {
            var n = 12;
            var x = [];
            var y = [];
            var text = [];
            var textposition = [];
            for(var i = 0; i < n; i++) {
                x.push(2);
                y.push(2);
                text.push(i ? '$\\alpha_{' + i + '}$' : '$\\alpha + \\beta + \\gamma + \\delta$');
                textposition.push(i ? 'auto' : 'top center');
            }
            // a point outside the plot area gets no label
            x.push(5);
            y.push(2);
            text.push('$\\omega$');
            textposition.push('auto');

            Plotly.newPlot(gd, [{
                mode: 'markers+text',
                x: x,
                y: y,
                text: text,
                textposition: textposition,
                marker: {size: 10}
            }], layout)
            .then(function() {
                var gd3 = d3Select(gd);
                var cd = gd.calcdata[0];
                var boxes = [gd3.select('.point').node().getBoundingClientRect()];

                expect(gd3.selectAll('.textpoint .text-math-group').size()).toBe(n + 1, 'math groups');
                expect(cd[n]._tpAuto).toBe(null, 'label outside the plot area');

                gd3.selectAll('.textpoint').each(function(d) {
                    var rect = d3Select(this).select('.text-math-group svg').node().getBoundingClientRect();
                    if(d._tpAuto === null) expect(rect.width).toBe(0, 'hidden label ' + d.i);
                    else boxes.push(rect);
                });

                var overlaps = 0;
                for(var i = 0; i < boxes.length; i++) {
                    for(var j = i + 1; j < boxes.length; j++) {
                        var a = boxes[i];
                        var b = boxes[j];
                        if(a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top) overlaps++;
                    }
                }
                expect(overlaps).toBe(0, 'overlaps among the marker and the visible labels');
            })
            .then(done, done.fail);
        });
    });
});
