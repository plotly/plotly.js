'use strict';

var tinycolor = require('tinycolor2'),
    isNumeric = require('../../isnumeric'),
    str2RgbaArray = require('./str2rgbarray'),
    Plotly = require('../../plotly');

var colorDflt = Plotly.Color.defaultLine,
    opacityDflt = 1;

function calculateColor(colorIn, opacityIn) {
    var colorOut = str2RgbaArray(colorIn);
    colorOut[3] *= opacityIn;
    return colorOut;
}

function validateColor(colorIn) {
    return tinycolor(colorIn).isValid() ? colorIn : colorDflt;
}

function validateOpacity(opacityIn) {
    return isNumeric(opacityIn) ? opacityIn : opacityDflt;
}

function formatColor(containerIn, opacityIn, len) {
    var colorIn = containerIn.color,
        isArrayColorIn = Array.isArray(colorIn),
        isArrayOpacityIn = Array.isArray(opacityIn),
        colorOut = [];

    var sclFunc, getColor, getOpacity, colori, opacityi;

    if(containerIn.colorscale !== undefined) {
        sclFunc = Plotly.Colorscale.makeScaleFunction(
            containerIn.colorscale, containerIn.cmin, containerIn.cmax
        );
    }
    else sclFunc = validateColor;

    if(isArrayColorIn) {
        getColor = function(c, i) {
            return c[i]===undefined ? colorDflt : sclFunc(c[i]);
        };
    }
    else getColor = validateColor;

    if(isArrayOpacityIn) {
        getOpacity = function(o, i) {
            return o[i]===undefined ? opacityDflt : validateOpacity(o[i]);
        };
    }
    else getOpacity = validateOpacity;

    if(isArrayColorIn || isArrayOpacityIn) {
        for(var i = 0; i < len; i++) {
            colori = getColor(colorIn, i);
            opacityi = getOpacity(opacityIn, i);
            colorOut[i] = calculateColor(colori, opacityi);
        }
    }
    else colorOut = calculateColor(colorIn, opacityIn);

    return colorOut;
}

module.exports = formatColor;
