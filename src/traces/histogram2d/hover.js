/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var heatmapHover = require('../heatmap/hover');

module.exports = function hoverPoints(pointData, xval, yval, hovermode, contour) {
    var pts = heatmapHover(pointData, xval, yval, hovermode, contour);

    if(!pts) return;

    pointData = pts[0];
    var indices = pointData.index;
    var ny = indices[0];
    var nx = indices[1];
    var cd0 = pointData.cd[0];

    pointData.xLabelVal0 = cd0.xRanges[nx][0];
    pointData.xLabelVal1 = cd0.xRanges[nx][1];
    pointData.yLabelVal0 = cd0.yRanges[ny][0];
    pointData.yLabelVal1 = cd0.yRanges[ny][1];
    pointData.pts = cd0.pts[ny][nx];

    return pts;
};
