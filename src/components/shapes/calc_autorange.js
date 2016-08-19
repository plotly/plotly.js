/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Axes = require('../../plots/cartesian/axes');

var constants = require('./constants');
var helpers = require('./helpers');


module.exports = function calcAutorange(gd) {
    var fullLayout = gd._fullLayout,
        shapeList = fullLayout.shapes;

    if(!shapeList.length || !gd._fullData.length) return;

    for(var i = 0; i < shapeList.length; i++) {
        var shape = shapeList[i],
            ppad = shape.line.width / 2;

        var ax, bounds;

        if(shape.xref !== 'paper') {
            ax = Axes.getFromId(gd, shape.xref);
            bounds = shapeBounds(ax, shape.x0, shape.x1, shape.path, constants.paramIsX);
            if(bounds) Axes.expand(ax, bounds, {ppad: ppad});
        }

        if(shape.yref !== 'paper') {
            ax = Axes.getFromId(gd, shape.yref);
            bounds = shapeBounds(ax, shape.y0, shape.y1, shape.path, constants.paramIsY);
            if(bounds) Axes.expand(ax, bounds, {ppad: ppad});
        }
    }
};

function shapeBounds(ax, v0, v1, path, paramsToUse) {
    var convertVal = (ax.type === 'category') ? Number : ax.d2c;

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
