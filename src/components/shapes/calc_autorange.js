/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Axes = require('../../plots/cartesian/axes');

var constants = require('./constants');
var helpers = require('./helpers');


module.exports = function calcAutorange(gd) {
    var fullLayout = gd._fullLayout,
        shapeList = Lib.filterVisible(fullLayout.shapes);

    if(!shapeList.length || !gd._fullData.length) return;

    for(var i = 0; i < shapeList.length; i++) {
        var shape = shapeList[i];

        var ax, bounds;

        if(shape.xref !== 'paper') {
            var vx0 = shape.xsizemode === 'pixel' ? shape.xanchor : shape.x0,
                vx1 = shape.xsizemode === 'pixel' ? shape.xanchor : shape.x1;
            ax = Axes.getFromId(gd, shape.xref);

            bounds = shapeBounds(ax, vx0, vx1, shape.path, constants.paramIsX);

            if(bounds) Axes.expand(ax, bounds, calcXPaddingOptions(shape));
        }

        if(shape.yref !== 'paper') {
            var vy0 = shape.ysizemode === 'pixel' ? shape.yanchor : shape.y0,
                vy1 = shape.ysizemode === 'pixel' ? shape.yanchor : shape.y1;
            ax = Axes.getFromId(gd, shape.yref);

            bounds = shapeBounds(ax, vy0, vy1, shape.path, constants.paramIsY);
            if(bounds) Axes.expand(ax, bounds, calcYPaddingOptions(shape));
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
    var ppad = lineWidth / 2,
        axisDirectionReverted = isYAxis;

    if(sizeMode === 'pixel') {
        var coords = path ?
          helpers.extractPathCoords(path, isYAxis ? constants.paramIsY : constants.paramIsX) :
          [v0, v1];
        var maxValue = Lib.aggNums(Math.max, null, coords),
            minValue = Lib.aggNums(Math.min, null, coords),
            beforePad = minValue < 0 ? Math.abs(minValue) + ppad : ppad,
            afterPad = maxValue > 0 ? maxValue + ppad : ppad;

        return {
            ppad: ppad,
            ppadplus: axisDirectionReverted ? beforePad : afterPad,
            ppadminus: axisDirectionReverted ? afterPad : beforePad
        };
    } else {
        return {ppad: ppad};
    }
}

function shapeBounds(ax, v0, v1, path, paramsToUse) {
    var convertVal = (ax.type === 'category') ? ax.r2c : ax.d2c;

    if(v0 !== undefined) return [convertVal(v0), convertVal(v1)];
    if(!path) return;

    var min = Infinity,
        max = -Infinity,
        segments = path.match(constants.segmentRE),
        i,
        segment,
        drawnParam,
        params,
        val;

    if(ax.type === 'date') convertVal = helpers.decodeDate(convertVal);

    for(i = 0; i < segments.length; i++) {
        segment = segments[i];
        drawnParam = paramsToUse[segment.charAt(0)].drawn;
        if(drawnParam === undefined) continue;

        params = segments[i].substr(1).match(constants.paramRE);
        if(!params || params.length < drawnParam) continue;

        val = convertVal(params[drawnParam]);
        if(val < min) min = val;
        if(val > max) max = val;
    }
    if(max >= min) return [min, max];
}
