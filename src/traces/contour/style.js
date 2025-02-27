'use strict';

var d3 = require('@plotly/d3');

var Drawing = require('../../components/drawing');
var heatmapStyle = require('../heatmap/style');

var makeColorMap = require('./make_color_map');


module.exports = function style(gd) {
    var contours = d3.select(gd).selectAll('g.contour');

    contours.style('opacity', function(d) {
        return d[0].trace.opacity;
    });

    contours.each(function(d) {
        var c = d3.select(this);
        var trace = d[0].trace;
        var contours = trace.contours;
        var line = trace.line;
        var cs = contours.size || 1;
        var start = contours.start;

        // for contourcarpet only - is this a constraint-type contour trace?
        var isConstraintType = contours.type === 'constraint';
        var colorLines = !isConstraintType && contours.coloring === 'lines';
        var colorFills = !isConstraintType && contours.coloring === 'fill';

        var colorMap = (colorLines || colorFills) ? makeColorMap(trace) : null;

        // Create a function to map contour levels to colors if line.color is an array
        var lineColorFunc = null;
        if(Array.isArray(line.color)) {
            var levels = [];
            c.selectAll('g.contourlevel').each(function(d) {
                levels.push(d.level);
            });
            
            // Sort levels to ensure consistent color mapping
            levels.sort(function(a, b) { return a - b; });
            
            // Create mapping function from level to color
            lineColorFunc = function(level) {
                var index = levels.indexOf(level);
                // If level not found or line.color is empty, return default color
                if(index === -1 || !line.color.length) return line.color[0] || '#444';
                // Map level index to color array, handling wrapping for more levels than colors
                return line.color[index % line.color.length];
            };
        }
        
        c.selectAll('g.contourlevel').each(function(d) {
            var lineColor;
            if(colorLines) {
                lineColor = colorMap(d.level);
            } else if(lineColorFunc) {
                lineColor = lineColorFunc(d.level);
            } else {
                lineColor = line.color;
            }
            
            d3.select(this).selectAll('path')
                .call(Drawing.lineGroupStyle,
                    line.width,
                    lineColor,
                    line.dash);
        });

        var labelFont = contours.labelfont;
        c.selectAll('g.contourlabels text').each(function(d) {
            var labelColor;
            if(labelFont.color) {
                labelColor = labelFont.color;
            } else if(colorLines) {
                labelColor = colorMap(d.level);
            } else if(lineColorFunc) {
                labelColor = lineColorFunc(d.level);
            } else {
                labelColor = line.color;
            }
            
            Drawing.font(d3.select(this), {
                weight: labelFont.weight,
                style: labelFont.style,
                variant: labelFont.variant,
                textcase: labelFont.textcase,
                lineposition: labelFont.lineposition,
                shadow: labelFont.shadow,
                family: labelFont.family,
                size: labelFont.size,
                color: labelColor
            });
        });

        if(isConstraintType) {
            c.selectAll('g.contourfill path')
                .style('fill', trace.fillcolor);
        } else if(colorFills) {
            var firstFill;

            c.selectAll('g.contourfill path')
                .style('fill', function(d) {
                    if(firstFill === undefined) firstFill = d.level;
                    return colorMap(d.level + 0.5 * cs);
                });

            if(firstFill === undefined) firstFill = start;

            c.selectAll('g.contourbg path')
                .style('fill', colorMap(firstFill - 0.5 * cs));
        }
    });

    heatmapStyle(gd);
};
