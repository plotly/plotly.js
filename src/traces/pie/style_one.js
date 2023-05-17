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
    // alternative: could be to pass the point color as an extra parameter in pointStyle
    // alternative: could be to activate pattern also for funnelarea
    var marker = trace.marker;
    if(marker.pattern) {
        if(!marker.colors || !marker.pattern.shape) marker.color = pt.color;
    } else {
        marker.color = pt.color;
    }

    Drawing.pointStyle(s, trace, gd, pt);
    // to do : push into s.style d3 logic

    s.style('stroke-width', lineWidth)
        // .call(Color.fill, pt.color)
        .call(Color.stroke, lineColor);
};
