/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var tinycolor = require('tinycolor2');
var isNumeric = require('fast-isnumeric');
var colorAttrs = require('./attributes');

var defaults = colorAttrs.defaults;
var lightLine = colorAttrs.lightLine;
var defaultLine = colorAttrs.defaultLine;
var background = colorAttrs.background;

module.exports = {
    defaults: defaults,
    lightLine: lightLine,
    defaultLine: defaultLine,
    background: background,

    tinyRGB: tinyRGB,
    rgb: rgb,
    opacity: opacity,
    addOpacity: addOpacity,
    combine: combine,
    contrast: contrast,
    stroke: stroke,
    fill: fill,
    clean: clean
};

function cleanOne(val) {
    if(isNumeric(val) || typeof val !== 'string') return val;

    var valTrim = val.trim();
    if(valTrim.substr(0, 3) !== 'rgb') return val;

    var match = valTrim.match(/^rgba?\s*\(([^()]*)\)$/);
    if(!match) return val;

    var parts = match[1].trim().split(/\s*[\s,]\s*/);
    var hasAlpha = valTrim.charAt(3) === 'a' && parts.length === 4;
    if(!hasAlpha && parts.length !== 3) return val;

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

    var rgbStr = (
        Math.round(parts[0] * 255) + ', ' +
        Math.round(parts[1] * 255) + ', ' +
        Math.round(parts[2] * 255)
    );

    if(hasAlpha) return 'rgba(' + rgbStr + ', ' + parts[3] + ')';
    return 'rgb(' + rgbStr + ')';
}

/*
 * tinyRGB: turn a tinycolor into an rgb string, but
 * unlike the built-in tinycolor.toRgbString this never includes alpha
 */
function tinyRGB(tc) {
    var c = tc.toRgb();
    return 'rgb(' + Math.round(c.r) + ', ' +
        Math.round(c.g) + ', ' + Math.round(c.b) + ')';
}

function rgb(cstr) { return tinyRGB(tinycolor(cstr)); }

function opacity(cstr) { return cstr ? tinycolor(cstr).getAlpha() : 0; }

function addOpacity(cstr, op) {
    var c = tinycolor(cstr).toRgb();
    return 'rgba(' + Math.round(c.r) + ', ' +
        Math.round(c.g) + ', ' + Math.round(c.b) + ', ' + op + ')';
}

// combine two colors into one apparent color
// if back has transparency or is missing,
// background is assumed behind it
function combine(front, back) {
    var fc = tinycolor(front).toRgb();
    if(fc.a === 1) return tinycolor(front).toRgbString();

    var bc = tinycolor(back || background).toRgb();
    var bcflat = bc.a === 1 ? bc : {
        r: 255 * (1 - bc.a) + bc.r * bc.a,
        g: 255 * (1 - bc.a) + bc.g * bc.a,
        b: 255 * (1 - bc.a) + bc.b * bc.a
    };
    var fcflat = {
        r: bcflat.r * (1 - fc.a) + fc.r * fc.a,
        g: bcflat.g * (1 - fc.a) + fc.g * fc.a,
        b: bcflat.b * (1 - fc.a) + fc.b * fc.a
    };
    return tinycolor(fcflat).toRgbString();
}

/*
 * Create a color that contrasts with cstr.
 *
 * If cstr is a dark color, we lighten it; if it's light, we darken.
 *
 * If lightAmount / darkAmount are used, we adjust by these percentages,
 * otherwise we go all the way to white or black.
 */
function contrast(cstr, lightAmount, darkAmount) {
    var tc = tinycolor(cstr);

    if(tc.getAlpha() !== 1) tc = tinycolor(combine(cstr, background));

    var newColor = tc.isDark() ?
        (lightAmount ? tc.lighten(lightAmount) : background) :
        (darkAmount ? tc.darken(darkAmount) : defaultLine);

    return newColor.toString();
}

function stroke(s, c) {
    var tc = tinycolor(c);
    s.style({'stroke': tinyRGB(tc), 'stroke-opacity': tc.getAlpha()});
}

function fill(s, c) {
    var tc = tinycolor(c);
    s.style({
        'fill': tinyRGB(tc),
        'fill-opacity': tc.getAlpha()
    });
}

// search container for colors with the deprecated rgb(fractions) format
// and convert them to rgb(0-255 values)
function clean(container) {
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
        } else if(val && typeof val === 'object') clean(val);
    }
}
