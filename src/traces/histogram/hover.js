/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var barHover = require('../bar/hover').hoverPoints;
var hoverLabelText = require('../../plots/cartesian/axes').hoverLabelText;
var instanceOrPeriod = require('../../plots/cartesian/instance_or_period');

module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var pts = barHover(pointData, xval, yval, hovermode);

    if(!pts) return;

    pointData = pts[0];
    var di = pointData.cd[pointData.index];
    var trace = pointData.cd[0].trace;

    if(!trace.cumulative.enabled) {
        var posLetter = trace.orientation === 'h' ? 'y' : 'x';
        var pp = instanceOrPeriod(pointData, trace, posLetter);
        var ax = pointData[posLetter + 'a'];
        var label = hoverLabelText(ax, di.ph0, di.ph1);
        if(pp[1] !== undefined) label += ' - ' + hoverLabelText(ax, pp[0], pp[1]);
        pointData[posLetter + 'Label'] = label;
    }

    return pts;
};
