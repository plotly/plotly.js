var d3 = require('d3');

var util = require('@src/lib/svg_text_utils');


describe('svg+text utils', function() {
    'use strict';

    describe('convertToTspans', function() {

        function mockTextSVGElement(txt) {
            return d3.select('body')
                .append('svg')
                .attr('id', 'text')
                .append('text')
                .text(txt)
                .call(util.convertToTspans);
        }

        afterEach(function() {
            d3.select('#text').remove();
        });

        it('checks for XSS attack in href', function() {
            var node = mockTextSVGElement(
                '<a href="javascript:alert(\'attack\')">XSS</a>'
            );

            expect(node.text()).toEqual('XSS');
            expect(node.select('a').attr('xlink:href')).toBe(null);
        });

        it('checks for XSS attack in href (with plenty of white spaces)', function() {
            var node = mockTextSVGElement(
                '<a href =    "     javascript:alert(\'attack\')">XSS</a>'
            );

            expect(node.text()).toEqual('XSS');
            expect(node.select('a').attr('xlink:href')).toBe(null);
        });

        it('whitelists http hrefs', function() {
            var node = mockTextSVGElement(
                '<a href="http://bl.ocks.org/">bl.ocks.org</a>'
            );

            expect(node.text()).toEqual('bl.ocks.org');
            expect(node.select('a').attr('xlink:href')).toEqual('http://bl.ocks.org/');
        });

        it('whitelists https hrefs', function() {
            var node = mockTextSVGElement(
                '<a href="https://plot.ly">plot.ly</a>'
            );

            expect(node.text()).toEqual('plot.ly');
            expect(node.select('a').attr('xlink:href')).toEqual('https://plot.ly');
        });

        it('whitelists mailto hrefs', function() {
            var node = mockTextSVGElement(
                '<a href="mailto:support@plot.ly">support</a>'
            );

            expect(node.text()).toEqual('support');
            expect(node.select('a').attr('xlink:href')).toEqual('mailto:support@plot.ly');
        });
    });
});
