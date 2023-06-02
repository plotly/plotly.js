'use strict';

var Drawing = require('../../components/drawing');

module.exports = function fillOne(s, pt, trace, gd) {
    // enforce the point color, when colors (with s) & the pattern shape are missing.
    // 'abuse' the color attribute, used in the Drawing component for bar trace type.
    var marker = trace.marker;
    if(marker.pattern) {
        if(!marker.colors || !marker.pattern.shape) marker.color = pt.color;
    } else {
        marker.color = pt.color;
    }

    Drawing.pointStyle(s, trace, gd, pt);
};
