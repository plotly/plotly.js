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

        var params = segment.slice(1).match(constants.paramRE);
        if(!params || params.length < relevantParamIdx) return;

        var str = params[relevantParamIdx];
        var pos = isRaw ? str : Lib.cleanNumber(str);

        extractedCoordinates.push(pos);
    });

    return extractedCoordinates;
};

exports.countDefiningCoords = function(shapeType, path, axLetter) {
    // non-path shapes always have 2 defining coordinates
    if(shapeType !== 'path') return 2;
    if(!path) return 0;

    const segments = path.match(constants.segmentRE);
    if(!segments) return 0;

    const paramIsAxis = axLetter === 'x' ? constants.paramIsX : constants.paramIsY;

    return segments.reduce((coordCount, segment) => {
        // for each path command, check if there is a drawn coordinate for this axis
        const segmentType = segment.charAt(0);
        const hasDrawn = paramIsAxis[segmentType].drawn !== undefined;
        return coordCount + (hasDrawn ? 1 : 0);
    }, 0);
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
    const shapeType = options.type;
    const xRefType = Axes.getRefType(options.xref);
    const yRefType = Axes.getRefType(options.yref);
    const gs = gd._fullLayout._size;
    var xa, ya;
    var xShiftStart, xShiftEnd, yShiftStart, yShiftEnd;
    var x2p, y2p;
    var x0, x1, y0, y1;

    function getConverter(axis, refType, shapeType, isVertical) {
        var converter;
        if(axis) {
            if(refType === 'domain') {
                if(isVertical) {
                    converter = function(v) { return axis._offset + axis._length * (1 - v); };
                } else {
                    converter = function(v) { return axis._offset + axis._length * v; };
                }
            } else {
                const d2r = exports.shapePositionToRange(axis);
                converter = function(v) { return axis._offset + axis.r2p(d2r(v, true)); };

                if(shapeType === 'path' && axis.type === 'date') converter = exports.decodeDate(converter);
            }
        } else {
            if(isVertical) {
                converter = function(v) { return gs.t + gs.h * (1 - v); };
            } else {
                converter = function(v) { return gs.l + gs.w * v; };
            }
        }

        return converter;
    }

    // Build function(s) to convert data to pixel
    if(xRefType === 'array') {
        x2p = [];
        xa = options.xref.map(function(ref) { return Axes.getFromId(gd, ref); });
        x2p = options.xref.map(function(ref, i) {
            return getConverter(xa[i], Axes.getRefType(ref), shapeType, false);
        });
    } else {
        xa = Axes.getFromId(gd, options.xref);
        x2p = getConverter(xa, xRefType, shapeType, false);
    }
    if(yRefType === 'array') {
        y2p = [];
        ya = options.yref.map(function(ref) { return Axes.getFromId(gd, ref); });
        y2p = options.yref.map(function(ref, i) {
            return getConverter(ya[i], Axes.getRefType(ref), shapeType, true);
        });
    } else {
        ya = Axes.getFromId(gd, options.yref);
        y2p = getConverter(ya, yRefType, shapeType, true);
    }

    if(shapeType === 'path') { return convertPath(options, x2p, y2p); }

    // Calculate pixel coordinates for non-path shapes
    // Pixel sizemode for array refs is not supported for now
    if(xRefType === 'array') {
        xShiftStart = getPixelShift(xa[0], options.x0shift);
        xShiftEnd = getPixelShift(xa[1], options.x1shift);
        x0 = x2p[0](options.x0) + xShiftStart;
        x1 = x2p[1](options.x1) + xShiftEnd;
    } else {
        xShiftStart = getPixelShift(xa, options.x0shift);
        xShiftEnd = getPixelShift(xa, options.x1shift);
        if(options.xsizemode === 'pixel') {
            const xAnchorPos = x2p(options.xanchor);
            x0 = xAnchorPos + options.x0 + xShiftStart;
            x1 = xAnchorPos + options.x1 + xShiftEnd;
        } else {
            x0 = x2p(options.x0) + xShiftStart;
            x1 = x2p(options.x1) + xShiftEnd;
        }
    }
    if(yRefType === 'array') {
        yShiftStart = getPixelShift(ya[0], options.y0shift);
        yShiftEnd = getPixelShift(ya[1], options.y1shift);
        y0 = y2p[0](options.y0) + yShiftStart;
        y1 = y2p[1](options.y1) + yShiftEnd;
    } else {
        yShiftStart = getPixelShift(ya, options.y0shift);
        yShiftEnd = getPixelShift(ya, options.y1shift);
        if(options.ysizemode === 'pixel') {
            const yAnchorPos = y2p(options.yanchor);
            y0 = yAnchorPos - options.y0 + yShiftStart;
            y1 = yAnchorPos - options.y1 + yShiftEnd;
        } else {
            y0 = y2p(options.y0) + yShiftStart;
            y1 = y2p(options.y1) + yShiftEnd;
        }
    }

    if(shapeType === 'line') return 'M' + x0 + ',' + y0 + 'L' + x1 + ',' + y1;
    if(shapeType === 'rect') return 'M' + x0 + ',' + y0 + 'H' + x1 + 'V' + y1 + 'H' + x0 + 'Z';

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
    const pathIn = options.path;
    const xSizemode = options.xsizemode;
    const ySizemode = options.ysizemode;
    const xAnchor = options.xanchor;
    const yAnchor = options.yanchor;
    const isArrayXref = Array.isArray(options.xref);
    const isArrayYref = Array.isArray(options.yref);
    var xVertexIndex = 0;
    var yVertexIndex = 0;

    return pathIn.replace(constants.segmentRE, function(segment) {
        var paramNumber = 0;
        var segmentType = segment.charAt(0);
        var xParams = constants.paramIsX[segmentType];
        var yParams = constants.paramIsY[segmentType];
        var nParams = constants.numParams[segmentType];
        const hasDrawnX = xParams.drawn !== undefined;
        const hasDrawnY = yParams.drawn !== undefined;

        // Use vertex indices for array refs (same converter for all params in segment)
        const segmentX2p = isArrayXref ? x2p[xVertexIndex] : x2p;
        const segmentY2p = isArrayYref ? y2p[yVertexIndex] : y2p;

        var paramString = segment.slice(1).replace(constants.paramRE, function(param) {
            if(xParams[paramNumber]) {
                if(xSizemode === 'pixel') param = segmentX2p(xAnchor) + Number(param);
                else param = segmentX2p(param);
            } else if(yParams[paramNumber]) {
                if(ySizemode === 'pixel') param = segmentY2p(yAnchor) - Number(param);
                else param = segmentY2p(param);
            }
            paramNumber++;

            if(paramNumber > nParams) param = 'X';
            return param;
        });

        if(paramNumber > nParams) {
            paramString = paramString.replace(/[\s,]*X.*/, '');
            Lib.log('Ignoring extra params in segment ' + segment);
        }

        if(hasDrawnX) xVertexIndex++;
        if(hasDrawnY) yVertexIndex++;

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
