var Color = require('@src/components/color');


describe('Test color:', function() {
    'use strict';

    describe('clean', function() {
        it('should turn rgb and rgba fractions into 0-255 values', function() {
            var container = {
                rgbcolor: 'rgb(0.3, 0.6, 0.9)',
                rgbacolor: 'rgba(0.2, 0.4, 0.6, 0.8)'
            };
            var expectedContainer = {
                rgbcolor: 'rgb(77, 153, 230)',
                rgbacolor: 'rgba(51, 102, 153, 0.8)'
            };

            Color.clean(container);
            expect(container).toEqual(expectedContainer);
        });

        it('should dive into objects, arrays, and colorscales', function() {
            var container = {
                color: ['rgb(0.3, 0.6, 0.9)', 'rgba(0.2, 0.4, 0.6, 0.8)'],
                nest: {
                    acolor: 'rgb(0.1, 0.2, 0.3)',
                    astring: 'rgb(0.1, 0.2, 0.3)'
                },
                objarray: [
                    {color: 'rgb(0.1, 0.2, 0.3)'},
                    {color: 'rgb(0.3, 0.6, 0.9)'}
                ],
                somecolorscale: [
                    [0, 'rgb(0.1, 0.2, 0.3)'],
                    [1, 'rgb(0.3, 0.6, 0.9)']
                ]
            };
            var expectedContainer = {
                color: ['rgb(77, 153, 230)', 'rgba(51, 102, 153, 0.8)'],
                nest: {
                    acolor: 'rgb(26, 51, 77)',
                    astring: 'rgb(0.1, 0.2, 0.3)'
                },
                objarray: [
                    {color: 'rgb(26, 51, 77)'},
                    {color: 'rgb(77, 153, 230)'}
                ],
                somecolorscale: [
                    [0, 'rgb(26, 51, 77)'],
                    [1, 'rgb(77, 153, 230)']
                ]
            };

            Color.clean(container);
            expect(container).toEqual(expectedContainer);
        });

        it('should count 0 as a fraction but not 1, except in alpha', function() {
            // this is weird... but old tinycolor actually breaks
            // if you pass in a 1, while in some cases a 1 here
            // could be ambiguous - so we treat it as a real 1.
            var container = {
                fractioncolor: 'rgb(0, 0.4, 0.8)',
                regularcolor: 'rgb(1, 0.5, 0.5)',
                fractionrgbacolor: 'rgba(0, 0.4, 0.8, 1)'
            };
            var expectedContainer = {
                fractioncolor: 'rgb(0, 102, 204)',
                regularcolor: 'rgb(1, 0.5, 0.5)',
                fractionrgbacolor: 'rgba(0, 102, 204, 1)'
            };

            Color.clean(container);
            expect(container).toEqual(expectedContainer);
        });

        it('should allow extra whitespace or space instead of commas', function() {
            var container = {
                rgbcolor: '   \t\r\n   rgb \r\t\n  (  0.3\t\n,\t 0.6\n\n,\n 0.9\n\n)\r\t\n\t   ',
                rgb2color: 'rgb(0.3 0.6 0.9)',
                rgbacolor: '   \t\r\n   rgba \r\t\n  (  0.2\t\n,\t 0.4\n\n,\n 0.6\n\n ,   0.8   )\r\t\n\t   '
            };
            var expectedContainer = {
                rgbcolor: 'rgb(77, 153, 230)',
                rgb2color: 'rgb(77, 153, 230)',
                rgbacolor: 'rgba(51, 102, 153, 0.8)'
            };

            Color.clean(container);
            expect(container).toEqual(expectedContainer);
        });

        it('should not change if r, g, b >= 1 but clip alpha > 1', function() {
            var container = {
                rgbcolor: 'rgb(0.1, 1.0, 0.5)',
                rgbacolor: 'rgba(0.1, 1.0, 0.5, 1234)',
                rgba2color: 'rgba(0.1, 0.2, 0.5, 1234)'
            };
            var expectedContainer = {
                rgbcolor: 'rgb(0.1, 1.0, 0.5)',
                rgbacolor: 'rgba(0.1, 1.0, 0.5, 1234)',
                rgba2color: 'rgba(26, 51, 128, 1)'
            };

            Color.clean(container);
            expect(container).toEqual(expectedContainer);
        });

        it('should not alter malformed strings or non-color keys', function() {
            var container = {
                color2: 'rgb(0.1, 0.1, 0.1)',
                acolor: 'rgbb(0.1, 0.1, 0.1)',
                bcolor: 'rgb(0.1, ,0.1)',
                ccolor: 'rgb(0.1, 0.1, 0.1',
                dcolor: 'rgb(0.1, 0.1, 0.1);'
            };
            var expectedContainer = {};
            Object.keys(container).forEach(function(k) { expectedContainer[k] = container[k]; });

            Color.clean(container);
            expect(container).toEqual(expectedContainer);
        });

        it('should not barf on nulls', function() {
            var container1 = null;
            var expectedContainer1 = null;

            Color.clean(container1);
            expect(container1).toEqual(expectedContainer1);

            var container2 = {
                anull: null,
                anundefined: undefined,
                color: null,
                anarray: [null, {color: 'rgb(0.1, 0.1, 0.1)'}]
            };
            var expectedContainer2 = {
                anull: null,
                anundefined: undefined,
                color: null,
                anarray: [null, {color: 'rgb(0.1, 0.1, 0.1)'}]
            };

            Color.clean(container2);
            expect(container2).toEqual(expectedContainer2);
        });
    });

    describe('fill', function() {

        it('should call style with both fill and fill-opacity', function() {
            var mockElement = {
                style: function(object) {
                    expect(object.fill).toBe('rgb(255, 255, 0)');
                    expect(object['fill-opacity']).toBe(0.5);
                }
            };

            Color.fill(mockElement, 'rgba(255,255,0,0.5');
        });

    });

    describe('stroke', function() {

        it('should call style with both fill and fill-opacity', function() {
            var mockElement = {
                style: function(object) {
                    expect(object.stroke).toBe('rgb(255, 255, 0)');
                    expect(object['stroke-opacity']).toBe(0.5);
                }
            };

            Color.stroke(mockElement, 'rgba(255,255,0,0.5');
        });

    });
});
