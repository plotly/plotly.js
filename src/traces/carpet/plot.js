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
var map1dArray = require('./map_1d_array');
var makepath = require('./makepath');
var orientText = require('./orient_text');
var svgTextUtils = require('../../lib/svg_text_utils');

module.exports = function plot(gd, plotinfo, cdcarpet) {
    for(var i = 0; i < cdcarpet.length; i++) {
        plotOne(gd, plotinfo, cdcarpet[i]);
    }
};

function makeg(el, type, klass) {
    var join = el.selectAll(type + '.' + klass).data([0]);
    join.enter().append(type).classed(klass, true);
    return join;
}

function plotOne(gd, plotinfo, cd) {
    var t = cd[0];
    var trace = cd[0].trace,
        xa = plotinfo.xaxis,
        ya = plotinfo.yaxis,
        aax = trace.aaxis,
        bax = trace.baxis,
        fullLayout = gd._fullLayout;

    var gridLayer = plotinfo.plot.selectAll('.carpetlayer');
    var clipLayer = makeg(fullLayout._defs, 'g', 'clips');

    var axisLayer = makeg(gridLayer, 'g', 'carpet' + trace.uid).classed('trace', true);
    var minorLayer = makeg(axisLayer, 'g', 'minorlayer');
    var majorLayer = makeg(axisLayer, 'g', 'majorlayer');
    var boundaryLayer = makeg(axisLayer, 'g', 'boundarylayer');
    var labelLayer = makeg(axisLayer, 'g', 'labellayer');

    axisLayer.style('opacity', trace.opacity);

    drawGridLines(xa, ya, majorLayer, aax, 'a', aax._gridlines, true);
    drawGridLines(xa, ya, majorLayer, bax, 'b', bax._gridlines, true);
    drawGridLines(xa, ya, minorLayer, aax, 'a', aax._minorgridlines, true);
    drawGridLines(xa, ya, minorLayer, bax, 'b', bax._minorgridlines, true);

    // NB: These are not ommitted if the lines are not active. The joins must be executed
    // in order for them to get cleaned up without a full redraw
    drawGridLines(xa, ya, boundaryLayer, aax, 'a-boundary', aax._boundarylines);
    drawGridLines(xa, ya, boundaryLayer, bax, 'b-boundary', bax._boundarylines);

    var maxAExtent = drawAxisLabels(gd, xa, ya, trace, t, labelLayer, aax._labels, 'a-label');
    var maxBExtent = drawAxisLabels(gd, xa, ya, trace, t, labelLayer, bax._labels, 'b-label');

    drawAxisTitles(gd, labelLayer, trace, t, xa, ya, maxAExtent, maxBExtent);

    drawClipPath(trace, t, clipLayer, xa, ya);
}

function drawClipPath(trace, t, layer, xaxis, yaxis) {
    var seg, xp, yp, i;

    var clip = layer.select('#' + trace._clipPathId);

    if(!clip.size()) {
        clip = layer.append('clipPath')
            .classed('carpetclip', true);
    }

    var path = makeg(clip, 'path', 'carpetboundary');
    var segments = t.clipsegments;
    var segs = [];

    for(i = 0; i < segments.length; i++) {
        seg = segments[i];
        xp = map1dArray([], seg.x, xaxis.c2p);
        yp = map1dArray([], seg.y, yaxis.c2p);
        segs.push(makepath(xp, yp, seg.bicubic));
    }

    // This could be optimized ever so slightly to avoid no-op L segments
    // at the corners, but it's so negligible that I don't think it's worth
    // the extra complexity
    var clipPathData = 'M' + segs.join('L') + 'Z';
    clip.attr('id', trace._clipPathId);
    path.attr('d', clipPathData);
}

function drawGridLines(xaxis, yaxis, layer, axis, axisLetter, gridlines) {
    var lineClass = 'const-' + axisLetter + '-lines';
    var gridJoin = layer.selectAll('.' + lineClass).data(gridlines);

    gridJoin.enter().append('path')
        .classed(lineClass, true)
        .style('vector-effect', 'non-scaling-stroke');

    gridJoin.each(function(d) {
        var gridline = d;
        var x = gridline.x;
        var y = gridline.y;

        var xp = map1dArray([], x, xaxis.c2p);
        var yp = map1dArray([], y, yaxis.c2p);

        var path = 'M' + makepath(xp, yp, gridline.smoothing);

        var el = d3.select(this);

        el.attr('d', path)
            .style('stroke-width', gridline.width)
            .style('stroke', gridline.color)
            .style('fill', 'none');
    });

    gridJoin.exit().remove();
}

function drawAxisLabels(gd, xaxis, yaxis, trace, t, layer, labels, labelClass) {
    var labelJoin = layer.selectAll('text.' + labelClass).data(labels);

    labelJoin.enter().append('text')
        .classed(labelClass, true);

    var maxExtent = 0;

    labelJoin.each(function(label) {
        // Most of the positioning is done in calc_labels. Only the parts that depend upon
        // the screen space representation of the x and y axes are here:
        var orientation;
        if(label.axis.tickangle === 'auto') {
            orientation = orientText(trace, xaxis, yaxis, label.xy, label.dxy);
        } else {
            var angle = (label.axis.tickangle + 180.0) * Math.PI / 180.0;
            orientation = orientText(trace, xaxis, yaxis, label.xy, [Math.cos(angle), Math.sin(angle)]);
        }
        var direction = (label.endAnchor ? -1 : 1) * orientation.flip;

        var labelEl = d3.select(this)
            .attr({
                'text-anchor': direction > 0 ? 'start' : 'end',
                'data-notex': 1
            })
            .call(Drawing.font, label.font)
            .text(label.text)
            .call(svgTextUtils.convertToTspans, gd);

        var bbox = Drawing.bBox(this);

        labelEl.attr('transform',
                // Translate to the correct point:
                'translate(' + orientation.p[0] + ',' + orientation.p[1] + ') ' +
                // Rotate to line up with grid line tangent:
                'rotate(' + orientation.angle + ')' +
                // Adjust the baseline and indentation:
                'translate(' + label.axis.labelpadding * direction + ',' + bbox.height * 0.3 + ')'
            );

        maxExtent = Math.max(maxExtent, bbox.width + label.axis.labelpadding);
    });

    labelJoin.exit().remove();

    return maxExtent;
}

function drawAxisTitles(gd, layer, trace, t, xa, ya, maxAExtent, maxBExtent) {
    var a, b, xy, dxy;

    a = 0.5 * (trace.a[0] + trace.a[trace.a.length - 1]);
    b = trace.b[0];
    xy = trace.ab2xy(a, b, true);
    dxy = trace.dxyda_rough(a, b);
    drawAxisTitle(gd, layer, trace, t, xy, dxy, trace.aaxis, xa, ya, maxAExtent, 'a-title');

    a = trace.a[0];
    b = 0.5 * (trace.b[0] + trace.b[trace.b.length - 1]);
    xy = trace.ab2xy(a, b, true);
    dxy = trace.dxydb_rough(a, b);
    drawAxisTitle(gd, layer, trace, t, xy, dxy, trace.baxis, xa, ya, maxBExtent, 'b-title');
}

function drawAxisTitle(gd, layer, trace, t, xy, dxy, axis, xa, ya, offset, labelClass) {
    var data = [];
    if(axis.title) data.push(axis.title);
    var titleJoin = layer.selectAll('text.' + labelClass).data(data);

    titleJoin.enter().append('text')
        .classed(labelClass, true);

    // There's only one, but we'll do it as a join so it's updated nicely:
    titleJoin.each(function() {
        var orientation = orientText(trace, xa, ya, xy, dxy);

        if(['start', 'both'].indexOf(axis.showticklabels) === -1) {
            offset = 0;
        }

        // In addition to the size of the labels, add on some extra padding:
        offset += axis.titlefont.size + axis.titleoffset;


        var el = d3.select(this);

        el.text(axis.title || '')
            .call(svgTextUtils.convertToTspans, gd)
            .attr('transform',
                'translate(' + orientation.p[0] + ',' + orientation.p[1] + ') ' +
                'rotate(' + orientation.angle + ') ' +
                'translate(0,' + offset + ')'
            )
            .classed('user-select-none', true)
            .attr('text-anchor', 'middle')
            .call(Drawing.font, axis.titlefont);
    });

    titleJoin.exit().remove();
}
