'use strict';

var Color = require('../../components/color');
var castOption = require('./helpers').castOption;

module.exports = function styleOne(s, pt, trace) {
    var line = trace.marker.line;
    var lineColor = castOption(line.color, pt.pts) || Color.defaultLine;
    var lineWidth = castOption(line.width, pt.pts) || 0;

    s.style('stroke-width', lineWidth)
        .call(Color.fill, pt.color)
        .call(Color.stroke, lineColor);
};
