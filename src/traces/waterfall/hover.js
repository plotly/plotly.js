/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Color = require('../../components/color');
var waterfallStyle = require('../../components/drawing').waterfallStyle;
var barHoverPoints = require('../bar/hover').hoverPoints;

var DIRSYMBOL = {
    increasing: '▲',
    decreasing: '▼'
};

module.exports = function hoverPoints(pointData, xval, yval, hovermode) {

    var points = barHoverPoints(pointData, xval, yval, hovermode);
    if(!points || !points.length) return points;
    var point = points[0];

    var cd = point.cd;
    var trace = cd[0].trace;

    // the closest data point
    var index = point.index;
    var di = cd[index];

    var sizeLetter = (trace.orientation === 'h') ? 'x' : 'y';

    var size = (di.isSum) ? di.b + di.s : di.rawS;
    if(!di.isSum) {
        // format delta numbers:
        if(size > 0) {
            point.extraText = size + ' ' + DIRSYMBOL.increasing;
        } else if(size < 0) {
            point.extraText = '(' + (-size) + ') ' + DIRSYMBOL.decreasing;
        }
        // display initial value
        point.extraText += '<br>Initial: ' + (di.b + di.s - size);
    } else {
        point[sizeLetter + 'LabelVal'] = size;
    }

    point.color = getTraceColor(trace, di);

    return [point];
};

function getTraceColor(trace, di) {

    var marker = waterfallStyle(di, trace);

    var mc = di.mcc || marker.color;
    var mlc = di.mlcc || marker.line.color;
    var mlw = di.mlw || marker.line.width;

    if(Color.opacity(mc)) return mc;
    else if(Color.opacity(mlc) && mlw) return mlc;
}
