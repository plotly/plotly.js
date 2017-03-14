/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var isNumeric = require('fast-isnumeric');
var rgba = require('color-rgba');

var Colorscale = require('../components/colorscale');
var colorDflt = require('../components/color/attributes').defaultLine;

var colorDfltRgba = rgba(colorDflt);
var opacityDflt = 1;

function calculateColor(colorIn, opacityIn) {
    var colorOut = colorIn;
    colorOut[3] *= opacityIn;
    return colorOut;
}

function validateColor(colorIn) {
    if(isNumeric(colorIn)) return colorDfltRgba;

    var colorOut = rgba(colorIn);

    return colorOut.length ? colorOut : colorDfltRgba;
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
        sclFunc = Colorscale.makeColorScaleFunc(
            Colorscale.extractScale(
                containerIn.colorscale,
                containerIn.cmin,
                containerIn.cmax
            )
        );
    }
    else {
        sclFunc = validateColor;
    }

    if(isArrayColorIn) {
        getColor = function(c, i) {
            return c[i] === undefined ? colorDfltRgba : rgba(sclFunc(c[i]));
        };
    }
    else getColor = validateColor;

    if(isArrayOpacityIn) {
        getOpacity = function(o, i) {
            return o[i] === undefined ? opacityDflt : validateOpacity(o[i]);
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
    else colorOut = calculateColor(rgba(colorIn), opacityIn);

    return colorOut;
}

module.exports = formatColor;
