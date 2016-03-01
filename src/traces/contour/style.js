/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Drawing = require('../../components/drawing');
var getColorscale = require('../../components/colorscale/get_scale');
var heatmapStyle = require('../heatmap/style');


module.exports = function style(gd) {
    d3.select(gd).selectAll('g.contour')
        .style('opacity', function(d) { return d.trace.opacity; })
        .each(function(d) {
            var c = d3.select(this),
                trace = d.trace,
                contours = trace.contours,
                line = trace.line,
                colorLines = contours.coloring==='lines',
                cs = contours.size||1,
                nc = Math.floor((contours.end + cs/10 - contours.start)/cs) + 1,
                scl = getColorscale(trace.colorscale),
                extraLevel = colorLines ? 0 : 1,
                colormap = d3.scale.linear()
                    .domain(scl.map(function(si) {
                        return (si[0]*(nc+extraLevel-1)-(extraLevel/2)) * cs +
                            contours.start;
                    }))
                    .interpolate(d3.interpolateRgb)
                    .range(scl.map(function(si) { return si[1]; }));

            c.selectAll('g.contourlevel').each(function(d, i) {
                d3.select(this).selectAll('path')
                    .call(Drawing.lineGroupStyle,
                        line.width,
                        colorLines ? colormap(contours.start+i*cs) : line.color,
                        line.dash);
            });
            c.selectAll('g.contourbg path')
                .style('fill', colormap(contours.start - cs/2));
            c.selectAll('g.contourfill path')
                .style('fill',function(d, i) {
                    return colormap(contours.start + (i+0.5)*cs);
                });
        });

    heatmapStyle(gd);
};
