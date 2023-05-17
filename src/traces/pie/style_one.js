'use strict';

var Color = require('../../components/color');
var castOption = require('./helpers').castOption;
var Drawing = require('../../components/drawing');

module.exports = function styleOne(s, pt, trace, gd) {
    var line = trace.marker.line;
    var lineColor = castOption(line.color, pt.pts) || Color.defaultLine;
    var lineWidth = castOption(line.width, pt.pts) || 0;

    // enforce the point color, when colors (with s) & the pattern shape are missing.
    // 'abuse' the color attribute, used in the Drawing component for bar trace type.
    var marker = trace.marker;
    if(marker.pattern) {
        if(!marker.colors || !marker.pattern.shape) marker.color = pt.color;
    } else {
        marker.color = pt.color;
    }

    s.style('stroke-width', lineWidth)
        .call(Drawing.pointStyle, trace, gd, pt)
        .call(Color.stroke, lineColor);
};
