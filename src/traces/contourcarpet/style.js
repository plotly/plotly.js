/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Drawing = require('../../components/drawing');
var heatmapStyle = require('../heatmap/style');

var makeColorMap = require('../contour/make_color_map');

module.exports = function style(gd) {
    var contours = d3.select(gd).selectAll('g.contour');

    contours.style('opacity', function(d) {
        return d.trace.opacity;
    });

    contours.each(function(d) {
        var c = d3.select(this);
        var trace = d.trace;
        var contours = trace.contours;
        var line = trace.line;
        var cs = contours.size || 1;
        var start = contours.start;

        if(!isFinite(cs)) {
            cs = 0;
        }

        c.selectAll('g.contourlevel').each(function() {
            d3.select(this).selectAll('path')
                .call(Drawing.lineGroupStyle,
                    line.width,
                    line.color,
                    line.dash);
        });

        if(trace.contours.type === 'levels' && trace.contours.coloring !== 'none') {
            var colorMap = makeColorMap(trace);

            c.selectAll('g.contourbg path')
                .style('fill', colorMap(start - cs / 2));

            c.selectAll('g.contourfill path')
                .style('fill', function(d, i) {
                    return colorMap(start + (i + 0.5) * cs);
                });
        } else {
            c.selectAll('g.contourfill path')
                .style('fill', trace.fillcolor);
        }
    });

    heatmapStyle(gd);
};
