'use strict';

var Color = require('../../components/color');

var heatmapHoverPoints = require('../heatmap/hover');

module.exports = function hoverPoints(pointData, xval, yval, hovermode, opts) {
    if(!opts) opts = {};
    opts.isContour = true;

    var hoverData = heatmapHoverPoints(pointData, xval, yval, hovermode, opts);

    if(hoverData) {
        hoverData.forEach(function(hoverPt) {
            var trace = hoverPt.trace;
            if(trace.contours.type === 'constraint') {
                if(trace.fillcolor && Color.opacity(trace.fillcolor)) {
                    hoverPt.color = Color.addOpacity(trace.fillcolor, 1);
                } else if(trace.contours.showlines && Color.opacity(trace.line.color)) {
                    hoverPt.color = Color.addOpacity(trace.line.color, 1);
                }
            }
        });
    }

    return hoverData;
};
