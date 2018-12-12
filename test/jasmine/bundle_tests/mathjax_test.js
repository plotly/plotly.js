var Plotly = require('@lib/index');
var d3 = require('d3');

var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var failTest = require('../assets/fail_test');

describe('Test MathJax:', function() {
    var mathJaxScriptTag;

    // N.B. we have to load MathJax "dynamically" as Karam
    // does not undefined the MathJax's `?config=` parameter.
    //
    // Eventually, it might be nice to move these tests in the "regular" test
    // suites, but to do that we'll need to find a way to remove MathJax from
    // page without breaking things downstream.
    beforeAll(function(done) {
        mathJaxScriptTag = document.createElement('script');
        mathJaxScriptTag.type = 'text/javascript';
        mathJaxScriptTag.onload = function() {
            require('@src/fonts/mathjax_config')();
            done();
        };
        mathJaxScriptTag.onerror = function() {
            fail('MathJax failed to load');
        };
        mathJaxScriptTag.src = '/base/dist/extras/mathjax/MathJax.js?config=TeX-AMS-MML_SVG';
        document.body.appendChild(mathJaxScriptTag);
    });

    describe('Test axis title scoot:', function() {
        var gd;

        beforeEach(function() {
            gd = createGraphDiv();
        });

        afterEach(destroyGraphDiv);

        function assertNoIntersect(msg) {
            var gd3 = d3.select(gd);
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

            return Plotly.plot(gd, fig)
                .then(function() { assertNoIntersect('base'); })
                .then(function() { return Plotly.relayout(gd, 'xaxis.titlefont.size', 40); })
                .then(function() { assertNoIntersect('large title font size'); })
                .then(function() { return Plotly.relayout(gd, 'xaxis.titlefont.size', null); })
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
                    xaxis: {title: 'TITLE'},
                    width: 500,
                    height: 500,
                    margin: {t: 100, b: 100, l: 100, r: 100}
                }
            }, {
                xCategories: longCats
            })
            .catch(failTest)
            .then(done);
        });

        it('should scoot x-axis title (with MathJax) below x-axis ticks', function(done) {
            expect(window.MathJax).toBeDefined();

            testTitleScoot({
                data: [{
                    y: [1, 2, 1]
                }],
                layout: {
                    xaxis: {title: texTitle},
                    width: 500,
                    height: 500,
                    margin: {t: 100, b: 100, l: 100, r: 100}
                }
            }, {
                xCategories: longCats
            })
            .catch(failTest)
            .then(done);
        });

        it('should scoot x-axis title below x-axis ticks (with MathJax)', function(done) {
            expect(window.MathJax).toBeDefined();

            testTitleScoot({
                data: [{
                    x: texCats,
                    y: [1, 2, 1]
                }],
                layout: {
                    xaxis: {title: 'TITLE'},
                    width: 500,
                    height: 500,
                    margin: {t: 100, b: 100, l: 100, r: 100}
                }
            }, {
                xCategories: longTexCats
            })
            .catch(failTest)
            .then(done);
        });

        it('should scoot x-axis title (with MathJax) below x-axis ticks (with MathJax)', function(done) {
            expect(window.MathJax).toBeDefined();

            testTitleScoot({
                data: [{
                    x: texCats,
                    y: [1, 2, 1]
                }],
                layout: {
                    xaxis: {title: texTitle},
                    width: 500,
                    height: 500,
                    margin: {t: 100, b: 100, l: 100, r: 100}
                }
            }, {
                xCategories: longTexCats
            })
            .catch(failTest)
            .then(done);
        });
    });
});
