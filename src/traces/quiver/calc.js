'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var isNumeric = require('fast-isnumeric');
var BADNUM = require('../../constants/numerical').BADNUM;
var colorscaleCalc = require('../../components/colorscale/calc');
var calcSelection = require('../scatter/calc_selection');

/**
 * Main calculation function for quiver trace
 * Creates calcdata with arrow path data for each vector
 */
module.exports = function calc(gd, trace) {
    // Map x/y through axes so category/date values become numeric calcdata
    const xa = trace._xA = Axes.getFromId(gd, trace.xaxis || 'x', 'x');
    const ya = trace._yA = Axes.getFromId(gd, trace.yaxis || 'y', 'y');

    const xVals = xa.makeCalcdata(trace, 'x');
    const yVals = ya.makeCalcdata(trace, 'y');

    const len = Math.min(xVals.length, yVals.length);
    trace._length = len;
    const cd = new Array(len);

    var normMin = Infinity;
    var normMax = -Infinity;
    var cMin = Infinity;
    var cMax = -Infinity;
    const markerColor = trace.marker.color;
    const hasMarkerColorArray = Lib.isArrayOrTypedArray(markerColor);

    const uArr = trace.u || [];
    const vArr = trace.v || [];

    const anglemode = trace.anglemode;
    const sizemode = trace.sizemode;
    const anchor = trace.anchor;
    const isTip = anchor === 'tip';
    const isCenter = anchor === 'center';

    // Keep track of:
    // - minimum and maximum x and y (for density calculation)
    // - number of valid (x, y) pairs (for density calculation)
    // - minimum and maximum u and v (for setting axis ranges)
    var xMin = Infinity;
    var xMax = -Infinity;
    var yMin = Infinity;
    var yMax = -Infinity;
    var uMin = Infinity;
    var uMax = -Infinity;
    var vMin = Infinity;
    var vMax = -Infinity;
    var nValid = 0;

    // First pass: build calcdata, and keep track of the maximum and minimum vector norm in the trace,
    // to be used for sizemode 'scaled' (max norm only) and for magnitude-based colorscale range
    for(var i = 0; i < len; i++) {
        var cdi = cd[i] = { i: i };
        var xValid = isNumeric(xVals[i]);
        var yValid = isNumeric(yVals[i]);

        // Sanitize u/v: If either u or v is non-numeric (bad strings, Infinity,
        // NaN, null, undefined) for a single point, set both to zero.
        // Cast numeric strings to numbers.
        // Store in calcdata so that the sanitized values can be reused.
        // Use underscore-prefixed keys because 'v' is already used by box/violin
        // (meaning "value") and setting it here has unintended side effects.
        var ui, vi;
        if(isNumeric(uArr[i]) && isNumeric(vArr[i])) {
            ui = cdi._u = +uArr[i];
            vi = cdi._v = +vArr[i];
        } else {
            ui = cdi._u = 0;
            vi = cdi._v = 0;
        }

        if(xValid && yValid) {
            nValid++;
            cdi.x = xVals[i];
            cdi.y = yVals[i];

            if (xVals[i] < xMin) xMin = xVals[i];
            if (xVals[i] > xMax) xMax = xVals[i];
            if (yVals[i] < yMin) yMin = yVals[i];
            if (yVals[i] > yMax) yMax = yVals[i];
            if (ui < uMin) uMin = ui;
            if (ui > uMax) uMax = ui;
            if (vi < vMin) vMin = vi;
            if (vi > vMax) vMax = vi;

            var norm = Math.sqrt(ui * ui + vi * vi);
            if(norm > normMax) normMax = norm;
            if(norm < normMin) normMin = norm;

            if(hasMarkerColorArray) {
                var ci = markerColor[i];
                if(isNumeric(ci)) {
                    if(ci < cMin) cMin = ci;
                    if(ci > cMax) cMax = ci;
                }
            }
        } else {
            cdi.x = BADNUM;
            cdi.y = BADNUM;
        }
    }

    // Store maxNorm for use by plot step
    trace._maxNorm = normMax;

    if (sizemode === 'scaled' || anglemode === 'paper') {
        // Ignore sizemode 'raw' if anglemode is set to 'paper': always scale

        // Compute point density of the entire trace: Area of bounding box
        // divided by number of points. This is used to scale arrows in
        // 'scaled' sizemode.
        // TODO: How to handle the case where there is just one point in a trace,
        // or all points have the same x or y value? This will give a boxArea of 0.
        // For now I'm going to just normalize to a vector of unit length (1) in that case,
        // but that's not a great solution
        const boxArea = (xMax - xMin) * (yMax - yMin);
        const pointDensity = boxArea / len;
        // Now, compute the scale factor for scaled size mode
        // The scale factor should be such that
        // _maxNorm * _scaleFactor = Math.sqrt(_pointDensity)
        // Therefore: _scaleFactor = Math.sqrt(_pointDensity) / _maxNorm
        if (pointDensity === 0) {
            trace._scaleFactor = 1 / trace._maxNorm
        } else {
            trace._scaleFactor = Math.sqrt(pointDensity) / trace._maxNorm;
        }
        // Note: If anglemode === 'paper', this scale factor must be
        // multiplied by Math.sqrt(xa._m * ya._m), but we can't do that quite yet
        // since the axis scales are not fully determined. Do it in plot step instead.
    } else {  // sizemode === 'raw'
        // For raw sizemode, scale factor is always 1
        trace._scaleFactor = 1;
    }

    // Multiply scale factor by sizeref
    trace._scaleFactor *= trace.sizeref;

    // Now we need to compute the arrow geometry for axis autorange
    const xTipPositions = new Array(len);
    const yTipPositions = new Array(len);
    const xTailPositions = new Array(len);
    const yTailPositions = new Array(len);
    var arrowLenX, arrowLenY;
    // Compute the x- and y-positions of the tip of each arrow,
    // assuming anglemode === 'data' (i.e. u/v are in data coordinates)
    for(var i = 0; i < len; i++) {
        var cdi = cd[i];
        arrowLenX = cdi._u * trace._scaleFactor;
        arrowLenY = cdi._v * trace._scaleFactor;
        if (isTip) {
            xTipPositions[i] = cdi.x;
            yTipPositions[i] = cdi.y;
            xTailPositions[i] = cdi.x - arrowLenX;
            yTailPositions[i] = cdi.y - arrowLenY;
        } else if (isCenter) {
            xTipPositions[i] = cdi.x + arrowLenX / 2;
            yTipPositions[i] = cdi.y + arrowLenY / 2;
            xTailPositions[i] = cdi.x - arrowLenX / 2;
            yTailPositions[i] = cdi.y - arrowLenY / 2;
        } else {  // tail
            xTipPositions[i] = cdi.x + arrowLenX;
            yTipPositions[i] = cdi.y + arrowLenY;
            xTailPositions[i] = cdi.x;
            yTailPositions[i] = cdi.y;
        }
    }

    if (anglemode === 'data') {
        // If anglemode is 'data', we can use the arrow tip positions directly to expand the axes ranges
        trace._extremes[xa._id] = Axes.findExtremes(xa, xTipPositions.concat(xTailPositions), {padded: true});
        trace._extremes[ya._id] = Axes.findExtremes(ya, yTipPositions.concat(yTailPositions), {padded: true});
    } else {  // anglemode === 'paper'
        // TODO: For now, just do the same thing as for anglemode === 'data', but this is not correct. 
        // We actually need more sophisticated logic here, since this will give a bad result
        // if the data aspect ratio is very different from the plot aspect ratio.
        trace._extremes[xa._id] = Axes.findExtremes(xa, xTipPositions.concat(xTailPositions), {padded: true});
        trace._extremes[ya._id] = Axes.findExtremes(ya, yTipPositions.concat(yTailPositions), {padded: true});
    }

    xa._minDtick = 0;
    ya._minDtick = 0;

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
        // Guard against all-invalid input (no finite values found), which would
        // otherwise leave the seeds at +/-Infinity and feed them into the
        // colorscale calc. Fall back to a neutral [0, 1] range.
        if(!isFinite(vals[0]) || !isFinite(vals[1])) vals = [0, 1];
        colorscaleCalc(gd, trace, {
            vals: vals,
            containerStr: 'marker',
            cLetter: 'c'
        });
    }

    calcSelection(cd, trace);

    return cd;
};
