/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var barHover = require('../bar/hover');

module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var pts = barHover(pointData, xval, yval, hovermode);

    if(!pts) return;

    pointData = pts[0];
    var di = pointData.cd[pointData.index];

    var posLetter = pointData.cd[0].trace.orientation === 'h' ? 'y' : 'x';

    pointData[posLetter + 'LabelVal0'] = di.p0;
    pointData[posLetter + 'LabelVal1'] = di.p1;
    pointData.pts = di.pts;

    return pts;
};
