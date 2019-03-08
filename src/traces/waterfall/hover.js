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

    pointData = barHoverPoints(pointData, xval, yval, hovermode)[0];

    var cd = pointData.cd;
    var trace = cd[0].trace;

    // the closest data point
    var index = pointData.index;
    var di = cd[index];

    var sizeLetter = (trace.orientation === 'h') ? 'x' : 'y';

    var size = (di.isSum) ? di.s : di.rawS;
    if(di.isSum === false) {
        // format numbers:
        if(size > 0) {
            pointData.extraText = size + ' ' + DIRSYMBOL.increasing;
        } else if(size < 0) {
            pointData.extraText = '(' + (-size) + ') ' + DIRSYMBOL.decreasing;
        }
    } else {
        pointData[sizeLetter + 'LabelVal'] = size;
    }

    return [pointData];
};
