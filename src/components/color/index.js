'use strict';

const isNumeric = require('fast-isnumeric');
const isTypedArray = require('../../lib/array').isTypedArray;
const color = require('color').default

const { background, defaultLine, defaults, lightLine } = require('./attributes');

const rgb = cstr => {
    const { r, g, b } = color(cstr).rgb().object();
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

const opacity = cstr => cstr ? color(cstr).alpha() : 0;

const addOpacity = (cstr, op) => {
    const c = color(cstr).rgb().object();
    return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${op})`;
};

// combine two colors into one apparent color
// if back has transparency or is missing,
// background is assumed behind it
const combine = (front, back = background) => {
    const fc = color(front).rgb().object();
    fc.alpha ||= 1;
    if(fc.alpha === 1) return color(front).rgb().string();

    const bc = color(back).rgb().object();
    bc.alpha ||= 1;
    const bcflat = bc.alpha === 1
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

    return color(fcflat).string();
};

/*
 * Linearly interpolate between two colors at a normalized interpolation position (0 to 1).
 *
 * Ignores alpha channel values.
 * The resulting color is computed as: factor * first + (1 - factor) * second.
 */
const interpolate = (first, second, factor) => {
    const fc = color(first).rgb().object();
    const sc = color(second).rgb().object();

    const ic = {
        r: factor * fc.r + (1 - factor) * sc.r,
        g: factor * fc.g + (1 - factor) * sc.g,
        b: factor * fc.b + (1 - factor) * sc.b,
    };

    return color(ic).rgb().string();
};

/*
 * Create a color that contrasts with cstr.
 *
 * If cstr is a dark color, we lighten it; if it's light, we darken.
 *
 * If lightAmount / darkAmount are used, we adjust by these percentages,
 * otherwise we go all the way to white or black.
 */
const contrast = (cstr, lightAmount, darkAmount) => {
    let c = color(cstr)

    if(c.alpha() !== 1) c = color(combine(cstr, background));

    // TODO: Should the API change such that lightAmount/darkAmount are passed in as decimal instead of percent number?
    const newColor = color(
        c.isDark()
            ? (lightAmount ? c.lighten(lightAmount / 100) : background)
            : (darkAmount ? c.darken(darkAmount / 100) : defaultLine)
    );

    return newColor.rgb().string();
};

const stroke = (s, cstr) => s.style({ stroke: rgb(cstr), 'stroke-opacity': opacity(cstr) });

const fill = (s, cstr) => s.style({ fill: rgb(cstr), 'fill-opacity': opacity(cstr) });

// search container for colors with the deprecated rgb(fractions) format
// and convert them to rgb(0-255 values)
const clean = container => {
    if(!container || typeof container !== 'object') return;

    var keys = Object.keys(container);
    var i, j, key, val;

    for(i = 0; i < keys.length; i++) {
        key = keys[i];
        val = container[key];

        if(key.substr(key.length - 5) === 'color') {
            // only sanitize keys that end in "color" or "colorscale"

            if(Array.isArray(val)) {
                for(j = 0; j < val.length; j++) val[j] = cleanOne(val[j]);
            } else container[key] = cleanOne(val);
        } else if(key.substr(key.length - 10) === 'colorscale' && Array.isArray(val)) {
            // colorscales have the format [[0, color1], [frac, color2], ... [1, colorN]]

            for(j = 0; j < val.length; j++) {
                if(Array.isArray(val[j])) val[j][1] = cleanOne(val[j][1]);
            }
        } else if(Array.isArray(val)) {
            // recurse into arrays of objects, and plain objects

            var el0 = val[0];
            if(!Array.isArray(el0) && el0 && typeof el0 === 'object') {
                for(j = 0; j < val.length; j++) clean(val[j]);
            }
        } else if(val && typeof val === 'object' && !isTypedArray(val)) clean(val);
    }
};

const cleanOne = val => {
    if(isNumeric(val) || typeof val !== 'string') return val;

    var valTrim = val.trim();
    if(valTrim.substr(0, 3) !== 'rgb') return val;

    var match = valTrim.match(/^rgba?\s*\(([^()]*)\)$/);
    if(!match) return val;

    var parts = match[1].trim().split(/\s*[\s,]\s*/);
    var rgba = valTrim.charAt(3) === 'a' && parts.length === 4;
    if(!rgba && parts.length !== 3) return val;

    for(var i = 0; i < parts.length; i++) {
        if(!parts[i].length) return val;
        parts[i] = Number(parts[i]);

        if(!(parts[i] >= 0)) {
            // all parts must be non-negative numbers

            return val;
        }

        if(i === 3) {
            // alpha>1 gets clipped to 1

            if(parts[i] > 1) parts[i] = 1;
        } else if(parts[i] >= 1) {
            // r, g, b must be < 1 (ie 1 itself is not allowed)

            return val;
        }
    }

    var rgbStr = Math.round(parts[0] * 255) + ', ' +
        Math.round(parts[1] * 255) + ', ' +
        Math.round(parts[2] * 255);

    if(rgba) return 'rgba(' + rgbStr + ', ' + parts[3] + ')';
    return 'rgb(' + rgbStr + ')';
}

const equals = (cstr1, cstr2) => cstr1 && cstr2 && color(cstr1).rgb().string() === color(cstr2).rgb().string();

const isValid = cstr => {
    try { return cstr && !!color(cstr); }
    catch { return false; }
}

const mix = (cstr1, cstr2, weight) => color(cstr1).mix(color(cstr2), weight / 100).rgb().string();

const mostReadable = (baseColor, colorList = []) => {
    let bestColor;
    let bestContrast = -Infinity;

    for (const cstr of colorList) {
        const contrast = color(baseColor).contrast(color(cstr));
        if (contrast > bestContrast) {
            bestContrast = contrast;
            bestColor = color(cstr).rgb().string();
        }
    }
    
    // Fall back to black/white if provided colors don't have proper contrast level
    return bestColor && color(baseColor).level(color(bestColor))
        ? bestColor
        : mostReadable(baseColor, ["#000", "#fff"]);
};

module.exports = {
    addOpacity,
    background,
    clean,
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
}
