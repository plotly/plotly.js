'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');

var constants = require('./constants');
var helpers = require('./helpers');


module.exports = function calcAutorange(gd) {
    var fullLayout = gd._fullLayout;
    var shapeList = Lib.filterVisible(fullLayout.shapes);

    if(!shapeList.length || !gd._fullData.length) return;

    for(var i = 0; i < shapeList.length; i++) {
        var shape = shapeList[i];
        shape._extremes = {};

        var ax; var bounds;
        var xRefType = Axes.getRefType(shape.xref);
        var yRefType = Axes.getRefType(shape.yref);

        // paper and axis domain referenced shapes don't affect autorange
        if(shape.xref !== 'paper' && xRefType !== 'domain') {
            ax = Axes.getFromId(gd, shape.xref);

            bounds = shapeBounds(ax, shape, constants.paramIsX);
            if(bounds) {
                shape._extremes[ax._id] = Axes.findExtremes(ax, bounds, calcXPaddingOptions(shape));
            }
        }

        if(shape.yref !== 'paper' && yRefType !== 'domain') {
            ax = Axes.getFromId(gd, shape.yref);

            bounds = shapeBounds(ax, shape, constants.paramIsY);
            if(bounds) {
                shape._extremes[ax._id] = Axes.findExtremes(ax, bounds, calcYPaddingOptions(shape));
            }
        }
    }
};

function calcXPaddingOptions(shape) {
    return calcPaddingOptions(shape.line.width, shape.xsizemode, shape.x0, shape.x1, shape.path, false);
}

function calcYPaddingOptions(shape) {
    return calcPaddingOptions(shape.line.width, shape.ysizemode, shape.y0, shape.y1, shape.path, true);
}

function calcPaddingOptions(lineWidth, sizeMode, v0, v1, path, isYAxis) {
    var ppad = lineWidth / 2;
    var axisDirectionReverted = isYAxis;

    if(sizeMode === 'pixel') {
        var coords = path ?
            helpers.extractPathCoords(path, isYAxis ? constants.paramIsY : constants.paramIsX) :
            [v0, v1];
        var maxValue = Lib.aggNums(Math.max, null, coords);
        var minValue = Lib.aggNums(Math.min, null, coords);
        var beforePad = minValue < 0 ? Math.abs(minValue) + ppad : ppad;
        var afterPad = maxValue > 0 ? maxValue + ppad : ppad;

        return {
            ppad: ppad,
            ppadplus: axisDirectionReverted ? beforePad : afterPad,
            ppadminus: axisDirectionReverted ? afterPad : beforePad
        };
    } else {
        return {ppad: ppad};
    }
}

function shapeBounds(ax, shape, paramsToUse) {
    var dim = ax._id.charAt(0) === 'x' ? 'x' : 'y';
    var isCategory = ax.type === 'category' || ax.type === 'multicategory';
    var v0;
    var v1;
    var shiftStart = 0;
    var shiftEnd = 0;

    var convertVal = isCategory ? ax.r2c : ax.d2c;

    var isSizeModeScale = shape[dim + 'sizemode'] === 'scaled';
    if(isSizeModeScale) {
        v0 = shape[dim + '0'];
        v1 = shape[dim + '1'];
        if(isCategory) {
            shiftStart = shape[dim + '0shift'];
            shiftEnd = shape[dim + '1shift'];
        }
    } else {
        v0 = shape[dim + 'anchor'];
        v1 = shape[dim + 'anchor'];
    }

    if(v0 !== undefined) return [convertVal(v0) + shiftStart, convertVal(v1) + shiftEnd];
    if(!shape.path) return;

    var min = Infinity;
    var max = -Infinity;
    var segments = shape.path.match(constants.segmentRE);
    var i;
    var segment;
    var drawnParam;
    var params;
    var val;

    if(ax.type === 'date') convertVal = helpers.decodeDate(convertVal);

    for(i = 0; i < segments.length; i++) {
        segment = segments[i];
        drawnParam = paramsToUse[segment.charAt(0)].drawn;
        if(drawnParam === undefined) continue;

        params = segments[i].slice(1).match(constants.paramRE);
        if(!params || params.length < drawnParam) continue;

        val = convertVal(params[drawnParam]);
        if(val < min) min = val;
        if(val > max) max = val;
    }
    if(max >= min) return [min, max];
}
