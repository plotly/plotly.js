var d3 = require('d3');

var util = require('@src/lib/svg_text_utils');


describe('svg+text utils', function() {
    'use strict';

    describe('convertToTspans', function() {

        function mockTextSVGElement(txt) {
            return d3.select('body')
                .append('svg')
                .classed('text-tester', true)
                .append('text')
                .text(txt)
                .call(util.convertToTspans)
                .attr('transform', 'translate(50,50)');
        }

        function assertAnchorLink(node, href, target, show, msg) {
            var a = node.select('a');

            if(target === undefined) target = href === null ? null : '_blank';
            if(show === undefined) show = href === null ? null : 'new';

            expect(a.attr('xlink:href')).toBe(href, msg);
            expect(a.attr('target')).toBe(target, msg);
            expect(a.attr('xlink:show')).toBe(show, msg);
        }

        function assertTspanStyle(node, style, msg) {
            var tspan = node.select('tspan');
            expect(tspan.attr('style')).toBe(style, msg);
        }

        function assertAnchorAttrs(node, expectedAttrs, msg) {
            var a = node.select('a');

            if(!expectedAttrs) expectedAttrs = {};

            var WHITE_LIST = ['xlink:href', 'xlink:show', 'style', 'target', 'onclick'],
                attrs = listAttributes(a.node());

            // check that no other attribute are found in anchor,
            // which can be lead to XSS attacks.

            var wrongAttrs = [];
            attrs.forEach(function(attr) {
                if(WHITE_LIST.indexOf(attr) === -1) wrongAttrs.push(attr);
            });

            expect(wrongAttrs).toEqual([], msg);

            var style = expectedAttrs.style || '';
            var fullStyle = style || '';
            if(style) fullStyle += ';';
            fullStyle += 'cursor:pointer';

            expect(a.attr('style')).toBe(fullStyle, msg);

            expect(a.attr('onclick')).toBe(expectedAttrs.onclick || null, msg);

        }

        function listAttributes(node) {
            var items = Array.prototype.slice.call(node.attributes);

            var attrs = items.map(function(item) {
                return item.name;
            });

            return attrs;
        }

        afterEach(function() {
            d3.selectAll('.text-tester').remove();
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
                assertAnchorAttrs(node, {style: 'font-size:300px'});
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
                assertAnchorAttrs(node, {style: 'y'});
                assertAnchorLink(node, 'x');
            });
        });

        it('accepts `target` with links and tries to translate it to `xlink:show`', function() {
            var specs = [
                {target: '_blank', show: 'new'},
                {target: '_self', show: 'replace'},
                {target: '_parent', show: 'replace'},
                {target: '_top', show: 'replace'},
                {target: 'some_frame_name', show: 'new'}
            ];
            specs.forEach(function(spec) {
                var node = mockTextSVGElement('<a href="x" target="' + spec.target + '">link</a>');
                assertAnchorLink(node, 'x', spec.target, spec.show, spec.target);
            });
        });

        it('attaches onclick if popup is specified', function() {
            var node = mockTextSVGElement('<a href="x" target="fred" popup="width=500,height=400">link</a>');
            assertAnchorLink(node, 'x', 'fred', 'new');
            assertAnchorAttrs(node, {onclick: 'window.open(this.href.baseVal,this.target.baseVal,"width=500,height=400");return false;'});
        });

        it('drops XSS attacks via popup script', function() {
            var textCases = [
                [
                    '<a href=\'#\' target=\'b\' popup=\'1");alert(document.cookie);//\'>XSS</a>',
                    '#', 'b', null
                ],
                [
                    '<a href=\'#\' target=\'b");alert(document.cookie);//\' popup=\'1\'>XSS</a>',
                    '#', 'b");alert(document.cookie);//', '1'
                ],
                [
                    '<a href=\'#");alert(document.cookie);//\' target=\'b\' popup=\'1\'>XSS</a>',
                    '#%22);alert(document.cookie);//', 'b', '1'
                ]
            ];

            textCases.forEach(function(textCase) {
                var node = mockTextSVGElement(textCase[0]);

                var attrs = {};
                if(textCase[3]) {
                    attrs.onclick = 'window.open(this.href.baseVal,this.target.baseVal,"' +
                        textCase[3] + '");return false;';
                }

                expect(node.text()).toEqual('XSS');
                assertAnchorAttrs(node, attrs, textCase[0]);
                assertAnchorLink(node, textCase[1], textCase[2], 'new', textCase[0]);
            });
        });

        it('keeps query parameters in href', function() {
            var textCases = [
                '<a href="https://abc.com/myFeature.jsp?name=abc&pwd=def">abc.com?shared-key</a>',
                '<a href="https://abc.com/myFeature.jsp?name=abc&amp;pwd=def">abc.com?shared-key</a>'
            ];

            textCases.forEach(function(textCase) {
                var node = mockTextSVGElement(textCase);

                assertAnchorAttrs(node, {}, textCase);
                expect(node.text()).toEqual('abc.com?shared-key', textCase);
                assertAnchorLink(node, 'https://abc.com/myFeature.jsp?name=abc&pwd=def', undefined, undefined, textCase);
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

        it('decodes some HTML entities in text (number case)', function() {
            var node = mockTextSVGElement(
                '100&#956; &#28; &#60; 10 &#62; 0 &#160;' +
                '100 &#215; 20 &#177; 0.5 &#176;'
            );

            expect(node.text()).toEqual('100μ & < 10 > 0  100 × 20 ± 0.5 °');
        });

        it('supports superscript by itself', function() {
            var node = mockTextSVGElement('<sup>123</sup>');
            expect(node.html()).toBe(
                '\u200b<tspan style="font-size:70%" dy="-0.6em">123</tspan>' +
                '<tspan dy="0.42em">\u200b</tspan>');
        });

        it('supports subscript by itself', function() {
            var node = mockTextSVGElement('<sub>123</sub>');
            expect(node.html()).toBe(
                '\u200b<tspan style="font-size:70%" dy="0.3em">123</tspan>' +
                '<tspan dy="-0.21em">\u200b</tspan>');
        });

        it('supports superscript and subscript together with normal text', function() {
            var node = mockTextSVGElement('SO<sub>4</sub><sup>2-</sup>');
            expect(node.html()).toBe(
                'SO\u200b<tspan style="font-size:70%" dy="0.3em">4</tspan>' +
                '<tspan dy="-0.21em">\u200b</tspan>\u200b' +
                '<tspan style="font-size:70%" dy="-0.6em">2-</tspan>' +
                '<tspan dy="0.42em">\u200b</tspan>');
        });

        it('allows one <b> to span <br>s', function() {
            var node = mockTextSVGElement('be <b>Bold<br>and<br><i>Strong</i></b>');
            expect(node.html()).toBe(
                '<tspan class="line" dy="0em" x="0" y="0">be ' +
                    '<tspan style="font-weight:bold">Bold</tspan></tspan>' +
                '<tspan class="line" dy="1.3em" x="0" y="0">' +
                    '<tspan style="font-weight:bold">and</tspan></tspan>' +
                '<tspan class="line" dy="2.6em" x="0" y="0">' +
                    '<tspan style="font-weight:bold">' +
                        '<tspan style="font-style:italic">Strong</tspan></tspan></tspan>');
        });

        it('allows one <sub> to span <br>s', function() {
            var node = mockTextSVGElement('SO<sub>4<br>44</sub>');
            expect(node.html()).toBe(
                '<tspan class="line" dy="0em" x="0" y="0">SO\u200b' +
                    '<tspan style="font-size:70%" dy="0.3em">4</tspan>' +
                    '<tspan dy="-0.21em">\u200b</tspan></tspan>' +
                '<tspan class="line" dy="1.3em" x="0" y="0">\u200b' +
                    '<tspan style="font-size:70%" dy="0.3em">44</tspan>' +
                    '<tspan dy="-0.21em">\u200b</tspan></tspan>');
        });

        it('allows nested tags to break at <br>, eventually closed or not', function() {
            var textCases = [
                '<b><i><sup>many<br>lines<br>modified',
                '<b><i><sup>many<br>lines<br>modified</sup></i></b>',
                '<b><i><sup>many</sup><br><sup>lines</sup></i><br><i><sup>modified',
            ];

            textCases.forEach(function(textCase) {
                var node = mockTextSVGElement(textCase);
                function opener(dy) {
                    return '<tspan class="line" dy="' + dy + 'em" x="0" y="0">' +
                        '<tspan style="font-weight:bold">' +
                        '<tspan style="font-style:italic">' +
                        '\u200b<tspan style="font-size:70%" dy="-0.6em">';
                }
                var closer = '</tspan><tspan dy="0.42em">\u200b</tspan>' +
                    '</tspan></tspan></tspan>';
                expect(node.html()).toBe(
                    opener(0) + 'many' + closer +
                    opener(1.3) + 'lines' + closer +
                    opener(2.6) + 'modified' + closer, textCase);
            });
        });

        it('ignores bare closing tags', function() {
            var node = mockTextSVGElement('</sub>');

            // sub shows up as a zero-width space (u200B) on either side of the 5:
            expect(node.text()).toEqual('');
        });

        it('ignores extra closing tags', function() {
            var node = mockTextSVGElement('test<sub>5</sub></sub>more');

            // sub shows up as a zero-width space (u200B) on either side of the 5:
            expect(node.text()).toEqual('test\u200b5\u200bmore');
        });
    });
});
