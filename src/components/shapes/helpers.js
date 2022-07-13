'use strict';

var constants = require('./constants');

var Lib = require('../../lib');

// special position conversion functions... category axis positions can't be
// specified by their data values, because they don't make a continuous mapping.
// so these have to be specified in terms of the category serial numbers,
// but can take fractional values. Other axis types we specify position based on
// the actual data values.
// TODO: in V3.0 (when log axis ranges are in data units) range and shape position
// will be identical, so rangeToShapePosition and shapePositionToRange can be
// removed entirely.

exports.rangeToShapePosition = function(ax) {
    return (ax.type === 'log') ? ax.r2d : function(v) { return v; };
};

exports.shapePositionToRange = function(ax) {
    return (ax.type === 'log') ? ax.d2r : function(v) { return v; };
};

exports.decodeDate = function(convertToPx) {
    return function(v) {
        if(v.replace) v = v.replace('_', ' ');
        return convertToPx(v);
    };
};

exports.encodeDate = function(convertToDate) {
    return function(v) { return convertToDate(v).replace(' ', '_'); };
};

exports.extractPathCoords = function(path, paramsToUse) {
    var extractedCoordinates = [];

    var segments = path.match(constants.segmentRE);
    segments.forEach(function(segment) {
        var relevantParamIdx = paramsToUse[segment.charAt(0)].drawn;
        if(relevantParamIdx === undefined) return;

        var params = segment.substr(1).match(constants.paramRE);
        if(!params || params.length < relevantParamIdx) return;

        extractedCoordinates.push(Lib.cleanNumber(params[relevantParamIdx]));
    });

    return extractedCoordinates;
};

exports.getDataToPixel = function(gd, axis, isVertical, refType) {
    var gs = gd._fullLayout._size;
    var dataToPixel;

    if(axis) {
        if(refType === 'domain') {
            dataToPixel = function(v) {
                return axis._length * (isVertical ? (1 - v) : v) + axis._offset;
            };
        } else {
            var d2r = exports.shapePositionToRange(axis);

            dataToPixel = function(v) {
                return axis._offset + axis.r2p(d2r(v, true));
            };

            if(axis.type === 'date') dataToPixel = exports.decodeDate(dataToPixel);
        }
    } else if(isVertical) {
        dataToPixel = function(v) { return gs.t + gs.h * (1 - v); };
    } else {
        dataToPixel = function(v) { return gs.l + gs.w * v; };
    }

    return dataToPixel;
};

exports.getPixelToData = function(gd, axis, isVertical, opt) {
    var gs = gd._fullLayout._size;
    var pixelToData;

    if(axis) {
        if(opt === 'domain') {
            pixelToData = function(p) {
                var q = (p - axis._offset) / axis._length;
                return isVertical ? 1 - q : q;
            };
        } else {
            var r2d = exports.rangeToShapePosition(axis);
            pixelToData = function(p) { return r2d(axis.p2r(p - axis._offset)); };
        }
    } else if(isVertical) {
        pixelToData = function(p) { return 1 - (p - gs.t) / gs.h; };
    } else {
        pixelToData = function(p) { return (p - gs.l) / gs.w; };
    }

    return pixelToData;
};

/**
 * Based on the given stroke width, rounds the passed
 * position value to represent either a full or half pixel.
 *
 * In case of an odd stroke width (e.g. 1), this measure ensures
 * that a stroke positioned at the returned position isn't rendered
 * blurry due to anti-aliasing.
 *
 * In case of an even stroke width (e.g. 2), this measure ensures
 * that the position value is transformed to a full pixel value
 * so that anti-aliasing doesn't take effect either.
 *
 * @param {number} pos The raw position value to be transformed
 * @param {number} strokeWidth The stroke width
 * @returns {number} either an integer or a .5 decimal number
 */
exports.roundPositionForSharpStrokeRendering = function(pos, strokeWidth) {
    var strokeWidthIsOdd = Math.round(strokeWidth % 2) === 1;
    var posValAsInt = Math.round(pos);

    return strokeWidthIsOdd ? posValAsInt + 0.5 : posValAsInt;
};

exports.makeOptionsAndPlotinfo = function(gd, index) {
    var options = gd._fullLayout.shapes[index] || {};

    var plotinfo = gd._fullLayout._plots[options.xref + options.yref];
    var hasPlotinfo = !!plotinfo;
    if(hasPlotinfo) {
        plotinfo._hadPlotinfo = true;
    } else {
        plotinfo = {};
        if(options.xref && options.xref !== 'paper') plotinfo.xaxis = gd._fullLayout[options.xref + 'axis'];
        if(options.yref && options.yref !== 'paper') plotinfo.yaxis = gd._fullLayout[options.yref + 'axis'];
    }

    plotinfo.xsizemode = options.xsizemode;
    plotinfo.ysizemode = options.ysizemode;
    plotinfo.xanchor = options.xanchor;
    plotinfo.yanchor = options.yanchor;

    return {
        options: options,
        plotinfo: plotinfo
    };
};
