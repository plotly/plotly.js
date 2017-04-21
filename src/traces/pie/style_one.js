/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Color = require('../../components/color');

module.exports = function styleOne(s, pt, trace) {
    var lineColor = trace.marker.line.color;
    if(Array.isArray(lineColor)) lineColor = lineColor[pt.i] || Color.defaultLine;

    var lineWidth = trace.marker.line.width || 0;
    if(Array.isArray(lineWidth)) lineWidth = lineWidth[pt.i] || 0;

    s.style({'stroke-width': lineWidth})
    .call(Color.fill, pt.color)
    .call(Color.stroke, lineColor);
};
