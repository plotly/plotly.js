var Drawing = require('@src/components/drawing');

var d3 = require('d3');

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
});
