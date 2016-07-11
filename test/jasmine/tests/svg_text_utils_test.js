var d3 = require('d3');

var util = require('@src/lib/svg_text_utils');


describe('svg+text utils', function() {
    'use strict';

    describe('convertToTspans should', function() {

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

        function assertAnchorAttrs(node) {
            var a = node.select('a');

            var WHITE_LIST = ['xlink:href', 'xlink:show', 'style'],
                attrs = listAttributes(a.node());

            // check that no other attribute are found in anchor,
            // which can be lead to XSS attacks.

            var hasWrongAttr = attrs.some(function(attr) {
                return WHITE_LIST.indexOf(attr) === -1;
            });

            expect(hasWrongAttr).toBe(false);
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

        it('check for XSS attack in href', function() {
            var node = mockTextSVGElement(
                '<a href="javascript:alert(\'attack\')">XSS</a>'
            );

            expect(node.text()).toEqual('XSS');
            assertAnchorAttrs(node);
            assertAnchorLink(node, null);
        });

        it('check for XSS attack in href (with plenty of white spaces)', function() {
            var node = mockTextSVGElement(
                '<a href =    "     javascript:alert(\'attack\')">XSS</a>'
            );

            expect(node.text()).toEqual('XSS');
            assertAnchorAttrs(node);
            assertAnchorLink(node, null);
        });

        it('whitelist http hrefs', function() {
            var node = mockTextSVGElement(
                '<a href="http://bl.ocks.org/">bl.ocks.org</a>'
            );

            expect(node.text()).toEqual('bl.ocks.org');
            assertAnchorAttrs(node);
            assertAnchorLink(node, 'http://bl.ocks.org/');
        });

        it('whitelist https hrefs', function() {
            var node = mockTextSVGElement(
                '<a href="https://plot.ly">plot.ly</a>'
            );

            expect(node.text()).toEqual('plot.ly');
            assertAnchorAttrs(node);
            assertAnchorLink(node, 'https://plot.ly');
        });

        it('whitelist mailto hrefs', function() {
            var node = mockTextSVGElement(
                '<a href="mailto:support@plot.ly">support</a>'
            );

            expect(node.text()).toEqual('support');
            assertAnchorAttrs(node);
            assertAnchorLink(node, 'mailto:support@plot.ly');
        });

        it('wrap XSS attacks in href', function() {
            var textCases = [
                '<a href="XSS\" onmouseover=&quot;alert(1)\" style=&quot;font-size:300px">Subtitle</a>',
                '<a href="XSS&quot; onmouseover=&quot;alert(1)&quot; style=&quot;font-size:300px">Subtitle</a>'
            ];

            textCases.forEach(function(textCase) {
                var node = mockTextSVGElement(textCase);

                expect(node.text()).toEqual('Subtitle');
                assertAnchorAttrs(node);
                assertAnchorLink(node, 'XSS onmouseover=alert(1) style=font-size:300px');
            });
        });

        it('should keep query parameters in href', function() {
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
    });
});
