'use strict';

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

// Clip a 0-1 channel to gamut. culori returns out-of-range values for wide-gamut
// inputs. Also maps undefined/NaN to 0 and Infinity to 1, matching the browser.
const clip01 = (v) => (v > 0 ? (v > 1 ? 1 : v) : 0);

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
 * Parse a color specifier, falling back to black with a warning
 *
 * @param {*} cstr - color specifier
 * @param {Boolean} [silent] - skip the warning, for callers that run per data point
 * @return {Object} culori rgb color
 */
const parseColor = (cstr, silent) => {
    const c = typeof cstr === 'string' ? toRgb(cstr.trim()) : undefined;
    if (!c) {
        if (!silent) warn(`Invalid color specifier: "${cstr}". Defaulting to "#000"`);
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
 * @param {*} cstr - color specifier
 * @return {String}
 */
const rgb = (cstr) => formatRgb({ ...parseColor(cstr), alpha: 1 });

/**
 * Return the alpha channel of a color (0 if falsy).
 *
 * @param {*} cstr - color specifier
 * @return {Number}
 */
const opacity = (cstr) => (cstr ? parseColor(cstr).alpha : 0);

// A per-point color in the WebGL paths can arrive as raw channels rather than as
// a color specifier, either as a plain array or as a typed array.
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
 * Falls back to opaque black rather than null: WebGL paths index the result.
 *
 * @param {*} input - color specifier
 * @param {'uint8'|'uint8_clamped'|'float32'|'float64'} [type] - omit for a plain
 *   array in [0, 1]. `'uint8'` and `'uint8_clamped'` return a `Uint8Array` in
 *   [0, 255]. `'float32'` and `'float64'` return a typed array in [0, 1].
 * @return {Number[]|Uint8Array}
 */
const normalize = (input, type) => {
    const c = isChannelArray(input) ? channelsToRgb(input) : parseColor(input, true);
    const v = [clip01(c.r), clip01(c.g), clip01(c.b), clip01(c.alpha)];
    if (type === 'uint8' || type === 'uint8_clamped') return Uint8Array.from(v, (x) => Math.round(x * 255));
    if (type === 'float32') return Float32Array.from(v);
    if (type === 'float64') return Float64Array.from(v);
    return v;
};

// TODO: rename to `setOpacity`, since it replaces the alpha rather than adding to it
/**
 * Replace a color's alpha channel with `op`.
 *
 * @param {*} cstr - color specifier
 * @param {Number} op - opacity in [0, 1], clipped to that range
 * @return {String} `rgb(...)` when the result is opaque, `rgba(...)` otherwise
 */
const addOpacity = (cstr, op) => formatRgb({ ...parseColor(cstr), alpha: clip01(op) });

/**
 * Combine two colors into one apparent color by compositing `front` over `back`.
 * If `back` is missing or transparent, the module `background` is assumed behind it.
 *
 * A translucent `back` is flattened against white, so a transparent
 * paper_bgcolor is treated as a white page. Opaque backs are exact.
 *
 * @param {*} front - foreground color specifier
 * @param {*} back - background color specifier
 * @return {String} resulting `rgb(...)` string
 */
const combine = (front, back) => {
    const fc = parseColor(front);
    const fa = fc.alpha;
    if (fa === 1) return formatRgb(fc);

    const bc = parseColor(back || background);
    const ba = bc.alpha;
    const over = (f, b) => (ba === 1 ? b : 1 - ba + b * ba) * (1 - fa) + f * fa;

    return formatRgb({ mode: 'rgb', r: over(fc.r, bc.r), g: over(fc.g, bc.g), b: over(fc.b, bc.b) });
};

/**
 * Linearly interpolate between two colors at a normalized position (0 to 1).
 * Ignores alpha; result is `factor * first + (1 - factor) * second`.
 *
 * @param {*} first - color specifier
 * @param {*} second - color specifier
 * @param {Number} factor - interpolation position in [0, 1]
 * @return {String} resulting `rgb(...)` string
 */
const interpolate = (first, second, factor) => {
    const fc = parseColor(first);
    const sc = parseColor(second);
    const lerp = (a, b) => factor * a + (1 - factor) * b;

    return formatRgb({ mode: 'rgb', r: lerp(fc.r, sc.r), g: lerp(fc.g, sc.g), b: lerp(fc.b, sc.b) });
};

/**
 * Shift a color's HSL lightness additively by `delta` percentage points.
 * Positive delta = lighter, negative = darker. Alpha is preserved.
 *
 * @param {*} cstr - color specifier
 * @param {Number} delta - lightness shift in HSL percentage points
 * @return {String} resulting color string
 */
const adjustLightness = (cstr, delta) => {
    const c = parseColor(cstr);
    const h = toHsl(c) || { mode: 'hsl', h: 0, s: 0, l: 0 };
    return formatRgb(toRgb({ ...h, l: clip01((h.l * 100 + delta) / 100), alpha: c.alpha }));
};

/**
 * WCAG contrast ratio between two colors, in [1, 21].
 *
 * @param {*} cstr1 - color specifier
 * @param {*} cstr2 - color specifier
 * @return {Number}
 */
const wcagContrast = (cstr1, cstr2) => culoriWcagContrast(parseColor(cstr1), parseColor(cstr2));

/**
 * Test whether a color reads as dark.
 *
 * Compares the contrast ratio against `background` with the contrast ratio
 * against `defaultLine`. A dark color contrasts better with `background`, so
 * `contrast` returns the more legible of the two whenever the caller supplies
 * no lighten or darken amount.
 *
 * @param {*} cstr - color specifier
 * @return {Boolean}
 */
const isDark = (cstr) => wcagContrast(cstr, background) > wcagContrast(cstr, defaultLine);

/**
 * Create a color that contrasts with `cstr`: dark colors are lightened,
 * light colors are darkened. Without `lightAmount` / `darkAmount` the
 * result goes all the way to the background or defaultLine.
 *
 * @param {*} cstr - color specifier
 * @param {Number} [lightAmount] - lighten percentage when cstr is dark
 * @param {Number} [darkAmount] - darken percentage when cstr is light
 * @return {String} resulting `rgb(...)` string
 */
const contrast = (cstr, lightAmount, darkAmount) => {
    if (opacity(cstr) !== 1) cstr = combine(cstr, background);

    const newColor = isDark(cstr)
        ? lightAmount
            ? adjustLightness(cstr, lightAmount)
            : background
        : darkAmount
          ? adjustLightness(cstr, -darkAmount)
          : defaultLine;

    return formatRgb(parseColor(newColor));
};

/**
 * Apply `stroke` and `stroke-opacity` styles to a D3 selection.
 *
 * A missing color paints opaque black. Shapes and annotations leave
 * `line.color` unset when the user gives none, and the outline still has to
 * show. Use `opacity` instead when a missing color means "nothing to paint".
 *
 * @param {Selection} s - D3 selection
 * @param {*} cstr - color specifier
 */
const stroke = (s, cstr) => {
    const c = cstr == null ? BLACK : parseColor(cstr);
    s.style({ stroke: formatRgb({ ...c, alpha: 1 }), 'stroke-opacity': c.alpha });
};

/**
 * Apply `fill` and `fill-opacity` styles to a D3 selection.
 *
 * A missing color paints opaque black, the same as `stroke`.
 *
 * @param {Selection} s - D3 selection
 * @param {*} cstr - color specifier
 */
const fill = (s, cstr) => {
    const c = cstr == null ? BLACK : parseColor(cstr);
    s.style({ fill: formatRgb({ ...c, alpha: 1 }), 'fill-opacity': c.alpha });
};

/**
 * Test whether two color specifiers resolve to the same `rgb(...)` string.
 *
 * @param {*} cstr1 - color specifier
 * @param {*} cstr2 - color specifier
 * @return {Boolean}
 */
const equals = (cstr1, cstr2) => !!(cstr1 && cstr2 && rgb(cstr1) === rgb(cstr2));

/**
 * Test whether a string is a valid color specifier (does not throw).
 *
 * @param {*} cstr
 * @return {Boolean}
 */
const isValid = (cstr) => typeof cstr === 'string' && toRgb(cstr.trim()) !== undefined;

/**
 * Brighten a color by adding a fixed amount to each RGB channel.
 * Unlike `adjustLightness`, this works in RGB space, not HSL. Alpha is preserved.
 *
 * @param {*} cstr - color specifier
 * @param {Number} [amount=10] - percent in [-100, 100]
 * @return {String} resulting `rgb(...)` / `rgba(...)` string
 */
const brighten = (cstr, amount) => {
    amount = amount === 0 ? 0 : amount || 10;
    const c = parseColor(cstr);
    const adj = amount / 100;

    return formatRgb({
        ...c,
        r: clip01(c.r + adj),
        g: clip01(c.g + adj),
        b: clip01(c.b + adj)
    });
};

/**
 * Mix two colors by `weight` percent (0 = all `cstr1`, 100 = all `cstr2`).
 *
 * @param {*} cstr1 - color specifier
 * @param {*} cstr2 - color specifier
 * @param {Number} weight - percent in [0, 100]
 * @return {String} resulting `rgb(...)` string
 */
const mix = (cstr1, cstr2, weight) => {
    const c1 = parseColor(cstr1);
    const c2 = parseColor(cstr2);
    const p = weight / 100;

    // Scale the channel weight by the alpha difference, the same way Sass does.
    // A mix toward a transparent color then shifts the alpha without dragging
    // the channels toward that color's meaningless rgb.
    const d = c2.alpha - c1.alpha;
    const w = 2 * p - 1;
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
 * @param {*} baseColor - color specifier to contrast against
 * @param {Array} [colorList=['#000', '#fff']] - candidate color specifiers
 * @return {String} resulting `rgb(...)` string
 */
const mostReadable = (baseColor, colorList = ['#000', '#fff']) => {
    let bestColor;
    let bestContrast = -Infinity;

    for (const cstr of colorList) {
        const ratio = wcagContrast(baseColor, cstr);
        if (ratio > bestContrast) {
            bestContrast = ratio;
            bestColor = formatRgb(parseColor(cstr));
        }
    }

    return bestColor;
};

/**
 * Convert any color specifier to an `rgb(...)` or `rgba(...)` string,
 * preserving alpha. Use `rgb()` instead when alpha must be dropped.
 *
 * @param {*} cstr - color specifier
 * @return {String}
 */
const rgbaString = (cstr) => formatRgb(parseColor(cstr));

/**
 * Convert any color specifier to an uppercase `#RRGGBB` string. Alpha is dropped.
 *
 * @param {*} cstr - color specifier
 * @return {String}
 */
const hexString = (cstr) => formatHex(parseColor(cstr)).toUpperCase();

/**
 * Channels as `[r, g, b, a]`, with `r`/`g`/`b` in [0, 255] and `a` in [0, 1].
 * An array rather than an object so callers cannot depend on the color library's
 * shape. Unrounded, since callers do further arithmetic.
 *
 * @param {*} cstr - color specifier
 * @return {Number[]} `[r, g, b, a]`
 */
const rgbaArray = (cstr) => {
    const c = parseColor(cstr);
    return [clip01(c.r) * 255, clip01(c.g) * 255, clip01(c.b) * 255, clip01(c.alpha)];
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
 * @param {*} cstr - color specifier
 * @return {Number}
 */
const luminosity = (cstr) => {
    const c = parseColor(cstr);
    return wcagLuminance({ mode: 'rgb', r: clip01(c.r), g: clip01(c.g), b: clip01(c.b) });
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
    isDark,
    isValid,
    lightLine,
    luminosity,
    mix,
    mostReadable,
    normalize,
    opacity,
    rgb,
    rgbaArray,
    rgbaArrayToString,
    rgbaString,
    stroke,
    wcagContrast
};
