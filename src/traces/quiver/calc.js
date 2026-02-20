'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var isNumeric = require('fast-isnumeric');
var BADNUM = require('../../constants/numerical').BADNUM;
var colorscaleCalc = require('../../components/colorscale/calc');

/**
 * Main calculation function for quiver trace
 * Creates calcdata with arrow path data for each vector
 */
module.exports = function calc(gd, trace) {
    // Map x/y through axes so category/date values become numeric calcdata
    var xa = trace._xA = Axes.getFromId(gd, trace.xaxis || 'x', 'x');
    var ya = trace._yA = Axes.getFromId(gd, trace.yaxis || 'y', 'y');

    var xVals = xa.makeCalcdata(trace, 'x');
    var yVals = ya.makeCalcdata(trace, 'y');

    var len = Math.min(xVals.length, yVals.length);
    trace._length = len;
    var cd = new Array(len);

    var normMin = Infinity;
    var normMax = -Infinity;
    var cMin = Infinity;
    var cMax = -Infinity;
    var markerColor = (trace.marker || {}).color;
    var hasMarkerColorArray = Lib.isArrayOrTypedArray(markerColor);

    var uArr = trace.u || [];
    var vArr = trace.v || [];

    // First pass: build calcdata and compute maxNorm (needed for 'scaled' sizemode)
    for(var i = 0; i < len; i++) {
        var cdi = cd[i] = { i: i };
        var xValid = isNumeric(xVals[i]);
        var yValid = isNumeric(yVals[i]);

        if(xValid && yValid) {
            cdi.x = xVals[i];
            cdi.y = yVals[i];
        } else {
            cdi.x = BADNUM;
            cdi.y = BADNUM;
        }

        var ui = uArr[i] || 0;
        var vi = vArr[i] || 0;
        var norm = Math.sqrt(ui * ui + vi * vi);

        if(isFinite(norm)) {
            if(norm > normMax) normMax = norm;
            if(norm < normMin) normMin = norm;
        }

        if(hasMarkerColorArray) {
            var ci = markerColor[i];
            if(isNumeric(ci)) {
                if(ci < cMin) cMin = ci;
                if(ci > cMax) cMax = ci;
            }
        }
    }

    // Store maxNorm for use by plot.js
    trace._maxNorm = normMax;

    // Compute arrow endpoints for axis expansion.
    // We approximate with scaleRatio=1 (exact for square plots,
    // close enough for autorange padding in non-square plots).
    var sizemode = trace.sizemode || 'scaled';
    var sizeref = (trace.sizeref !== undefined) ? trace.sizeref : (sizemode === 'raw' ? 1 : 0.5);
    var anchor = trace.anchor || 'tail';

    var allX = new Array(len * 2);
    var allY = new Array(len * 2);

    for(var k = 0; k < len; k++) {
        var xk = xVals[k];
        var yk = yVals[k];
        var uk = uArr[k] || 0;
        var vk = vArr[k] || 0;
        var nk = Math.sqrt(uk * uk + vk * vk);

        var baseLen;
        if(sizemode === 'scaled') {
            baseLen = normMax ? (nk / normMax) * sizeref : 0;
        } else {
            baseLen = nk * sizeref;
        }

        var unitxk = nk ? (uk / nk) : 0;
        var unityk = nk ? (vk / nk) : 0;
        var dxk = unitxk * baseLen;
        var dyk = unityk * baseLen;

        if(anchor === 'tip') {
            allX[k * 2] = xk;
            allY[k * 2] = yk;
            allX[k * 2 + 1] = xk - dxk;
            allY[k * 2 + 1] = yk - dyk;
        } else if(anchor === 'cm' || anchor === 'center' || anchor === 'middle') {
            allX[k * 2] = xk - dxk / 2;
            allY[k * 2] = yk - dyk / 2;
            allX[k * 2 + 1] = xk + dxk / 2;
            allY[k * 2 + 1] = yk + dyk / 2;
        } else { // tail (default)
            allX[k * 2] = xk;
            allY[k * 2] = yk;
            allX[k * 2 + 1] = xk + dxk;
            allY[k * 2 + 1] = yk + dyk;
        }
    }

    // Expand axes to include both base positions and arrow tips
    xa._minDtick = 0;
    ya._minDtick = 0;

    trace._extremes[xa._id] = Axes.findExtremes(xa, allX, {padded: true});
    trace._extremes[ya._id] = Axes.findExtremes(ya, allY, {padded: true});

    // Merge text arrays into calcdata for Drawing.textPointStyle
    Lib.mergeArray(trace.text, cd, 'tx');
    Lib.mergeArray(trace.textposition, cd, 'tp');
    if(trace.textfont) {
        Lib.mergeArrayCastPositive(trace.textfont.size, cd, 'ts');
        Lib.mergeArray(trace.textfont.color, cd, 'tc');
        Lib.mergeArray(trace.textfont.family, cd, 'tf');
        Lib.mergeArray(trace.textfont.weight, cd, 'tw');
        Lib.mergeArray(trace.textfont.style, cd, 'ty');
        Lib.mergeArray(trace.textfont.variant, cd, 'tv');
    }

    // Colorscale cmin/cmax computation: prefer provided marker.color, else magnitude
    if(trace._hasColorscale) {
        var vals = hasMarkerColorArray ? [cMin, cMax] : [normMin, normMax];
        colorscaleCalc(gd, trace, {
            vals: vals,
            containerStr: 'marker',
            cLetter: 'c'
        });
    }

    return cd;
};
