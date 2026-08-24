'use strict';

/**
 * Color specifier handling for the whole library.
 *
 * Every function here that returns a color resolves a specifier it cannot parse
 * to opaque black, and warns. That includes a specifier that is missing, isn't
 * a string, or is not valid CSS. No function throws, and none returns null, so
 * callers never have to guard before drawing.
 */

// TODO: Import functions from `culori/fn` when converting to ESM to allow for tree-shaking
const {
    converter,
    formatHex: culoriFormatHex,
    formatRgb: culoriFormatRgb,
    wcagContrast: culoriWcagContrast,
    wcagLuminance
} = require('culori');
const { isArrayOrTypedArray } = require('../../lib/array');
const { warn } = require('../../lib/loggers');
const { background, defaultLine, defaults, lightLine } = require('./attributes');

const toRgb = converter('rgb');
const toHsl = converter('hsl');

// `toRgb` for callers that may hand over something other than a color string.
// Returns undefined for anything it cannot parse (the same as the converters).
const toColor = (cstr) => {
    if (typeof cstr !== 'string') return undefined;

    // Switch to lowercase because culori has a bug where it can't handle uppercase
    // for some valid values (`RGB(1,2,3)`, `hsl(0DEG 100% 50%)`, etc.)
    const s = cstr.trim().toLowerCase();

    // Disallow hex colors without # to match CSS color spec (culori allows them)
    // No CSS named color is spelled only in hex digits.
    if (/^[0-9a-f]+$/.test(s)) return undefined;

    // An unknown unit throws rather than returning undefined, as in `rgb(0px 1 2)`
    try {
        return toRgb(s);
    } catch (e) {
        return undefined;
    }
};

// Clamp a 0-1 channel to gamut. culori returns out-of-range values for wide-gamut
// inputs. Also maps undefined/NaN to 0 and Infinity to 1, matching the browser.
// `Lib.constrain` does not substitute here: it is Math.max/Math.min, so a NaN
// stays a NaN and reaches the WebGL buffers.
const clamp01 = (v) => (v > 0 ? (v > 1 ? 1 : v) : 0);

const BLACK = { mode: 'rgb', r: 0, g: 0, b: 0, alpha: 1 };

// Arithmetic on channels lands on values such as 0.8333333333333333, which is
// 212.49999999999997 in 8 bits. The culori formatters round that down to 212,
// one less than the intended 213. Round each channel to six decimals of an
// 8-bit step first. Six decimals absorb the float error and still leave a
// genuine value such as 122.45 alone.
const snap01 = (v) => Math.round(v * 255e6) / 255e6;
const snap = (c) => ({ ...c, r: snap01(c.r), g: snap01(c.g), b: snap01(c.b) });

const formatRgb = (c) => culoriFormatRgb(snap(c));
const formatHex = (c) => culoriFormatHex(snap(c));

/**
 * Parse a color specifier string and return it as a culori rgb color object.
 *
 * @param {*} cstr - Color specifier
 * @param {Boolean} [silent] - Skip the warning, for callers that run per data point
 * @return {Object} A culori rgb color ({ mode: 'rgb', r: _, g: _, b: _, alpha: _ })
 */
const parse = (cstr, silent) => {
    const c = toColor(cstr);
    if (!c) {
        if (!silent && cstr != null) warn(`Invalid color specifier: "${cstr}". Defaulting to "#000"`);
        return BLACK;
    }
    // `toRgb` omits alpha when it's 1; make sure it's added since we expect it
    c.alpha ??= 1;

    return c;
};

// TODO: rename to `rgbString` to better describe return value
/**
 * Convert any color specifier to a normalized `rgb(r, g, b)` string.
 * Force alpha to 1 so that it gets dropped in the result.
 *
 * @param {*} cstr - Color specifier
 * @return {String}
 */
const rgb = (cstr) => formatRgb({ ...parse(cstr), alpha: 1 });

/**
 * Return the alpha channel of a color (0 if falsy).
 *
 * @param {*} cstr - Color specifier
 * @return {Number} Alpha value in the range [0, 1]
 */
const opacity = (cstr) => (cstr ? parse(cstr).alpha : 0);

/**
 * Test whether a value holds raw color channels rather than a color specifier.
 *
 * Per-point colors in the WebGL paths arrive either way, as a plain array or as
 * a typed array. `normalize` accepts both; `isValid` accepts neither, since a
 * channel array is not a parseable string.
 *
 * @param {*} v - Value to test, of any type
 * @return {Boolean} `true` for 3 or more finite numbers
 */
const isChannelArray = (v) => {
    return (
        isArrayOrTypedArray(v) &&
        v.length > 2 &&
        Number.isFinite(v[0]) &&
        Number.isFinite(v[1]) &&
        Number.isFinite(v[2])
    );
};

// A channel above 1 means the array holds 0-255 values, otherwise it already
// holds 0-1 values. Alpha gets its own test because the two scales could be mixed.
const channelsToRgb = (v) => {
    const [r, g, b, alpha] = v;
    const scale = Math.max(r, g, b) > 1 ? 1 / 255 : 1;
    const a = alpha ?? 1;

    return { mode: 'rgb', r: r * scale, g: g * scale, b: b * scale, alpha: a > 1 ? a / 255 : a };
};

/**
 * Convert a color specifier to a 4-element `[r, g, b, a]` representation.
 *
 * `input` can also be a channel array, which the WebGL paths pass per data
 * point. An `r`, `g`, or `b` above 1 puts those three on a 0-255 scale. Alpha
 * scales on its own. Unlike the rest of this module, `normalize` never warns.
 *
 * @param {*} input - Color specifier, or an `[r, g, b]` / `[r, g, b, a]` channel array
 * @param {'uint8'|'uint8_clamped'|'float32'|'float64'} [type] - Omit for a plain
 *   array in [0, 1]. `'uint8'` and `'uint8_clamped'` return a `Uint8Array` in
 *   [0, 255]. `'float32'` and `'float64'` return a typed array in [0, 1].
 * @return {Number[]|Uint8Array}
 */
const normalize = (input, type) => {
    const c = isChannelArray(input) ? channelsToRgb(input) : parse(input, true);
    const v = [clamp01(c.r), clamp01(c.g), clamp01(c.b), clamp01(c.alpha)];
    if (type === 'uint8' || type === 'uint8_clamped') return Uint8Array.from(v, (x) => Math.round(x * 255));
    if (type === 'float32') return Float32Array.from(v);
    if (type === 'float64') return Float64Array.from(v);
    return v;
};

// TODO: rename to `setOpacity`, since it replaces the alpha rather than adding to it
/**
 * Replace a color's alpha channel with `op`.
 *
 * @param {*} cstr - Color specifier
 * @param {Number} op - Opacity. Will be clamped to the range [0, 1].
 * @return {String} `rgb(...)` when the result is opaque, `rgba(...)` otherwise
 */
const addOpacity = (cstr, op) => formatRgb({ ...parse(cstr), alpha: clamp01(op) });

/**
 * Combine two colors into one apparent color by compositing `front` over `back`.
 * If `back` is missing, the module `background` is assumed behind it.
 *
 * A translucent or transparent `back` is flattened against white, so a transparent
 * paper_bgcolor is treated as a white page. Opaque backs are exact.
 *
 * @param {*} front - Foreground color specifier
 * @param {*} back - Background color specifier
 * @return {String} Resulting `rgb(...)` string
 */
const combine = (front, back) => {
    const fc = parse(front);
    const fa = fc.alpha;
    if (fa === 1) return formatRgb(fc);

    const bc = parse(back || background);
    const ba = bc.alpha;
    const over = (f, b) => (ba === 1 ? b : 1 - ba + b * ba) * (1 - fa) + f * fa;

    return formatRgb({ mode: 'rgb', r: over(fc.r, bc.r), g: over(fc.g, bc.g), b: over(fc.b, bc.b) });
};

/**
 * Linearly interpolate between two colors at a normalized position (0 to 1).
 * Ignores alpha; result is `factor * first + (1 - factor) * second`.
 *
 * @param {*} first - Color specifier
 * @param {*} second - Color specifier
 * @param {Number} factor - Interpolation position in [0, 1]
 * @return {String} Resulting `rgb(...)` string
 */
const interpolate = (first, second, factor) => {
    const fc = parse(first);
    const sc = parse(second);
    const lerp = (a, b) => factor * a + (1 - factor) * b;

    return formatRgb({ mode: 'rgb', r: lerp(fc.r, sc.r), g: lerp(fc.g, sc.g), b: lerp(fc.b, sc.b) });
};

/**
 * Shift a color's HSL lightness additively by `delta` percentage points.
 * Positive delta = lighter, negative = darker. Alpha is preserved.
 *
 * @param {*} cstr - Color specifier
 * @param {Number} delta - Lightness shift in HSL percentage points
 * @return {String} Resulting `rgb(...)` string
 */
const adjustLightness = (cstr, delta) => {
    const c = parse(cstr);
    const h = toHsl(c) || { mode: 'hsl', h: 0, s: 0, l: 0 };
    return formatRgb(toRgb({ ...h, l: clamp01((h.l * 100 + delta) / 100), alpha: c.alpha }));
};

/**
 * WCAG contrast ratio between two colors, in [1, 21].
 *
 * @param {*} cstr1 - Color specifier
 * @param {*} cstr2 - Color specifier
 * @return {Number}
 */
const wcagContrast = (cstr1, cstr2) => culoriWcagContrast(parse(cstr1), parse(cstr2));

/**
 * Test whether a color reads as dark.
 *
 * Compares the contrast ratio against `background` with the contrast ratio
 * against `defaultLine`. A dark color contrasts better with `background`, so
 * `contrast` returns the more legible of the two whenever the caller supplies
 * no lighten or darken amount.
 *
 * @param {*} cstr - Color specifier
 * @return {Boolean}
 */
const isDark = (cstr) => wcagContrast(cstr, background) > wcagContrast(cstr, defaultLine);

// The two colors `contrast` falls back to, as rgb strings. This is needed because the
// attributes could be hex and callers expect `rgb(...)`.
const backgroundRgb = formatRgb(parse(background));
const defaultLineRgb = formatRgb(parse(defaultLine));

/**
 * Create a color that contrasts with `cstr`: dark colors are lightened,
 * light colors are darkened. Without `lightAmount` / `darkAmount` the
 * result goes all the way to the background or defaultLine.
 *
 * @param {*} cstr - Color specifier
 * @param {Number} [lightAmount] - Lighten percentage when cstr is dark
 * @param {Number} [darkAmount] - Darken percentage when cstr is light
 * @return {String} Resulting `rgb(...)` string
 */
const contrast = (cstr, lightAmount, darkAmount) => {
    if (parse(cstr).alpha !== 1) cstr = combine(cstr, background);

    if (isDark(cstr)) {
        return lightAmount ? adjustLightness(cstr, lightAmount) : backgroundRgb;
    } else {
        return darkAmount ? adjustLightness(cstr, -darkAmount) : defaultLineRgb;
    }
};

/**
 * Apply `stroke` and `stroke-opacity` styles to a D3 selection.
 *
 * @param {Selection} s - D3 selection
 * @param {*} cstr - Color specifier
 */
const stroke = (s, cstr) => {
    s.style({ stroke: rgb(cstr), 'stroke-opacity': parse(cstr).alpha });
};

/**
 * Apply `fill` and `fill-opacity` styles to a D3 selection.
 *
 * @param {Selection} s - D3 selection
 * @param {*} cstr - Color specifier
 */
const fill = (s, cstr) => {
    s.style({ fill: rgb(cstr), 'fill-opacity': parse(cstr).alpha });
};

/**
 * Test whether two color specifiers resolve to the same `rgb(...)` string.
 *
 * @param {*} cstr1 - Color specifier
 * @param {*} cstr2 - Color specifier
 * @return {Boolean}
 */
const equals = (cstr1, cstr2) => !!(cstr1 && cstr2 && rgb(cstr1) === rgb(cstr2));

/**
 * Test whether a string is a valid color specifier (does not throw).
 *
 * This is the only way to tell a color the module could not parse from one that
 * is genuinely black, since every other function resolves both the same way.
 *
 * @param {*} cstr - Color specifier
 * @return {Boolean} `false` for anything that is not a parseable color string
 */
const isValid = (cstr) => toColor(cstr) !== undefined;

/**
 * Brighten a color by adding a fixed amount to each RGB channel.
 * Unlike `adjustLightness`, this works in RGB space, not HSL. Alpha is preserved.
 *
 * @param {*} cstr - Color specifier
 * @param {Number} [amount=10] - Percent in [-100, 100]
 * @return {String} Resulting `rgb(...)` / `rgba(...)` string
 */
const brighten = (cstr, amount) => {
    amount = amount === 0 ? 0 : amount || 10;
    const c = parse(cstr);
    const adj = amount / 100;

    return formatRgb({
        ...c,
        r: clamp01(c.r + adj),
        g: clamp01(c.g + adj),
        b: clamp01(c.b + adj)
    });
};

/**
 * Mix two colors by `weight` percent (0 = all `cstr1`, 100 = all `cstr2`).
 *
 * @param {*} cstr1 - Color specifier
 * @param {*} cstr2 - Color specifier
 * @param {Number} weight - Percent in [0, 100]
 * @return {String} Resulting `rgb(...)` string
 */
const mix = (cstr1, cstr2, weight) => {
    const c1 = parse(cstr1);
    const c2 = parse(cstr2);
    const p = weight / 100;

    // Scale the channel weight by the alpha difference, the same way Sass does.
    // A mix toward a transparent color then shifts the alpha without dragging
    // the channels toward that color's meaningless rgb. Ported from libsass
    // (via Qix-/color).
    // https://sass-lang.com/documentation/modules/color/#mix
    // https://github.com/sass/libsass/blob/0e6b4a2850092356aa3ece07c6b249f0221caced/functions.cpp#L209
    const d = c2.alpha - c1.alpha;
    const w = 2 * p - 1;
    // `1 + w * d` is zero only at the endpoints, where one color is fully opaque
    // and the other fully transparent.
    const w2 = ((w * d === -1 ? w : (w + d) / (1 + w * d)) + 1) / 2;
    const w1 = 1 - w2;
    const blend = (x, y) => w1 * x + w2 * y;

    return formatRgb({
        mode: 'rgb',
        r: blend(c1.r, c2.r),
        g: blend(c1.g, c2.g),
        b: blend(c1.b, c2.b),
        alpha: c1.alpha * (1 - p) + c2.alpha * p
    });
};

/**
 * Pick the color from `colorList` with the highest contrast ratio against
 * `baseColor`. Defaults to choosing between black and white.
 *
 * @param {*} baseColor - Color specifier to contrast against
 * @param {Array} [colorList=['#000', '#fff']] - Candidate color specifiers
 * @return {String} Resulting `rgb(...)` string
 */
const mostReadable = (baseColor, colorList = ['#000', '#fff']) => {
    let bestColor;
    let bestContrast = -Infinity;

    for (const cstr of colorList) {
        const ratio = wcagContrast(baseColor, cstr);
        if (ratio > bestContrast) {
            bestContrast = ratio;
            bestColor = formatRgb(parse(cstr));
        }
    }

    return bestColor;
};

/**
 * Convert any color specifier to an `rgb(...)` or `rgba(...)` string,
 * preserving alpha. Use `rgb()` instead when alpha must be dropped.
 *
 * @param {*} cstr - Color specifier
 * @return {String}
 */
const rgbaString = (cstr) => formatRgb(parse(cstr));

/**
 * Convert any color specifier to an uppercase `#RRGGBB` string. Alpha is dropped.
 *
 * @param {*} cstr - Color specifier
 * @return {String}
 */
const hexString = (cstr) => formatHex(parse(cstr)).toUpperCase();

/**
 * Returns the given color specifier as an `[r, g, b, a]` array, with `r`/`g`/`b`
 * in [0, 255] and `a` in [0, 1]. Unrounded, since callers do further arithmetic.
 *
 * @param {*} cstr - Color specifier
 * @return {Number[]} `[r, g, b, a]`
 */
const rgbaArray = (cstr) => {
    const c = parse(cstr);
    return [clamp01(c.r) * 255, clamp01(c.g) * 255, clamp01(c.b) * 255, clamp01(c.alpha)];
};

/**
 * Build an `rgb()` / `rgba()` string from `[r, g, b, alpha]` channels, the inverse of
 * `rgbaArray`. `r`/`g`/`b` in [0, 255], `a` in [0, 1].
 *
 * @param {Number[]} arr - `[r, g, b, alpha]`
 * @return {String}
 */
const rgbaArrayToString = ([r, g, b, alpha]) => formatRgb({ mode: 'rgb', r: r / 255, g: g / 255, b: b / 255, alpha });

/**
 * WCAG relative luminance of a color, in [0, 1].
 *
 * @param {*} cstr - Color specifier
 * @return {Number}
 */
const luminosity = (cstr) => {
    const c = parse(cstr);
    return wcagLuminance({ mode: 'rgb', r: clamp01(c.r), g: clamp01(c.g), b: clamp01(c.b) });
};

module.exports = {
    addOpacity,
    adjustLightness,
    background,
    brighten,
    combine,
    contrast,
    defaultLine,
    defaults,
    equals,
    fill,
    hexString,
    interpolate,
    isChannelArray,
    isDark,
    isValid,
    lightLine,
    luminosity,
    mix,
    mostReadable,
    normalize,
    opacity,
    parse,
    rgb,
    rgbaArray,
    rgbaArrayToString,
    rgbaString,
    stroke,
    wcagContrast
};
