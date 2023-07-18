'use strict';

var Drawing = require('../../components/drawing');
var Color = require('../../components/color');

module.exports = function fillOne(s, pt, trace, gd) {
    var pattern = trace.marker.pattern;
    if(pattern && pattern.shape) {
        Drawing.pointStyle(s, trace, gd, pt);
    } else {
        Color.fill(s, pt.color);
    }
};
