var d3 = require('d3');
var Plotly = require('@lib/index');
var Drawing = require('@src/components/drawing');
var svgTextUtils = require('@src/lib/svg_text_utils');
var createGraphDiv = require('../assets/create_graph_div');
var destroyGraphDiv = require('../assets/destroy_graph_div');
var fail = require('../assets/fail_test');

describe('Drawing', function() {
    'use strict';

    describe('setClipUrl', function() {

        beforeEach(function() {
            this.svg = d3.select('body').append('svg');
            this.g = this.svg.append('g');
        });

        afterEach(function() {
            this.svg.remove();
            this.g.remove();
        });

        it('should set the clip-path attribute', function() {
            expect(this.g.attr('clip-path')).toBe(null);

            Drawing.setClipUrl(this.g, 'id1');

            expect(this.g.attr('clip-path')).toEqual('url(#id1)');
        });

        it('should unset the clip-path if arg is falsy', function() {
            this.g.attr('clip-path', 'url(#id2)');

            Drawing.setClipUrl(this.g, false);

            expect(this.g.attr('clip-path')).toBe(null);
        });

        it('should append window URL to clip-path if <base> is present', function() {

            // append <base> with href
            var base = d3.select('body')
                .append('base')
                .attr('href', 'https://plot.ly');

            // grab window URL
            var href = window.location.href;

            Drawing.setClipUrl(this.g, 'id3');

            expect(this.g.attr('clip-path'))
                .toEqual('url(' + href + '#id3)');

            base.remove();
        });

        it('should append window URL w/o hash to clip-path if <base> is present', function() {
            var base = d3.select('body')
                .append('base')
                .attr('href', 'https://plot.ly/#hash');

            window.location.hash = 'hash';

            Drawing.setClipUrl(this.g, 'id4');

            var expected = 'url(' + window.location.href.split('#')[0] + '#id4)';

            expect(this.g.attr('clip-path')).toEqual(expected);

            base.remove();
            window.location.hash = '';
        });
    });

    describe('getTranslate', function() {

        it('should work with regular DOM elements', function() {
            var el = document.createElement('div');

            expect(Drawing.getTranslate(el)).toEqual({ x: 0, y: 0 });

            el.setAttribute('transform', 'translate(123.45px, 67)');
            expect(Drawing.getTranslate(el)).toEqual({ x: 123.45, y: 67 });

            el.setAttribute('transform', 'translate(123.45)');
            expect(Drawing.getTranslate(el)).toEqual({ x: 123.45, y: 0 });

            el.setAttribute('transform', 'translate(1 2)');
            expect(Drawing.getTranslate(el)).toEqual({ x: 1, y: 2 });

            el.setAttribute('transform', 'translate(1 2); rotate(20deg)');
            expect(Drawing.getTranslate(el)).toEqual({ x: 1, y: 2 });

            el.setAttribute('transform', 'rotate(20deg) translate(1 2);');
            expect(Drawing.getTranslate(el)).toEqual({ x: 1, y: 2 });

            el.setAttribute('transform', 'rotate(20deg)');
            expect(Drawing.getTranslate(el)).toEqual({ x: 0, y: 0 });
        });

        it('should work with d3 elements', function() {
            var el = d3.select(document.createElement('div'));

            el.attr('transform', 'translate(123.45px, 67)');
            expect(Drawing.getTranslate(el)).toEqual({ x: 123.45, y: 67 });

            el.attr('transform', 'translate(123.45)');
            expect(Drawing.getTranslate(el)).toEqual({ x: 123.45, y: 0 });

            el.attr('transform', 'translate(1 2)');
            expect(Drawing.getTranslate(el)).toEqual({ x: 1, y: 2 });

            el.attr('transform', 'translate(1 2); rotate(20)');
            expect(Drawing.getTranslate(el)).toEqual({ x: 1, y: 2 });

            el.attr('transform', 'rotate(20)');
            expect(Drawing.getTranslate(el)).toEqual({ x: 0, y: 0 });
        });

        it('should work with negative values', function() {
            var el = document.createElement('div'),
                el3 = d3.select(document.createElement('div'));

            expect(Drawing.getTranslate(el)).toEqual({ x: 0, y: 0 });

            var testCases = [
                { transform: 'translate(-123.45px, -67)', x: -123.45, y: -67 },
                { transform: 'translate(-123.45px, 67)', x: -123.45, y: 67 },
                { transform: 'translate(123.45px, -67)', x: 123.45, y: -67 },
                { transform: 'translate(-123.45)', x: -123.45, y: 0 },
                { transform: 'translate(-1 -2)', x: -1, y: -2 },
                { transform: 'translate(-1 2)', x: -1, y: 2 },
                { transform: 'translate(1 -2)', x: 1, y: -2 },
                { transform: 'translate(-1 -2); rotate(20deg)', x: -1, y: -2 },
                { transform: 'translate(-1 2); rotate(20deg)', x: -1, y: 2 },
                { transform: 'translate(1 -2); rotate(20deg)', x: 1, y: -2 },
                { transform: 'rotate(20deg) translate(-1 -2);', x: -1, y: -2 },
                { transform: 'rotate(20deg) translate(-1 2);', x: -1, y: 2 },
                { transform: 'rotate(20deg) translate(1 -2);', x: 1, y: -2 }
            ];

            for(var i = 0; i < testCases.length; i++) {
                var testCase = testCases[i],
                    transform = testCase.transform,
                    x = testCase.x,
                    y = testCase.y;

                el.setAttribute('transform', transform);
                expect(Drawing.getTranslate(el)).toEqual({ x: x, y: y });

                el3.attr('transform', transform);
                expect(Drawing.getTranslate(el)).toEqual({ x: x, y: y });
            }
        });
    });

    describe('setTranslate', function() {

        it('should work with regular DOM elements', function() {
            var el = document.createElement('div');

            Drawing.setTranslate(el, 5);
            expect(el.getAttribute('transform')).toBe('translate(5, 0)');

            Drawing.setTranslate(el, 10, 20);
            expect(el.getAttribute('transform')).toBe('translate(10, 20)');

            Drawing.setTranslate(el);
            expect(el.getAttribute('transform')).toBe('translate(0, 0)');

            el.setAttribute('transform', 'translate(0, 0); rotate(30)');
            Drawing.setTranslate(el, 30, 40);
            expect(el.getAttribute('transform')).toBe('rotate(30) translate(30, 40)');
        });

        it('should work with d3 elements', function() {
            var el = d3.select(document.createElement('div'));

            Drawing.setTranslate(el, 5);
            expect(el.attr('transform')).toBe('translate(5, 0)');

            Drawing.setTranslate(el, 30, 40);
            expect(el.attr('transform')).toBe('translate(30, 40)');

            Drawing.setTranslate(el);
            expect(el.attr('transform')).toBe('translate(0, 0)');

            el.attr('transform', 'translate(0, 0); rotate(30)');
            Drawing.setTranslate(el, 30, 40);
            expect(el.attr('transform')).toBe('rotate(30) translate(30, 40)');
        });
    });

    describe('getScale', function() {

        it('should work with regular DOM elements', function() {
            var el = document.createElement('div');

            expect(Drawing.getScale(el)).toEqual({ x: 1, y: 1 });

            el.setAttribute('transform', 'scale(1.23, 45)');
            expect(Drawing.getScale(el)).toEqual({ x: 1.23, y: 45 });

            el.setAttribute('transform', 'scale(123.45)');
            expect(Drawing.getScale(el)).toEqual({ x: 123.45, y: 1 });

            el.setAttribute('transform', 'scale(0.1 2)');
            expect(Drawing.getScale(el)).toEqual({ x: 0.1, y: 2 });

            el.setAttribute('transform', 'scale(0.1 2); rotate(20deg)');
            expect(Drawing.getScale(el)).toEqual({ x: 0.1, y: 2 });

            el.setAttribute('transform', 'rotate(20deg) scale(0.1 2);');
            expect(Drawing.getScale(el)).toEqual({ x: 0.1, y: 2 });

            el.setAttribute('transform', 'rotate(20deg)');
            expect(Drawing.getScale(el)).toEqual({ x: 1, y: 1 });
        });

        it('should work with d3 elements', function() {
            var el = d3.select(document.createElement('div'));

            el.attr('transform', 'scale(1.23, 45)');
            expect(Drawing.getScale(el)).toEqual({ x: 1.23, y: 45 });

            el.attr('transform', 'scale(123.45)');
            expect(Drawing.getScale(el)).toEqual({ x: 123.45, y: 1 });

            el.attr('transform', 'scale(0.1 2)');
            expect(Drawing.getScale(el)).toEqual({ x: 0.1, y: 2 });

            el.attr('transform', 'scale(0.1 2); rotate(20)');
            expect(Drawing.getScale(el)).toEqual({ x: 0.1, y: 2 });

            el.attr('transform', 'rotate(20)');
            expect(Drawing.getScale(el)).toEqual({ x: 1, y: 1 });
        });
    });

    describe('setScale', function() {

        it('should work with regular DOM elements', function() {
            var el = document.createElement('div');

            Drawing.setScale(el, 5);
            expect(el.getAttribute('transform')).toBe('scale(5, 1)');

            Drawing.setScale(el, 30, 40);
            expect(el.getAttribute('transform')).toBe('scale(30, 40)');

            Drawing.setScale(el);
            expect(el.getAttribute('transform')).toBe('scale(1, 1)');

            el.setAttribute('transform', 'scale(1, 1); rotate(30)');
            Drawing.setScale(el, 30, 40);
            expect(el.getAttribute('transform')).toBe('rotate(30) scale(30, 40)');
        });

        it('should work with d3 elements', function() {
            var el = d3.select(document.createElement('div'));

            Drawing.setScale(el, 5);
            expect(el.attr('transform')).toBe('scale(5, 1)');

            Drawing.setScale(el, 30, 40);
            expect(el.attr('transform')).toBe('scale(30, 40)');

            Drawing.setScale(el);
            expect(el.attr('transform')).toBe('scale(1, 1)');

            el.attr('transform', 'scale(0, 0); rotate(30)');
            Drawing.setScale(el, 30, 40);
            expect(el.attr('transform')).toBe('rotate(30) scale(30, 40)');
        });
    });

    describe('setPointGroupScale', function() {
        var el, sel;

        beforeEach(function() {
            el = document.createElement('div');
            sel = d3.select(el);
        });

        it('sets the scale of a point', function() {
            Drawing.setPointGroupScale(sel, 2, 2);
            expect(el.getAttribute('transform')).toBe('scale(2,2)');
        });

        it('appends the scale of a point', function() {
            el.setAttribute('transform', 'translate(1,2)');
            Drawing.setPointGroupScale(sel, 2, 2);
            expect(el.getAttribute('transform')).toBe('translate(1,2) scale(2,2)');
        });

        it('modifies the scale of a point', function() {
            el.setAttribute('transform', 'translate(1,2) scale(3,4)');
            Drawing.setPointGroupScale(sel, 2, 2);
            expect(el.getAttribute('transform')).toBe('translate(1,2) scale(2,2)');
        });

        it('does not apply the scale of a point if scale (1, 1)', function() {
            el.setAttribute('transform', 'translate(1,2)');
            Drawing.setPointGroupScale(sel, 1, 1);
            expect(el.getAttribute('transform')).toBe('translate(1,2)');
        });

        it('removes the scale of a point if scale (1, 1)', function() {
            el.setAttribute('transform', 'translate(1,2) scale(3,4)');
            Drawing.setPointGroupScale(sel, 1, 1);
            expect(el.getAttribute('transform')).toBe('translate(1,2)');
        });
    });

    describe('setTextPointsScale', function() {
        var svg, g, text;

        beforeEach(function() {
            svg = d3.select(document.createElement('svg'));
            g = svg.append('g');
            text = g.append('text');
        });

        it('sets the transform on an empty element', function() {
            Drawing.setTextPointsScale(g, 2, 3);
            expect(g.attr('transform')).toEqual('translate(0,0) scale(2,3) translate(0,0)');
        });

        it('unsets the transform', function() {
            Drawing.setTextPointsScale(g, 1, 1);
            expect(g.attr('transform')).toEqual('');
        });

        it('preserves a leading translate', function() {
            Drawing.setTextPointsScale(g, 1, 1);
            g.attr('transform', 'translate(1, 2)');
            expect(g.attr('transform')).toEqual('translate(1, 2)');
        });

        it('preserves transforms', function() {
            text.attr('x', 8);
            text.attr('y', 9);
            g.attr('transform', 'translate(1, 2)');
            Drawing.setTextPointsScale(g, 4, 5);
            expect(g.attr('transform')).toEqual('translate(8,9) scale(4,5) translate(-8,-9) translate(1, 2)');
        });

        it('should not break when <text> is not present', function() {
            text.remove();
            expect(function() { Drawing.setTextPointsScale(g, 4, 5); }).not.toThrow();
        });
    });

    describe('bBox', function() {
        afterEach(destroyGraphDiv);

        function assertBBox(actual, expected) {
            [
                'height', 'top', 'bottom',
                'width', 'left', 'right'
            ].forEach(function(dim) {
                // give larger dimensions some extra tolerance
                var tol = Math.max(expected[dim] / 10, 3);
                expect(actual[dim]).toBeWithin(expected[dim], tol, dim);
            });
        }

        it('should update bounding box dimension on window scroll', function(done) {
            var gd = createGraphDiv();

            // allow page to scroll
            gd.style.position = 'static';

            Plotly.plot(gd, [{
                y: [1, 2, 1]
            }], {
                annotations: [{
                    text: 'hello'
                }],
                height: window.innerHeight * 2,
                width: 500
            })
            .then(function() {
                var node = d3.select('text.annotation-text').node();
                assertBBox(Drawing.bBox(node), {
                    height: 14,
                    width: 27.671875,
                    left: -13.671875,
                    top: -11,
                    right: 14,
                    bottom: 3
                });

                window.scroll(0, 200);
                return Plotly.relayout(gd, 'annotations[0].text', 'HELLO');
            })
            .then(function() {
                var node = d3.select('text.annotation-text').node();
                assertBBox(Drawing.bBox(node), {
                    height: 14,
                    width: 41.015625,
                    left: -20.671875,
                    top: -11,
                    right: 20.34375,
                    bottom: 3
                });

                window.scroll(200, 0);
                return Plotly.relayout(gd, 'annotations[0].font.size', 20);
            })
            .then(function() {
                var node = d3.select('text.annotation-text').node();
                assertBBox(Drawing.bBox(node), {
                    height: 22,
                    width: 66.015625,
                    left: -32.78125,
                    top: -18,
                    right: 33.234375,
                    bottom: 4
                });
            })
            .catch(fail)
            .then(done);
        });

        it('works with dummy nodes created in Drawing.tester', function() {
            var node = Drawing.tester.append('text')
                .text('bananas')
                .call(Drawing.font, '"Open Sans", verdana, arial, sans-serif', 19)
                .call(svgTextUtils.convertToTspans).node();

            expect(node.parentNode).toBe(Drawing.tester.node());

            assertBBox(Drawing.bBox(node), {
                height: 21,
                width: 76,
                left: 0,
                top: -17,
                right: 76,
                bottom: 4
            });

            expect(node.parentNode).toBe(Drawing.tester.node());

            node.parentNode.removeChild(node);
        });
    });
});

describe('gradients', function() {
    var gd;

    beforeEach(function() {
        gd = createGraphDiv();
    });

    afterEach(destroyGraphDiv);

    function checkGradientIds(ids, types, c1, c2) {
        var expected = ids.map(function(id) {
            return 'g' + gd._fullLayout._uid + '-' + gd._fullData[0].uid + id;
        });

        var gids = [];
        var typesOut = [];
        var c1Out = [];
        var c2Out = [];
        var gradients = d3.select(gd).selectAll('radialGradient,linearGradient');
        gradients.each(function() {
            gids.push(this.id);
            typesOut.push(this.nodeName.replace('Gradient', ''));
            c1Out.push(d3.select(this).select('stop[offset="100%"]').attr('stop-color'));
            c2Out.push(d3.select(this).select('stop[offset="0%"]').attr('stop-color'));
        });
        gids.sort();

        expect(gids.length).toBe(expected.length);

        for(var i = 0; i < Math.min(gids.length, expected.length); i++) {
            expect(gids[i]).toBe(expected[i]);
            expect(typesOut[i]).toBe(types[i]);
            expect(c1Out[i]).toBe(c1[i]);
            expect(c2Out[i]).toBe(c2[i]);
        }
    }

    it('clears unused gradients after a replot', function(done) {
        Plotly.plot(gd, [{
            y: [0, 1, 2],
            mode: 'markers',
            marker: {
                color: '#123',
                gradient: {
                    type: 'radial',
                    color: ['#fff', '#eee', '#ddd']
                }
            }
        }])
        .then(function() {
            checkGradientIds(
                ['-0', '-1', '-2'],
                ['radial', 'radial', 'radial'],
                ['rgb(17, 34, 51)', 'rgb(17, 34, 51)', 'rgb(17, 34, 51)'],
                ['rgb(255, 255, 255)', 'rgb(238, 238, 238)', 'rgb(221, 221, 221)']);

            return Plotly.restyle(gd, {'marker.color': '#456'});
        })
        .then(function() {
            // simple scalar restyle doesn't trigger a full replot, so
            // doesn't clear the old gradients
            checkGradientIds(
                ['-0', '-1', '-2'],
                ['radial', 'radial', 'radial'],
                ['rgb(68, 85, 102)', 'rgb(68, 85, 102)', 'rgb(68, 85, 102)'],
                ['rgb(255, 255, 255)', 'rgb(238, 238, 238)', 'rgb(221, 221, 221)']);

            return Plotly.restyle(gd, {'marker.gradient.type': [['horizontal', 'vertical', 'radial']]});
        })
        .then(function() {
            // array restyle does replot
            checkGradientIds(
                ['-0', '-1', '-2'],
                ['linear', 'linear', 'radial'],
                ['rgb(68, 85, 102)', 'rgb(68, 85, 102)', 'rgb(68, 85, 102)'],
                ['rgb(255, 255, 255)', 'rgb(238, 238, 238)', 'rgb(221, 221, 221)']);

            return Plotly.restyle(gd, {
                'marker.gradient.type': 'vertical',
                'marker.gradient.color': '#abc'
            });
        })
        .then(function() {
            // down to a single gradient because they're all the same
            checkGradientIds(
                [''],
                ['linear'],
                ['rgb(68, 85, 102)'],
                ['rgb(170, 187, 204)']);

            return Plotly.restyle(gd, {'mode': 'lines'});
        })
        .then(function() {
            // full replot and no resulting markers at all -> no gradients
            checkGradientIds([], [], [], []);
        })
        .catch(fail)
        .then(done);
    });
});
