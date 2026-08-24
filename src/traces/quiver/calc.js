'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');
var isNumeric = require('fast-isnumeric');
var BADNUM = require('../../constants/numerical').BADNUM;
var colorscaleCalc = require('../../components/colorscale/calc');
var calcSelection = require('../scatter/calc_selection');

// For scaled lengthmode: Constant to multiply by the computed distance between
// neighboring points, such that the arrows are _just slightly shorter_ than
// that distance
const SHRINK_FACTOR = 0.97;
// const SHRINK_FACTOR = 1;

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

    const { anchor, lengthmode, arrowref } = trace;
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
    // to be used for lengthmode 'scaled' (max norm only) and for magnitude-based colorscale range
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

    // Ignore lengthmode 'raw' if arrowref is set to 'paper': always scale
    if (lengthmode === 'scaled' || arrowref === 'paper') {
        /**
         * Compute the maximum arrow length we should allow, using a heuristic
         * to estimate the distance between neighboring points.
         *
         * Let:
         *  - D be the distance between neighboring points (the value we want to compute)
         *  - N be the number of points in the trace
         *  - dX be the x-width of the bounding box of all the points
         *  - dY be the y-width of the bounding box
         *
         * We want to satisfy this equation: D = sqrt((dX + D) * (dY + D) / N)
         *
         * This is basically the square root of the point density, with an additional
         * adjustment to account for the points on the edges (we add D to each dimension
         * of the bounding box). This equation gives us the _exact_ correct distance when
         * the points are arranged in a perfect grid; otherwise, it's just an estimate.
         *
         * Solving for D gives us:
         *  D = (dX + dY + sqrt((dX - dY)^2 + 4N * dX * dY)) / (2 * (N - 1))
         * which is the forumla we'll use below.
         *
         * Note: this formula was derived and documented by a human ;)
         */

        const dX = xMax - xMin;
        const dY = yMax - yMin;
        var pointDist;
        if (dX === 0 && dY === 0) {
            // If all points share the same x and y value, we can't estimate pointDist.
            // Default to an arbitrary value of 1.
            pointDist = 1;
        } else {
            // Use the formula derived above
            pointDist = (dX + dY + Math.sqrt((dX - dY) * (dX - dY) + 4 * nValid * dX * dY)) / (2 * (nValid - 1));
        }
        pointDist *= SHRINK_FACTOR;  // Adjust to slightly less than the computed distance

        // Set the trace scale factor such that the longest vector will have
        // a length equal to the computed pointDist
        trace._scaleFactor = pointDist / trace._maxNorm;

        // Note: If arrowref === 'paper', this scale factor must be
        // multiplied by Math.sqrt(xa._m * ya._m), but we can't do that quite yet
        // since the axis scales are not fully determined. Do it in plot step instead.
    } else {
        // lengthmode === 'raw'
        trace._scaleFactor = 1;
    }

    // Multiply computed scale factor by lengthfactor attr
    trace._scaleFactor *= trace.lengthfactor;

    // Now we need to compute the arrow geometry for axis autorange
    const xTipPositions = new Array(len);
    const yTipPositions = new Array(len);
    const xTailPositions = new Array(len);
    const yTailPositions = new Array(len);
    var arrowLenX, arrowLenY;
    // Compute the x- and y-positions of the tip of each arrow,
    // assuming arrowref === 'data' (i.e. u/v are in data coordinates)
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

    if (arrowref === 'data') {
        // If arrowref is 'data', we can use the arrow tip positions directly to expand the axes ranges
        trace._extremes[xa._id] = Axes.findExtremes(xa, xTipPositions.concat(xTailPositions), {padded: true});
        trace._extremes[ya._id] = Axes.findExtremes(ya, yTipPositions.concat(yTailPositions), {padded: true});
    } else {  // arrowref === 'paper'
        // TODO: For now, just do the same thing as for arrowref === 'data', but this is not correct.
        // We actually need more sophisticated logic here, since this will give a bad result
        // if the data aspect ratio is very different from the plot aspect ratio.
        // See https://github.com/plotly/plotly.js/issues/7979
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
