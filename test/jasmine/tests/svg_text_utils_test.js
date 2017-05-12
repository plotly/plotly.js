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
                .call(util.convertToTspans)
                .attr('transform', 'translate(50,50)');
        }

        function assertAnchorLink(node, href) {
            var a = node.select('a');

            expect(a.attr('xlink:href')).toBe(href);
            expect(a.attr('xlink:show')).toBe(href === null ? null : 'new');
        }

        function assertTspanStyle(node, style) {
            var tspan = node.select('tspan');
            expect(tspan.attr('style')).toBe(style);
        }

        function assertAnchorAttrs(node, style) {
            var a = node.select('a');

            var WHITE_LIST = ['xlink:href', 'xlink:show', 'style'],
                attrs = listAttributes(a.node());

            // check that no other attribute are found in anchor,
            // which can be lead to XSS attacks.

            var hasWrongAttr = attrs.some(function(attr) {
                return WHITE_LIST.indexOf(attr) === -1;
            });

            expect(hasWrongAttr).toBe(false);

            expect(a.attr('style')).toBe('cursor:pointer;' + (style || ''));
        }

        function listAttributes(node) {
            var items = Array.prototype.slice.call(node.attributes);

            var attrs = items.map(function(item) {
                return item.name;
            });

            return attrs;
        }

        afterEach(function() {
            d3.select('#text').remove();
        });

        it('checks for XSS attack in href', function() {
            var node = mockTextSVGElement(
                '<a href="javascript:alert(\'attack\')">XSS</a>'
            );

            expect(node.text()).toEqual('XSS');
            assertAnchorAttrs(node);
            assertAnchorLink(node, null);
        });

        it('checks for XSS attack in href (with plenty of white spaces)', function() {
            var node = mockTextSVGElement(
                '<a href =    "     javascript:alert(\'attack\')">XSS</a>'
            );

            expect(node.text()).toEqual('XSS');
            assertAnchorAttrs(node);
            assertAnchorLink(node, null);
        });

        it('whitelists relative hrefs (interpreted as http)', function() {
            var node = mockTextSVGElement(
                '<a href="/mylink">mylink</a>'
            );

            expect(node.text()).toEqual('mylink');
            assertAnchorAttrs(node);
            assertAnchorLink(node, '/mylink');
        });

        it('whitelists http hrefs', function() {
            var node = mockTextSVGElement(
                '<a href="http://bl.ocks.org/">bl.ocks.org</a>'
            );

            expect(node.text()).toEqual('bl.ocks.org');
            assertAnchorAttrs(node);
            assertAnchorLink(node, 'http://bl.ocks.org/');
        });

        it('whitelists https hrefs', function() {
            var node = mockTextSVGElement(
                '<a href="https://plot.ly">plot.ly</a>'
            );

            expect(node.text()).toEqual('plot.ly');
            assertAnchorAttrs(node);
            assertAnchorLink(node, 'https://plot.ly');
        });

        it('whitelists mailto hrefs', function() {
            var node = mockTextSVGElement(
                '<a href="mailto:support@plot.ly">support</a>'
            );

            expect(node.text()).toEqual('support');
            assertAnchorAttrs(node);
            assertAnchorLink(node, 'mailto:support@plot.ly');
        });

        it('drops XSS attacks in href', function() {
            // "XSS" gets interpreted as a relative link (http)
            var textCases = [
                '<a href="XSS\" onmouseover="alert(1)\" style="font-size:300px">Subtitle</a>',
                '<a href="XSS" onmouseover="alert(1)" style="font-size:300px">Subtitle</a>'
            ];

            textCases.forEach(function(textCase) {
                var node = mockTextSVGElement(textCase);

                expect(node.text()).toEqual('Subtitle');
                assertAnchorAttrs(node, 'font-size:300px');
                assertAnchorLink(node, 'XSS');
            });
        });

        it('accepts href and style in <a> in any order and tosses other stuff', function() {
            var textCases = [
                '<a href="x" style="y">z</a>',
                '<a href=\'x\' style="y">z</a>',
                '<A HREF="x"StYlE=\'y\'>z</a>',
                '<a style=\'y\'href=\'x\'>z</A>',
                '<a \t\r\n href="x" \n\r\t style="y"  \n  \t  \r>z</a>',
                '<a magic="true" href="x" weather="cloudy" style="y" speed="42">z</a>',
                '<a href="x" style="y">z</a href="nope" style="for real?">',
            ];

            textCases.forEach(function(textCase) {
                var node = mockTextSVGElement(textCase);

                expect(node.text()).toEqual('z');
                assertAnchorAttrs(node, 'y');
                assertAnchorLink(node, 'x');
            });
        });

        it('keeps query parameters in href', function() {
            var textCases = [
                '<a href="https://abc.com/myFeature.jsp?name=abc&pwd=def">abc.com?shared-key</a>',
                '<a href="https://abc.com/myFeature.jsp?name=abc&amp;pwd=def">abc.com?shared-key</a>'
            ];

            textCases.forEach(function(textCase) {
                var node = mockTextSVGElement(textCase);

                assertAnchorAttrs(node);
                expect(node.text()).toEqual('abc.com?shared-key');
                assertAnchorLink(node, 'https://abc.com/myFeature.jsp?name=abc&pwd=def');
            });
        });

        it('allows basic spans', function() {
            var node = mockTextSVGElement(
                '<span>text</span>'
            );

            expect(node.text()).toEqual('text');
            assertTspanStyle(node, null);
        });

        it('ignores unquoted styles in spans', function() {
            var node = mockTextSVGElement(
                '<span style=unquoted>text</span>'
            );

            expect(node.text()).toEqual('text');
            assertTspanStyle(node, null);
        });

        it('allows quoted styles in spans', function() {
            var node = mockTextSVGElement(
                '<span style="quoted: yeah;">text</span>'
            );

            expect(node.text()).toEqual('text');
            assertTspanStyle(node, 'quoted: yeah;');
        });

        it('ignores extra stuff after span styles', function() {
            var node = mockTextSVGElement(
                '<span style="quoted: yeah;"disallowed: indeed;">text</span>'
            );

            expect(node.text()).toEqual('text');
            assertTspanStyle(node, 'quoted: yeah;');
        });

        it('escapes HTML entities in span styles', function() {
            var node = mockTextSVGElement(
                '<span style="quoted: yeah&\';;">text</span>'
            );

            expect(node.text()).toEqual('text');
            assertTspanStyle(node, 'quoted: yeah&\';;');
        });

        it('decodes some HTML entities in text', function() {
            var node = mockTextSVGElement(
                '100&mu; &amp; &lt; 10 &gt; 0 &nbsp;' +
                '100 &times; 20 &plusmn; 0.5 &deg;'
            );

            expect(node.text()).toEqual('100μ & < 10 > 0  100 × 20 ± 0.5 °');
        });
    });
});
