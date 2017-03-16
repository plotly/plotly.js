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
var measureText = require('./measure_text');

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
    var trace = cd[0].trace,
        xa = plotinfo.xaxis,
        ya = plotinfo.yaxis,
        aax = trace.aaxis,
        bax = trace.baxis,
        fullLayout = gd._fullLayout;
        // uid = trace.uid,
        // id = 'carpet' + uid;

    // var x = cd[0].x;
    // var y = cd[0].y;
    // var a = cd[0].a;
    // var b = cd[0].b;

    // XXX: Layer choice??
    var gridLayer = plotinfo.plot.selectAll('.barlayer');
    var clipLayer = makeg(fullLayout._defs, 'g', 'clips');

    var minorLayer = makeg(gridLayer, 'g', 'minorlayer');
    var majorLayer = makeg(gridLayer, 'g', 'majorlayer');
    var boundaryLayer = makeg(gridLayer, 'g', 'boundarylayer');
    var labelLayer = makeg(gridLayer, 'g', 'labellayer');

    drawGridLines(xa, ya, majorLayer, aax, 'a', aax._gridlines, true);
    drawGridLines(xa, ya, majorLayer, bax, 'b', bax._gridlines, true);
    drawGridLines(xa, ya, minorLayer, aax, 'a', aax._minorgridlines, true);
    drawGridLines(xa, ya, minorLayer, bax, 'b', bax._minorgridlines, true);

    // NB: These are not ommitted if the lines are not active. The joins must be executed
    // in order for them to get cleaned up without a full redraw
    drawGridLines(xa, ya, boundaryLayer, aax, 'a-boundary', aax._boundarylines);
    drawGridLines(xa, ya, boundaryLayer, bax, 'b-boundary', bax._boundarylines);

    var maxAExtent = drawAxisLabels(gd._tester, xa, ya, trace, labelLayer, aax._labels, 'a-label');
    var maxBExtent = drawAxisLabels(gd._tester, xa, ya, trace, labelLayer, bax._labels, 'b-label');

    drawAxisTitles(labelLayer, trace, xa, ya, maxAExtent, maxBExtent);

    // Swap for debugging in order to draw directly:
    // drawClipPath(trace, gridLayer, xa, ya);
    drawClipPath(trace, clipLayer, xa, ya);
}

function drawClipPath(trace, layer, xaxis, yaxis) {
    var seg, xp, yp, i;
    // var clip = makeg(layer, 'g', 'carpetclip');
    trace.clipPathId = 'clip' + trace.uid + 'carpet';

    var clip = layer.select('#' + trace.clipPathId);

    if(!clip.size()) {
        clip = layer.append('clipPath')
            .classed('carpetclip', true);
    }

    var path = makeg(clip, 'path', 'carpetboundary');
    var segments = trace._clipsegments;
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
    trace.clipPathData = 'M' + segs.join('L') + 'Z';
    clip.attr('id', trace.clipPathId);
    path.attr('d', trace.clipPathData);
        // .style('stroke-width', 20)
        // .style('vector-effect', 'non-scaling-stroke')
        // .style('stroke', 'black')
        // .style('fill', 'rgba(0, 0, 0, 0.1)');
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

function drawAxisLabels(tester, xaxis, yaxis, trace, layer, labels, labelClass) {
    var labelJoin = layer.selectAll('text.' + labelClass).data(labels);

    labelJoin.enter().append('text')
        .classed(labelClass, true);

    var maxExtent = 0;

    labelJoin.each(function(label) {
        // Most of the positioning is done in calc_labels. Only the parts that depend upon
        // the screen space representation of the x and y axes are here:
        var orientation = orientText(trace, xaxis, yaxis, label.xy, label.dxy);
        var direction = (label.endAnchor ? -1 : 1) * orientation.flip;
        var bbox = measureText(tester, label.text, label.font);

        d3.select(this)
            .attr('text-anchor', direction > 0 ? 'start' : 'end')
            .text(label.text)
            .attr('transform',
                // Translate to the correct point:
                'translate(' + orientation.p[0] + ',' + orientation.p[1] + ') ' +
                // Rotate to line up with grid line tangent:
                'rotate(' + orientation.angle + ')' +
                // Adjust the baseline and indentation:
                'translate(' + label.axis.labelpadding * direction + ',' + bbox.height * 0.3 + ')'
            )
            .call(Drawing.font, label.font.family, label.font.size, label.font.color);

        maxExtent = Math.max(maxExtent, bbox.width + label.axis.labelpadding);
    });

    labelJoin.exit().remove();

    return maxExtent;
}

function drawAxisTitles(layer, trace, xa, ya, maxAExtent, maxBExtent) {
    var a, b, xy, dxy;

    a = 0.5 * (trace.a[0] + trace.a[trace.a.length - 1]);
    b = trace.b[0];
    xy = trace.ab2xy(a, b, true);
    dxy = trace.dxyda_rough(a, b);
    drawAxisTitle(layer, trace, xy, dxy, trace.aaxis, xa, ya, maxAExtent, 'a-title');

    a = trace.a[0];
    b = 0.5 * (trace.b[0] + trace.b[trace.b.length - 1]);
    xy = trace.ab2xy(a, b, true);
    dxy = trace.dxydb_rough(a, b);
    drawAxisTitle(layer, trace, xy, dxy, trace.baxis, xa, ya, maxBExtent, 'b-title');
}

function drawAxisTitle(layer, trace, xy, dxy, axis, xa, ya, offset, labelClass) {
    var titleJoin = layer.selectAll('text.' + labelClass).data([0]);

    titleJoin.enter().append('text')
        .classed(labelClass, true);

    var orientation = orientText(trace, xa, ya, xy, dxy);

    // In addition to the size of the labels, add on some extra padding:
    offset += axis.titlefont.size + axis.titleoffset;

    // There's only one, but we'll do it as a join so it's updated nicely:
    titleJoin.each(function() {
        var el = d3.select(this);

        el.text(axis.title)
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
