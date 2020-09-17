/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var heatmapHover = require('../heatmap/hover');
var hoverLabelText = require('../../plots/cartesian/axes').hoverLabelText;
var instanceOrPeriod = require('../../plots/cartesian/instance_or_period');

module.exports = function hoverPoints(pointData, xval, yval, hovermode, hoverLayer, contour) {
    var pts = heatmapHover(pointData, xval, yval, hovermode, hoverLayer, contour);

    if(!pts) return;

    pointData = pts[0];
    var indices = pointData.index;
    var ny = indices[0];
    var nx = indices[1];
    var cd0 = pointData.cd[0];
    var trace = cd0.trace;
    var xRange = cd0.xRanges[nx];
    var yRange = cd0.yRanges[ny];

    var x0 = xRange[0];
    var x1 = xRange[1];
    var xx = instanceOrPeriod(pointData, trace, 'x');
    var xa = pointData.xa;
    var xLabel = hoverLabelText(xa, x0, x1);
    if(xx[1] !== undefined) xLabel = hoverLabelText(xa, xx[0], xx[1]);
    pointData.xLabel = xLabel;

    var y0 = yRange[0];
    var y1 = yRange[1];
    var yy = instanceOrPeriod(pointData, trace, 'y');
    var ya = pointData.ya;
    var yLabel = hoverLabelText(ya, y0, y1);
    if(yy[1] !== undefined) yLabel = hoverLabelText(ya, yy[0], yy[1]);
    pointData.yLabel = yLabel;

    return pts;
};
