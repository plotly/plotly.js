'use strict'

const _color = require('color').default;
const { warn } = require('../../lib/loggers');
const { background, defaultLine, defaults, lightLine } = require('./attributes');

/**
 * Safe wrapper around the `color` library: trims string input and falls back
 * to black (with a warning) instead of throwing on invalid input.
 *
 * @param {*} cstr - color specifier
 * @return {Color} color object
 */
const color = (cstr) => {
    if (typeof cstr === 'string') cstr = cstr.trim();
    try {
        return _color(cstr);
    } catch (e) {
        warn(`Invalid color specifier: "${cstr}". Defaulting to "#000"`);
        return _color('#000');
    }
};

/**
 * Convert any color specifier to a normalized `rgb(r, g, b)` string.
 *
 * @param {*} cstr - color specifier
 * @return {String}
 */
const rgb = (cstr) => {
    const { r, g, b } = color(cstr).rgb().object();
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
};

/**
 * Return the alpha channel of a color (0 if falsy).
 *
 * @param {*} cstr - color specifier
 * @return {Number}
 */
const opacity = (cstr) => (cstr ? color(cstr).alpha() : 0);

/**
 * Build an `rgba(...)` string from a color and an explicit opacity value.
 *
 * @param {*} cstr - color specifier
 * @param {Number} op - opacity in [0, 1]
 * @return {String}
 */
const addOpacity = (cstr, op) => {
    const c = color(cstr).rgb().object();
    return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${op})`;
};

/**
 * Combine two colors into one apparent color by compositing `front` over `back`.
 * If `back` is missing or transparent, the module `background` is assumed behind it.
 *
 * @param {*} front - foreground color specifier
 * @param {*} back - background color specifier
 * @return {String} resulting `rgb(...)` string
 */
const combine = (front, back) => {
    back ||= background;
    const fc = color(front).rgb().object();
    fc.alpha ??= 1;
    if (fc.alpha === 1) return color(front).rgb().string();

    const bc = color(back).rgb().object();
    bc.alpha ??= 1;
    const bcflat =
        bc.alpha === 1
            ? bc
            : {
                  r: 255 * (1 - bc.alpha) + bc.r * bc.alpha,
                  g: 255 * (1 - bc.alpha) + bc.g * bc.alpha,
                  b: 255 * (1 - bc.alpha) + bc.b * bc.alpha
              };

    const fcflat = {
        r: bcflat.r * (1 - fc.alpha) + fc.r * fc.alpha,
        g: bcflat.g * (1 - fc.alpha) + fc.g * fc.alpha,
        b: bcflat.b * (1 - fc.alpha) + fc.b * fc.alpha
    };

    return color(fcflat).rgb().string();
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
    const fc = color(first).rgb().object();
    const sc = color(second).rgb().object();

    const ic = {
        r: factor * fc.r + (1 - factor) * sc.r,
        g: factor * fc.g + (1 - factor) * sc.g,
        b: factor * fc.b + (1 - factor) * sc.b
    };

    return color(ic).rgb().string();
};

/**
 * Shift a color's HSL lightness additively by `delta` percentage points.
 * Positive delta = lighter, negative = darker. Use this instead of the
 * underlying library's `lighten`/`darken`, which scale L multiplicatively.
 *
 * @param {*} cstr - color specifier
 * @param {Number} delta - lightness shift in HSL percentage points
 * @return {Color} adjusted color object
 */
const adjustLightness = (cstr, delta) => {
    const c = color(cstr);
    return c.lightness(c.lightness() + delta);
};

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
    let c = color(cstr);

    if (c.alpha() !== 1) c = color(combine(cstr, background));
    const newColor = c.isDark()
        ? (lightAmount ? adjustLightness(c, lightAmount) : color(background))
        : (darkAmount ? adjustLightness(c, -darkAmount) : color(defaultLine));

    return newColor.rgb().string();
};

/**
 * Apply `stroke` and `stroke-opacity` styles to a D3 selection.
 *
 * @param {Selection} s - D3 selection
 * @param {*} cstr - color specifier
 */
const stroke = (s, cstr) => {
    const c = color(cstr);
    s.style({ stroke: rgb(cstr), 'stroke-opacity': c.alpha() });
};

/**
 * Apply `fill` and `fill-opacity` styles to a D3 selection.
 *
 * @param {Selection} s - D3 selection
 * @param {*} cstr - color specifier
 */
const fill = (s, cstr) => {
    const c = color(cstr);
    s.style({ fill: rgb(cstr), 'fill-opacity': c.alpha() });
};

/**
 * Test whether two color specifiers resolve to the same `rgb(...)` string.
 *
 * @param {*} cstr1 - color specifier
 * @param {*} cstr2 - color specifier
 * @return {Boolean}
 */
const equals = (cstr1, cstr2) => !!(cstr1 && cstr2 && color(cstr1).rgb().string() === color(cstr2).rgb().string());

/**
 * Test whether a string is a valid color specifier (does not throw).
 *
 * @param {*} cstr
 * @return {Boolean}
 */
const isValid = (cstr) => {
    if (typeof cstr !== 'string') return false;
    try {
        return !!_color(cstr.trim());
    } catch {
        return false;
    }
};

/**
 * Brighten a color by adding a fixed amount to each RGB channel.
 * Unlike `lighten`, this works in RGB space, not HSL. Alpha is preserved.
 *
 * @param {*} cstr - color specifier
 * @param {Number} [amount=10] - percent in [-100, 100]
 * @return {String} resulting `rgb(...)` / `rgba(...)` string
 */
const brighten = (cstr, amount) => {
    amount = amount === 0 ? 0 : amount || 10;
    const c = color(cstr).rgb().object();
    const adj = Math.round(255 * (amount / 100));
    return color({
        r: Math.max(0, Math.min(255, c.r + adj)),
        g: Math.max(0, Math.min(255, c.g + adj)),
        b: Math.max(0, Math.min(255, c.b + adj))
    })
        .alpha(c.alpha ?? 1)
        .rgb()
        .string();
};

/**
 * Mix two colors by `weight` percent (0 = all `cstr1`, 100 = all `cstr2`).
 *
 * @param {*} cstr1 - color specifier
 * @param {*} cstr2 - color specifier
 * @param {Number} weight - percent in [0, 100]
 * @return {String} resulting `rgb(...)` string
 */
const mix = (cstr1, cstr2, weight) =>
    color(cstr1)
        .mix(color(cstr2), weight / 100)
        .rgb()
        .string();

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
        const contrastRatio = color(baseColor).contrast(color(cstr));
        if (contrastRatio > bestContrast) {
            bestContrast = contrastRatio;
            bestColor = color(cstr).rgb().string();
        }
    }

    return bestColor;
};

module.exports = {
    addOpacity,
    adjustLightness,
    background,
    brighten,
    color,
    combine,
    contrast,
    defaultLine,
    defaults,
    equals,
    fill,
    interpolate,
    isValid,
    lightLine,
    mix,
    mostReadable,
    opacity,
    rgb,
    stroke
};
