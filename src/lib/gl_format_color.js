/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isNumeric = require('fast-isnumeric');
var tinycolor = require('tinycolor2');
var rgba = require('color-normalize');

var Colorscale = require('../components/colorscale');
var colorDflt = require('../components/color/attributes').defaultLine;
var isArrayOrTypedArray = require('./array').isArrayOrTypedArray;

function filterRGBA(colorIn, desiredType) {
    var colorOut = rgba(colorIn, desiredType);

    if(typeof colorIn === 'string' &&
        !colorIn.indexOf('rgb') &&
        colorIn.indexOf('rgba')
    ) {
        // drop alpha if not having rgb
        colorOut = [colorOut[0], colorOut[1], colorOut[2]];
    }
    return colorOut;
}

var colorDfltRgba = filterRGBA(colorDflt);
var opacityDflt = 1;

function calculateColor(colorIn, opacityIn) {
    var colorOut = colorIn;

    if(colorOut.length > 3) colorOut[3] *= opacityIn;
    else if(opacityIn < 1) colorOut[3] = opacityIn;

    return colorOut;
}

function validateColor(colorIn) {
    if(isNumeric(colorIn)) return colorDfltRgba;

    var colorOut = filterRGBA(colorIn);
    return colorOut.length ? colorOut : colorDfltRgba;
}

function validateOpacity(opacityIn) {
    return isNumeric(opacityIn) ? opacityIn : opacityDflt;
}

function formatColor(containerIn, opacityIn, len) {
    var colorIn = containerIn.color;
    var isArrayColorIn = isArrayOrTypedArray(colorIn);
    var isArrayOpacityIn = isArrayOrTypedArray(opacityIn);
    var colorOut = [];

    var sclFunc, getColor, getOpacity, colori, opacityi;

    if(containerIn.colorscale !== undefined) {
        sclFunc = Colorscale.makeColorScaleFuncFromTrace(containerIn);
    } else {
        sclFunc = validateColor;
    }

    if(isArrayColorIn) {
        getColor = function(c, i) {
            // FIXME: there is double work, considering that sclFunc does the opposite
            return c[i] === undefined ? colorDfltRgba : filterRGBA(sclFunc(c[i]));
        };
    } else getColor = validateColor;

    if(isArrayOpacityIn) {
        getOpacity = function(o, i) {
            return o[i] === undefined ? opacityDflt : validateOpacity(o[i]);
        };
    } else getOpacity = validateOpacity;

    if(isArrayColorIn || isArrayOpacityIn) {
        for(var i = 0; i < len; i++) {
            colori = getColor(colorIn, i);
            opacityi = getOpacity(opacityIn, i);
            colorOut[i] = calculateColor(colori, opacityi);
        }
    } else colorOut = calculateColor(filterRGBA(colorIn), opacityIn);

    return colorOut;
}

function parseColorScale(cont, alpha) {
    if(alpha === undefined) alpha = 1;

    var cOpts = Colorscale.extractOpts(cont);

    var colorscale = cOpts.reversescale ?
        Colorscale.flipScale(cOpts.colorscale) :
        cOpts.colorscale;

    return colorscale.map(function(elem) {
        var index = elem[0];
        var color = tinycolor(elem[1]);
        var rgb = color.toRgb();
        return {
            index: index,
            rgb: [rgb.r, rgb.g, rgb.b, alpha]
        };
    });
}

module.exports = {
    filterRGBA: filterRGBA,
    formatColor: formatColor,
    parseColorScale: parseColorScale
};
