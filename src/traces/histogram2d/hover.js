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

module.exports = function hoverPoints(pointData, xval, yval, hovermode, hoverLayer, contour) {
    var pts = heatmapHover(pointData, xval, yval, hovermode, hoverLayer, contour);

    if(!pts) return;

    pointData = pts[0];
    var indices = pointData.index;
    var ny = indices[0];
    var nx = indices[1];
    var cd0 = pointData.cd[0];

    var trace = cd0.trace;
    var hasPeriodX = !!trace.xperiodalignment;
    var hasPeriodY = !!trace.yperiodalignment;

    if(hasPeriodX) {
        pointData.xLabel = hoverLabelText(pointData.xa, cd0.orig_x[nx]);
    } else {
        var xRange = cd0.xRanges[nx];
        pointData.xLabel = hoverLabelText(pointData.xa, xRange[0], xRange[1]);
    }
    if(hasPeriodY) {
        pointData.yLabel = hoverLabelText(pointData.ya, cd0.orig_x[ny]);
    } else {
        var yRange = cd0.yRanges[ny];
        pointData.yLabel = hoverLabelText(pointData.ya, yRange[0], yRange[1]);
    }

    return pts;
};
