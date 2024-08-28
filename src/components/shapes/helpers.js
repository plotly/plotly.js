'use strict';

var constants = require('./constants');

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');

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

exports.extractPathCoords = function(path, paramsToUse, isRaw) {
    var extractedCoordinates = [];

    var segments = path.match(constants.segmentRE);
    segments.forEach(function(segment) {
        var relevantParamIdx = paramsToUse[segment.charAt(0)].drawn;
        if(relevantParamIdx === undefined) return;

        var params = segment.substr(1).match(constants.paramRE);
        if(!params || params.length < relevantParamIdx) return;

        var str = params[relevantParamIdx];
        var pos = isRaw ? str : Lib.cleanNumber(str);

        extractedCoordinates.push(pos);
    });

    return extractedCoordinates;
};

exports.getDataToPixel = function(gd, axis, shift, isVertical, refType) {
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
                var shiftPixels = getPixelShift(axis, shift);
                return axis._offset + axis.r2p(d2r(v, true)) + shiftPixels;
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

exports.makeShapesOptionsAndPlotinfo = function(gd, index) {
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

// TODO: move to selections helpers?
exports.makeSelectionsOptionsAndPlotinfo = function(gd, index) {
    var options = gd._fullLayout.selections[index] || {};

    var plotinfo = gd._fullLayout._plots[options.xref + options.yref];
    var hasPlotinfo = !!plotinfo;
    if(hasPlotinfo) {
        plotinfo._hadPlotinfo = true;
    } else {
        plotinfo = {};
        if(options.xref) plotinfo.xaxis = gd._fullLayout[options.xref + 'axis'];
        if(options.yref) plotinfo.yaxis = gd._fullLayout[options.yref + 'axis'];
    }

    return {
        options: options,
        plotinfo: plotinfo
    };
};


exports.getPathString = function(gd, options) {
    var type = options.type;
    var xRefType = Axes.getRefType(options.xref);
    var yRefType = Axes.getRefType(options.yref);
    var xa = Axes.getFromId(gd, options.xref);
    var ya = Axes.getFromId(gd, options.yref);
    var gs = gd._fullLayout._size;
    var x2r, x2p, y2r, y2p;
    var xShiftStart = getPixelShift(xa, options.x0shift);
    var xShiftEnd = getPixelShift(xa, options.x1shift);
    var yShiftStart = getPixelShift(ya, options.y0shift);
    var yShiftEnd = getPixelShift(ya, options.y1shift);
    var x0, x1, y0, y1;

    if(xa) {
        if(xRefType === 'domain') {
            x2p = function(v) { return xa._offset + xa._length * v; };
        } else {
            x2r = exports.shapePositionToRange(xa);
            x2p = function(v) { return xa._offset + xa.r2p(x2r(v, true)); };
        }
    } else {
        x2p = function(v) { return gs.l + gs.w * v; };
    }

    if(ya) {
        if(yRefType === 'domain') {
            y2p = function(v) { return ya._offset + ya._length * (1 - v); };
        } else {
            y2r = exports.shapePositionToRange(ya);
            y2p = function(v) { return ya._offset + ya.r2p(y2r(v, true)); };
        }
    } else {
        y2p = function(v) { return gs.t + gs.h * (1 - v); };
    }

    if(type === 'path') {
        if(xa && xa.type === 'date') x2p = exports.decodeDate(x2p);
        if(ya && ya.type === 'date') y2p = exports.decodeDate(y2p);
        return convertPath(options, x2p, y2p);
    }
    if(options.xsizemode === 'pixel') {
        var xAnchorPos = x2p(options.xanchor);
        x0 = xAnchorPos + options.x0 + xShiftStart;
        x1 = xAnchorPos + options.x1 + xShiftEnd;
    } else {
        x0 = x2p(options.x0) + xShiftStart;
        x1 = x2p(options.x1) + xShiftEnd;
    }

    if(options.ysizemode === 'pixel') {
        var yAnchorPos = y2p(options.yanchor);
        y0 = yAnchorPos - options.y0 + yShiftStart;
        y1 = yAnchorPos - options.y1 + yShiftEnd;
    } else {
        y0 = y2p(options.y0) + yShiftStart;
        y1 = y2p(options.y1) + yShiftEnd;
    }

    if(type === 'line') return 'M' + x0 + ',' + y0 + 'L' + x1 + ',' + y1;
    if(type === 'rect') return 'M' + x0 + ',' + y0 + 'H' + x1 + 'V' + y1 + 'H' + x0 + 'Z';

    // circle
    var cx = (x0 + x1) / 2;
    var cy = (y0 + y1) / 2;
    var rx = Math.abs(cx - x0);
    var ry = Math.abs(cy - y0);
    var rArc = 'A' + rx + ',' + ry;
    var rightPt = (cx + rx) + ',' + cy;
    var topPt = cx + ',' + (cy - ry);
    return 'M' + rightPt + rArc + ' 0 1,1 ' + topPt +
        rArc + ' 0 0,1 ' + rightPt + 'Z';
};


function convertPath(options, x2p, y2p) {
    var pathIn = options.path;
    var xSizemode = options.xsizemode;
    var ySizemode = options.ysizemode;
    var xAnchor = options.xanchor;
    var yAnchor = options.yanchor;

    return pathIn.replace(constants.segmentRE, function(segment) {
        var paramNumber = 0;
        var segmentType = segment.charAt(0);
        var xParams = constants.paramIsX[segmentType];
        var yParams = constants.paramIsY[segmentType];
        var nParams = constants.numParams[segmentType];

        var paramString = segment.substr(1).replace(constants.paramRE, function(param) {
            if(xParams[paramNumber]) {
                if(xSizemode === 'pixel') param = x2p(xAnchor) + Number(param);
                else param = x2p(param);
            } else if(yParams[paramNumber]) {
                if(ySizemode === 'pixel') param = y2p(yAnchor) - Number(param);
                else param = y2p(param);
            }
            paramNumber++;

            if(paramNumber > nParams) param = 'X';
            return param;
        });

        if(paramNumber > nParams) {
            paramString = paramString.replace(/[\s,]*X.*/, '');
            Lib.log('Ignoring extra params in segment ' + segment);
        }

        return segmentType + paramString;
    });
}

function getPixelShift(axis, shift) {
    shift = shift || 0;
    var shiftPixels = 0;
    if(shift && axis && (axis.type === 'category' || axis.type === 'multicategory')) {
        shiftPixels = (axis.r2p(1) - axis.r2p(0)) * shift;
    }
    return shiftPixels;
}
