/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

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
        point.extraText += '<br>Initial: ' + (size - di.s);
    } else {
        point[sizeLetter + 'LabelVal'] = size;
    }

    return [point];
};
