'use strict';

var Plotly = require('../../../lib/index');
var Drawing = require('../../../src/components/drawing');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var d3Select = require('../../strict-d3').select;
var d3SelectAll = require('../../strict-d3').selectAll;

describe('lookupSymbol .n property', function() {
    it('matches the legacy numeric input exactly', function() {
        // The .n property must equal what the user types as symbol:N
        // so there are zero doubts about a consistent design.
        var cases = [
            // numeric inputs
            {v: 0,   n: 0},
            {v: 1,   n: 1},
            {v: 100, n: 100},
            {v: 101, n: 101},
            {v: 200, n: 200},
            {v: 201, n: 201},
            {v: 300, n: 300},
            {v: 301, n: 301},
            // string inputs resolve to the same n as their numeric equivalent
            {v: 'circle',           n: 0},
            {v: 'circle-open',      n: 100},
            {v: 'circle-dot',       n: 200},
            {v: 'circle-open-dot',  n: 300},
            {v: 'square',           n: 1},
            {v: 'square-open',      n: 101},
            {v: 'square-dot',       n: 201},
            {v: 'square-open-dot',  n: 301},
        ];
        cases.forEach(function(c) {
            var sym = Drawing.lookupSymbol(c.v);
            expect(sym).toBeTruthy('lookupSymbol(' + c.v + ') should return a symbol object');
            expect(sym.n).toBe(c.n, 'lookupSymbol(' + c.v + ').n');
        });
    });

    it('open variants share the same SVG path as their closed counterpart', function() {
        expect(Drawing.lookupSymbol(0).path).toBe(Drawing.lookupSymbol(100).path,
            'circle and circle-open share path');
        expect(Drawing.lookupSymbol(200).path).toBe(Drawing.lookupSymbol(300).path,
            'circle-dot and circle-open-dot share path');
        expect(Drawing.lookupSymbol(1).path).toBe(Drawing.lookupSymbol(101).path,
            'square and square-open share path');
    });

    it('all four variant .n values are distinct for the same base symbol', function() {
        var ns = [0, 100, 200, 300].map(function(v) { return Drawing.lookupSymbol(v).n; });
        expect(ns).toEqual([0, 100, 200, 300], 'all four circle variant n values are distinct');
    });
});

describe('Marker symbol performance', function() {
    var gd;

    beforeEach(function() { gd = createGraphDiv(); });
    afterEach(destroyGraphDiv);

    function getUseHref(useEl) {
        return useEl.getAttribute('href') ||
            useEl.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
    }

    it('should use <symbol>+<use> with 1 symbol def for 1000 identical markers', function(done) {
        var N = 1000;
        var x = [], y = [];
        for(var i = 0; i < N; i++) { x.push(i); y.push(Math.sin(i / 50)); }

        Plotly.newPlot(gd, [{
            mode: 'markers',
            x: x, y: y,
            marker: { symbol: 'circle', size: 8 }
        }]).then(function() {
            var defs = d3Select(gd).select('defs');
            var symbolDefs = defs.selectAll('symbol');
            expect(symbolDefs.size()).toBe(1, 'only 1 <symbol> definition');

            var useEls = d3Select(gd).selectAll('use.point');
            expect(useEls.size()).toBe(N, N + ' <use> elements');

            // No <path class="point"> should exist
            var pathPts = d3Select(gd).selectAll('path.point');
            expect(pathPts.size()).toBe(0, 'no <path> point elements');
        }).then(done, done.fail);
    });

    it('should produce small SVG with 10 distinct symbols over 1000 points', function(done) {
        var N = 1000;
        var symbols = ['circle', 'square', 'diamond', 'cross', 'x',
                       'triangle-up', 'triangle-down', 'pentagon', 'hexagon', 'star'];
        var x = [], y = [], sym = [];
        for(var i = 0; i < N; i++) {
            x.push(i); y.push(Math.sin(i / 50));
            sym.push(symbols[i % symbols.length]);
        }

        Plotly.newPlot(gd, [{
            mode: 'markers',
            x: x, y: y,
            marker: { symbol: sym, size: 10 }
        }]).then(function() {
            var svgEl = gd.querySelector('.main-svg');
            var svgStr = new XMLSerializer().serializeToString(svgEl);
            var byteSize = new Blob([svgStr]).size;

            // With <use>, 10 symbol defs + 1000 <use> refs should be much smaller
            // than 1000 full <path d="..."> elements
            expect(byteSize).toBeLessThan(400000, 'SVG byte size under 400KB');

            var symbolDefs = d3Select(gd).select('defs').selectAll('symbol');
            expect(symbolDefs.size()).toBe(10, '10 <symbol> definitions');
        }).then(done, done.fail);
    });

    it('should re-render on marker size change without new symbol def', function(done) {
        var N = 1000;
        var x = [], y = [];
        for(var i = 0; i < N; i++) { x.push(i); y.push(Math.sin(i / 50)); }

        Plotly.newPlot(gd, [{
            mode: 'markers',
            x: x, y: y,
            marker: { symbol: 'square', size: 8 }
        }]).then(function() {
            // Capture current <use> href — it shouldn't change on resize
            var firstUse = gd.querySelector('use.point');
            var hrefBefore = getUseHref(firstUse);
            var scaleBefore = parseFloat(firstUse.getAttribute('data-scale'));

            return Plotly.restyle(gd, { 'marker.size': 16 }).then(function() {
                var firstUseAfter = gd.querySelector('use.point');
                var hrefAfter = getUseHref(firstUseAfter);
                var scaleAfter = parseFloat(firstUseAfter.getAttribute('data-scale'));

                expect(hrefAfter).toBe(hrefBefore, 'href unchanged — no new symbol def needed');
                // Scale should have increased (size 16 → scale 0.8 vs size 8 → scale 0.4)
                expect(scaleAfter).toBeGreaterThan(scaleBefore + 0.001, 'scale increased after size restyle');
            });
        }).then(done, done.fail);
    });

    it('should apply vector-effect: non-scaling-stroke to <use> marker elements', function(done) {
        Plotly.newPlot(gd, [{
            mode: 'markers',
            x: [1, 2, 3], y: [1, 2, 3],
            marker: { symbol: 'circle', size: 20, line: { width: 2, color: 'red' } }
        }]).then(function() {
            var useEls = d3SelectAll(gd.querySelectorAll('use.point'));
            useEls.each(function() {
                var ve = this.style.vectorEffect || d3Select(this).style('vector-effect');
                expect(ve).toBe('non-scaling-stroke', 'non-scaling-stroke applied');
            });
        }).then(done, done.fail);
    });

    it('symbol:0 and symbol:100 each get their own <symbol> with descriptive ids', function(done) {
        // Each variant (closed / open / dot / open-dot) gets its own <symbol> element,
        // even though open variants share the same SVG path as the closed counterpart.
        // The open/closed distinction is still CSS-only (fill:none vs filled).
        Plotly.newPlot(gd, [{
            mode: 'markers',
            x: [1, 2, 3, 4],
            y: [1, 2, 3, 4],
            marker: { symbol: [0, 100, 0, 100], size: 10 }
        }]).then(function() {
            var defs = d3Select(gd).select('defs');
            var symbolDefs = defs.selectAll('symbol');
            expect(symbolDefs.size()).toBe(2, '2 <symbol> defs: one for circle, one for circle-open');

            var ids = [];
            symbolDefs.each(function() { ids.push(this.getAttribute('id')); });
            expect(ids.sort()).toEqual(['circle', 'circle-open'], 'ids are "circle" and "circle-open"');

            var useEls = gd.querySelectorAll('use.point');
            expect(useEls.length).toBe(4, '4 <use> elements');
            // Even-index points use symbol:0 → #circle; odd-index → symbol:100 → #circle-open
            for(var i = 0; i < useEls.length; i++) {
                var href = getUseHref(useEls[i]);
                expect(href).toBe(i % 2 === 0 ? '#circle' : '#circle-open', 'href matches variant');
            }
        }).then(done, done.fail);
    });

    it('symbol:200/300 each get their own <symbol> with descriptive ids', function(done) {
        Plotly.newPlot(gd, [{
            mode: 'markers',
            x: [1, 2],
            y: [1, 2],
            marker: { symbol: [200, 300], size: 10 }
        }]).then(function() {
            var defs = d3Select(gd).select('defs');
            var symbolDefs = defs.selectAll('symbol');
            expect(symbolDefs.size()).toBe(2, '2 <symbol> defs: circle-dot and circle-open-dot');

            var ids = [];
            symbolDefs.each(function() { ids.push(this.getAttribute('id')); });
            expect(ids.sort()).toEqual(['circle-dot', 'circle-open-dot'], 'ids are "circle-dot" and "circle-open-dot"');
        }).then(done, done.fail);
    });

    it('all four variants of a symbol get their own <symbol> with correct ids', function(done) {
        Plotly.newPlot(gd, [{
            mode: 'markers',
            x: [1, 2, 3, 4],
            y: [1, 2, 3, 4],
            marker: { symbol: ['square', 'square-open', 'square-dot', 'square-open-dot'], size: 10 }
        }]).then(function() {
            var defs = d3Select(gd).select('defs');
            var symbolDefs = defs.selectAll('symbol');
            expect(symbolDefs.size()).toBe(4, '4 <symbol> defs for all square variants');

            var ids = [];
            symbolDefs.each(function() { ids.push(this.getAttribute('id')); });
            expect(ids.sort()).toEqual(['square', 'square-dot', 'square-open', 'square-open-dot'],
                'ids cover all four variants');
        }).then(done, done.fail);
    });
});
