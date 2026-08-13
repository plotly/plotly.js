var Color = require('../../../src/components/color');

describe('Test color:', function () {
    'use strict';

    describe('fill', function () {
        it('should call style with both fill and fill-opacity', function () {
            var mockElement = {
                style: function (object) {
                    expect(object.fill).toBe('rgb(255, 255, 0)');
                    expect(object['fill-opacity']).toBe(0.5);
                }
            };

            Color.fill(mockElement, 'rgba(255,255,0,0.5)');
        });
    });

    describe('stroke', function () {
        it('should call style with both fill and fill-opacity', function () {
            var mockElement = {
                style: function (object) {
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
            expect(Color.hexString(Color.adjustLightness('#000', 50))).toBe('#808080');
        });

        it('darkens with a negative delta', () => {
            // white (L=100) - 50 → mid gray (L=50)
            expect(Color.hexString(Color.adjustLightness('#fff', -50))).toBe('#808080');
        });

        it('shifts HSL lightness additively, not multiplicatively', () => {
            // additive: L 50.2 + 20 = 70.2 → #B3B3B3
            // multiplicative would give L 50.2 * 1.2 = 60.2 → #9A9A9A
            expect(Color.hexString(Color.adjustLightness('#808080', 20))).toBe('#B3B3B3');
        });

        it('preserves hue and saturation on chromatic colors', () => {
            // red (H=0, S=100, L=50) + 20 → HSL(0, 100, 70) → #FF6666
            expect(Color.hexString(Color.adjustLightness('#ff0000', 20))).toBe('#FF6666');
        });
    });

    describe('contrast', function () {
        it('should darken light colors', function () {
            var out = Color.contrast('#eee', 10, 20);

            expect(out).toEqual('rgb(187, 187, 187)');
        });

        it('should darken light colors (2)', function () {
            var out = Color.contrast('#fdae61', 10, 20);

            expect(out).toEqual('rgb(245, 122, 3)');
        });

        it('should lighten dark colors', function () {
            var out = Color.contrast('#2b83ba', 10, 20);

            expect(out).toEqual('rgb(68, 157, 212)');
        });

        // Colors whose two candidate labels sit close together. A luma
        // approximation puts several of these on the wrong side.
        it('picks the more legible label for near-threshold colors', () => {
            ['rgb(0, 200, 0)', '#3D9970', '#FF4136', '#808080', '#4499FF', 'gray'].forEach((c) => {
                const picked = Color.contrast(c);
                const other = Color.equals(picked, Color.background) ? Color.defaultLine : Color.background;

                expect(Color.wcagContrast(c, picked)).not.toBeLessThan(Color.wcagContrast(c, other), c);
            });
        });

        it('flattens a translucent color onto the background first', () => {
            expect(Color.contrast('rgba(0, 0, 0, 0.1)')).toBe('rgb(68, 68, 68)');
        });
    });

    describe('isDark', () => {
        it('reads saturated mid-tones by contrast, not by lightness', () => {
            expect(Color.isDark('rgb(0, 200, 0)')).toBe(false);
            expect(Color.isDark('#3D9970')).toBe(true);
            expect(Color.isDark('#808080')).toBe(true);
        });
    });

    describe('invalid input', () => {
        const BAD = [undefined, null, 42, [255, 0, 0], { r: 255, g: 0, b: 0 }, 'notacolor', '', '#gg0000'];

        it('falls back to opaque black instead of throwing', () => {
            BAD.forEach((v) => expect(Color.rgbaString(v)).toBe('rgb(0, 0, 0)'));
        });

        it('reports the value as invalid', () => {
            BAD.forEach((v) => expect(Color.isValid(v)).toBe(false));
        });

        // Null channels used to reach the WebGL buffers through this path.
        it('normalizes to four numeric channels', () => {
            BAD.forEach((v) => expect(Color.normalize(v)).toEqual([0, 0, 0, 1]));
        });
    });

    describe('isValid', () => {
        it('accepts CSS Color 4 syntax', () => {
            [
                'oklch(0.7 0.15 180)',
                'lab(50% 40 59.5)',
                'color(display-p3 1 0 0)',
                'hwb(120 0% 0%)',
                'hsl(0.5turn 50% 50%)',
                'hsl(120 50% 50% / 50%)',
                'hsl(none 50% 50%)',
                'rgb(255 0 0 / 50%)'
            ].forEach((s) => expect(Color.isValid(s)).toBe(true, s));
        });

        it('rejects a mix of comma and space separators', () => {
            expect(Color.isValid('hsl(120, 50% 50%)')).toBe(false);
        });

        it('rejects hsv, which is not CSS', () => {
            expect(Color.isValid('hsv(120, 50%, 50%)')).toBe(false);
        });
    });

    describe('rounding', () => {
        // #eee at -10 lightness is exactly 212.5 in 8 bits, but floating point
        // makes it 212.49999999999997.
        it('repairs float error before rounding a channel', () => {
            expect(Color.adjustLightness('#eee', -10)).toBe('rgb(213, 213, 213)');
            expect(Color.rgbaArrayToString([53, 70.49999999999999, 208, 1])).toBe('rgb(53, 71, 208)');
        });

        // #fdae61 at -20 lightness is a true 122.45, which must round down.
        it('leaves a genuine fraction alone', () => {
            expect(Color.contrast('#fdae61', 10, 20)).toBe('rgb(245, 122, 3)');
        });
    });

    describe('mix', () => {
        it('interpolates between two opaque colors', () => {
            expect(Color.mix('red', 'blue', 50)).toBe('rgb(128, 0, 128)');
            expect(Color.mix('#444', 'white', 60)).toBe('rgb(180, 180, 180)');
        });

        it('returns each end at the extremes', () => {
            expect(Color.mix('red', 'blue', 0)).toBe('rgb(255, 0, 0)');
            expect(Color.mix('red', 'blue', 100)).toBe('rgb(0, 0, 255)');
        });

        // Weighting the channels by the alpha difference keeps a mix toward a
        // transparent color from dragging the channels toward its unused rgb.
        it('shifts alpha without darkening when mixing toward transparent', () => {
            expect(Color.mix('#444', 'rgba(0, 0, 0, 0)', 60)).toBe('rgba(68, 68, 68, 0.4)');
        });
    });

    describe('combine', () => {
        it('returns an opaque front unchanged', () => {
            expect(Color.combine('red', '#fff')).toBe('rgb(255, 0, 0)');
        });

        it('composites a translucent front onto the back', () => {
            expect(Color.combine('rgba(255, 0, 0, 0.5)', '#fff')).toBe('rgb(255, 128, 128)');
            expect(Color.combine('rgba(255, 255, 255, 0.5)', '#000')).toBe('rgb(128, 128, 128)');
        });
    });

    describe('clipping', () => {
        it('clips a wide-gamut color into sRGB', () => {
            expect(Color.rgbaArray('color(display-p3 1 0 0)')).toEqual([255, 0, 0, 1]);
            expect(Color.normalize('color(display-p3 1 0 0)', 'uint8')).toEqual(Uint8Array.from([255, 0, 0, 255]));
        });
    });

    describe('known values', () => {
        it('wcagContrast spans 1 to 21', () => {
            expect(Color.wcagContrast('#fff', '#000')).toBe(21);
            expect(Color.wcagContrast('red', 'red')).toBe(1);
        });

        it('reads alpha', () => {
            expect(Color.opacity('rgba(255, 0, 0, 0.5)')).toBe(0.5);
            expect(Color.opacity('red')).toBe(1);
            expect(Color.opacity('transparent')).toBe(0);
        });

        it('sets alpha', () => {
            expect(Color.addOpacity('red', 0.5)).toBe('rgba(255, 0, 0, 0.5)');
            expect(Color.addOpacity('rgba(255, 0, 0, 0.5)', 1)).toBe('rgb(255, 0, 0)');
            expect(Color.addOpacity('red', 2)).toBe('rgb(255, 0, 0)');
        });

        it('formats as rgb and hex', () => {
            expect(Color.rgbaString('red')).toBe('rgb(255, 0, 0)');
            expect(Color.rgbaString('rgba(255, 0, 0, 0.5)')).toBe('rgba(255, 0, 0, 0.5)');
            expect(Color.hexString('#1f77b4')).toBe('#1F77B4');
        });

        it('compares colors across notations', () => {
            expect(Color.equals('red', 'rgb(255, 0, 0)')).toBe(true);
            expect(Color.equals('red', 'blue')).toBe(false);
        });

        it('converts to a 0-255 array', () => {
            expect(Color.rgbaArray('rgba(255, 0, 0, 0.5)')).toEqual([255, 0, 0, 0.5]);
            expect(Color.rgbaArrayToString([255, 0, 0, 0.5])).toBe('rgba(255, 0, 0, 0.5)');
        });
    });
});
