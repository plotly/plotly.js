var Drawing = require('@src/components/drawing');

var d3 = require('d3');


describe('Drawing.setClipUrl', function() {
    'use strict';

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
