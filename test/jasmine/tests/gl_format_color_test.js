const { formatColor, parseColorScale } = require('../../../src/lib/gl_format_color');
const Color = require('../../../src/components/color');

describe('Test gl_format_color:', () => {
    'use strict';

    // Every channel written here lands in a WebGL buffer. A null or a NaN
    // reaches the shader as undefined behavior rather than as a visible
    // wrong color, so the values matter more than the exact hue.
    const expectUsableChannels = (rgba, msg) => {
        expect(rgba.length).toBe(4, `${msg}: four channels`);
        rgba.forEach((v, i) => {
            expect(typeof v).toBe('number', `${msg}: channel ${i} is a number`);
            expect(isFinite(v)).toBe(true, `${msg}: channel ${i} is finite`);
            expect(v >= 0 && v <= 1).toBe(true, `${msg}: channel ${i} in [0, 1], got ${v}`);
        });
    };

    describe('formatColor', () => {
        it('should convert a single color', () => {
            expectUsableChannels(formatColor({ color: 'red' }, 1, 1), 'red');
            expect(formatColor({ color: 'red' }, 1, 1)).toEqual([1, 0, 0, 1]);
        });

        it('should apply opacity to the alpha channel', () => {
            expect(formatColor({ color: 'red' }, 0.5, 1)).toEqual([1, 0, 0, 0.5]);
            expect(formatColor({ color: 'rgba(255, 0, 0, 0.5)' }, 0.5, 1)).toEqual([1, 0, 0, 0.25]);
        });

        it('should fall back to the default line color for an unparseable color', () => {
            const dflt = Color.normalize(Color.defaultLine);

            ['notacolor', '', undefined, null, {}].forEach((c) => {
                expectUsableChannels(formatColor({ color: c }, 1, 1), String(c));
                expect(formatColor({ color: c }, 1, 1)).toEqual(dflt, String(c));
            });
        });

        // A per-point color may be a color string, raw channels as a plain array
        // or a typed array, or something unparseable
        it('should resolve every element of an array color', () => {
            const orange = new Uint8Array([255, 127, 0]);
            const dflt = Color.normalize(Color.defaultLine);
            const out = formatColor({ color: ['red', [0, 255, 0], 'rgba(0,0,255,0.5)', orange, 'notacolor'] }, 1, 5);

            expect(out.length).toBe(5);
            expect(out[0]).toEqual([1, 0, 0, 1], 'red');
            expect(out[1]).toEqual([0, 1, 0, 1], '[0, 255, 0]');
            expect(out[2]).toEqual([0, 0, 1, 0.5], 'rgba(0,0,255,0.5)');
            expect(out[3]).toEqual([1, 127 / 255, 0, 1], 'Uint8Array orange');
            expect(out[4]).toEqual(dflt, 'notacolor');
            out.forEach((rgba, i) => expectUsableChannels(rgba, `point ${i}`));
        });

        it('should write usable channels for a per-point colorscale', () => {
            const out = formatColor(
                {
                    color: [1, 2, 3],
                    colorscale: [
                        [0, 'rgb(0, 0, 255)'],
                        [1, 'rgb(255, 0, 0)']
                    ],
                    cmin: 1,
                    cmax: 3
                },
                1,
                3
            );

            expect(out.length).toBe(3);
            out.forEach((rgba, i) => expectUsableChannels(rgba, `colorscale point ${i}`));
            expect(out[0]).not.toEqual(out[2], 'colorscale ends should differ');
        });

        // Points with no color fall back to a module-level default array, and
        // the opacity step multiplies the alpha of whatever it is handed.
        it('should not carry alpha between points or between calls', () => {
            const first = formatColor({ color: [undefined, undefined] }, 0.5, 2);
            const second = formatColor({ color: [undefined, undefined] }, 0.5, 2);

            expect(first[0]).toEqual(first[1], 'the two points differ within one call');
            expect(first[0]).not.toBe(first[1], 'both points share one array');
            expect(second).toEqual(first, 'alpha decayed between calls');
        });

        it('should clip a wide-gamut color into the buffer range', () => {
            expectUsableChannels(formatColor({ color: 'color(display-p3 1 0 0)' }, 1, 1), 'display-p3');
        });

        it('should fall back to the default line color for a numeric color in an array', () => {
            const out = formatColor({ color: [42, 'red'] }, 1, 2);

            expect(out[0]).toEqual(Color.normalize(Color.defaultLine));
            expect(out[1]).toEqual([1, 0, 0, 1]);
        });

        it('should treat a scalar color the same as an array color', () => {
            const dflt = Color.normalize(Color.defaultLine);

            expect(formatColor({ color: 42 }, 1, 1)).toEqual(dflt);
            expect(formatColor({ color: [42, 42] }, 1, 2)[0]).toEqual(dflt);
        });
    });

    describe('parseColorScale', () => {
        it('should return an index and a 0-255 rgba array per stop', () => {
            const out = parseColorScale({
                colorscale: [
                    [0, 'rgb(0, 0, 255)'],
                    [0.5, 'red'],
                    [1, 'rgb(0, 255, 0)']
                ]
            });

            expect(out.length).toBe(3);
            expect(out[0].index).toBe(0);
            expect(out[1].rgb).toEqual([255, 0, 0, 1]);
            out.forEach((stop, i) => {
                expect(stop.rgb.length).toBe(4, `stop ${i}`);
                stop.rgb.forEach((v) => expect(isFinite(v)).toBe(true, `stop ${i} is finite`));
            });
        });

        it('should honor reversescale', () => {
            const colorscale = [
                [0, 'rgb(0, 0, 255)'],
                [1, 'rgb(255, 0, 0)']
            ];
            const fwd = parseColorScale({ colorscale });
            const rev = parseColorScale({ colorscale, reversescale: true });

            expect(rev[0].rgb).toEqual(fwd[fwd.length - 1].rgb);
        });
    });
});
