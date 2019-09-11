/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var Color = require('../../components/color');
var Lib = require('../../lib');

function style(gd) {
    gd._fullLayout._treemaplayer.selectAll('.trace').each(function(cd) {
        var gTrace = d3.select(this);
        var cd0 = cd[0];
        var trace = cd0.trace;

        gTrace.style('opacity', trace.opacity);

        gTrace.selectAll('path.surface').each(function(pt) {
            d3.select(this).call(styleOne, pt, trace);
        });
    });
}

function styleOne(s, pt, trace, hovered) {
    var cdi = pt.data.data;
    var ptNumber = cdi.i;
    var lineColor;
    var lineWidth;
    var opacity;

    if(hovered) {
        lineColor = trace._hovered.marker.line.color;
        lineWidth = trace._hovered.marker.line.width;
        opacity = 1;
    } else {
        lineColor = Lib.castOption(trace, ptNumber, 'marker.line.color') || Color.defaultLine;
        lineWidth = Lib.castOption(trace, ptNumber, 'marker.line.width') || 0;
        opacity = trace.marker.opacity * Math.pow(trace.branch.opacity, pt.height);
    }

    s.style('stroke-width', lineWidth)
        .call(Color.fill, cdi.color)
        .call(Color.stroke, lineColor)
        .style('opacity', opacity);
}

module.exports = {
    style: style,
    styleOne: styleOne
};
