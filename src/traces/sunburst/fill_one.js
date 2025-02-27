'use strict';

var Drawing = require('../../components/drawing');
var Color = require('../../components/color');

module.exports = function fillOne(s, pt, trace, gd, fadedColor) {
    var cdi = pt.data.data;
    var ptNumber = cdi.i;

    var color = fadedColor || cdi.color;

    if(ptNumber >= 0) {
        pt.i = cdi.i;

        var marker = trace.marker;
        if(marker.pattern) {
            if(!marker.colors || !marker.pattern.shape) {
                marker.color = color;
                pt.color = color;
            }
        } else {
            marker.color = color;
            pt.color = color;
        }

        Drawing.pointStyle(s, trace, gd, pt);
    } else {
        Color.fill(s, color);
    }
};
