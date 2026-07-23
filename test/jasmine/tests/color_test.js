var Color = require('../../../src/components/color');


describe('Test color:', function() {
    'use strict';

    describe('fill', function() {
        it('should call style with both fill and fill-opacity', function() {
            var mockElement = {
                style: function(object) {
                    expect(object.fill).toBe('rgb(255, 255, 0)');
                    expect(object['fill-opacity']).toBe(0.5);
                }
            };

            Color.fill(mockElement, 'rgba(255,255,0,0.5)');
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

            Color.stroke(mockElement, 'rgba(255,255,0,0.5)');
        });
    });

    describe('adjustLightness', () => {
        it('lightens with a positive delta (additive in HSL L percentage points)', () => {
            // black (L=0) + 50 → mid gray (L=50)
            expect(Color.adjustLightness('#000', 50).hex()).toBe('#808080');
        });

        it('darkens with a negative delta', () => {
            // white (L=100) - 50 → mid gray (L=50)
            expect(Color.adjustLightness('#fff', -50).hex()).toBe('#808080');
        });

        it('shifts HSL lightness additively, not multiplicatively', () => {
            // additive: L 50.2 + 20 = 70.2 → #B3B3B3
            // multiplicative would give L 50.2 * 1.2 = 60.2 → #9A9A9A
            expect(Color.adjustLightness('#808080', 20).hex()).toBe('#B3B3B3');
        });

        it('preserves hue and saturation on chromatic colors', () => {
            // red (H=0, S=100, L=50) + 20 → HSL(0, 100, 70) → #FF6666
            expect(Color.adjustLightness('#ff0000', 20).hex()).toBe('#FF6666');
        });
    });

    describe('contrast', function() {
        it('should darken light colors', function() {
            var out = Color.contrast('#eee', 10, 20);

            expect(out).toEqual('rgb(187, 187, 187)');
        });

        it('should darken light colors (2)', function() {
            var out = Color.contrast('#fdae61', 10, 20);

            expect(out).toEqual('rgb(245, 123, 3)');
        });

        it('should lighten dark colors', function() {
            var out = Color.contrast('#2b83ba', 10, 20);

            expect(out).toEqual('rgb(68, 157, 212)');
        });
    });
});
