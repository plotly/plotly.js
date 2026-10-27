'use strict';

var isNumeric = require('fast-isnumeric');

var Colorscale = require('../components/colorscale');
var Color = require('../components/color');
var colorDflt = require('../components/color/attributes').defaultLine;
var isArrayOrTypedArray = require('./array').isArrayOrTypedArray;

var colorDfltRgba = Color.normalize(colorDflt);
var opacityDflt = 1;

function calculateColor(colorIn, opacityIn) {
    // Return a new array to avoid mutating the original
    return [colorIn[0], colorIn[1], colorIn[2], colorIn[3] * opacityIn];
}

function validateColor(colorIn) {
    if (isNumeric(colorIn)) return colorDfltRgba;

    // A per-point color may be raw channels rather than a color string, which
    // `Color.isValid` rejects but `Color.normalize` handles.
    if (!Color.isChannelArray(colorIn) && !Color.isValid(colorIn)) return colorDfltRgba;

    return Color.normalize(colorIn);
}

function validateOpacity(opacityIn) {
    return isNumeric(opacityIn) ? opacityIn : opacityDflt;
}

function formatColor(containerIn, opacityIn, len) {
    var colorIn = containerIn.color;
    if(colorIn && colorIn._inputArray) colorIn = colorIn._inputArray;

    var isArrayColorIn = isArrayOrTypedArray(colorIn);
    var isArrayOpacityIn = isArrayOrTypedArray(opacityIn);
    var cOpts = Colorscale.extractOpts(containerIn);
    var colorOut = [];

    var sclFunc, getColor, getOpacity, colori, opacityi;

    if(cOpts.colorscale !== undefined) {
        sclFunc = Colorscale.makeColorScaleFuncFromTrace(containerIn);
    } else {
        sclFunc = validateColor;
    }

    if(isArrayColorIn) {
        getColor = (c, i) => {
            if (c[i] === undefined) return colorDfltRgba;
            // Only normalize sclFunc output when a colorscale exists (because it's a color string)
            return cOpts.colorscale === undefined ? sclFunc(c[i]) : Color.normalize(sclFunc(c[i]));
        };
    } else getColor = validateColor;

    if(isArrayOpacityIn) {
        getOpacity = function(o, i) {
            return o[i] === undefined ? opacityDflt : validateOpacity(o[i]);
        };
    } else getOpacity = validateOpacity;

    if (isArrayColorIn || isArrayOpacityIn) {
        for (var i = 0; i < len; i++) {
            colori = getColor(colorIn, i);
            opacityi = getOpacity(opacityIn, i);
            colorOut[i] = calculateColor(colori, opacityi);
        }
    } else colorOut = calculateColor(validateColor(colorIn), opacityIn);

    return colorOut;
}

function parseColorScale(cont) {
    var cOpts = Colorscale.extractOpts(cont);

    var colorscale = cOpts.colorscale;
    if(cOpts.reversescale) colorscale = Colorscale.flipScale(cOpts.colorscale);

    return colorscale.map(function(elem) {
        return {
            index: elem[0],
            rgb: Color.rgbaArray(elem[1])
        };
    });
}

module.exports = {
    formatColor,
    parseColorScale
};
