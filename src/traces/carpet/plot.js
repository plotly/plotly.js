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

    drawAxisLabels(xa, ya, trace, labelLayer, aax._labels, 'a-label');
    drawAxisLabels(xa, ya, trace, labelLayer, bax._labels, 'b-label');

    // Swap for debugging in order to draw directly:
    // drawClipPath(trace, gridLayer, xa, ya);
    drawClipPath(trace, clipLayer, xa, ya);
}

function drawClipPath(trace, layer, xaxis, yaxis) {
    var seg, xp, yp, i;
    // var clip = makeg(layer, 'g', 'carpetclip');
    var clip = makeg(layer, 'clipPath', 'carpetclip');
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
    trace.clipPathId = 'clip' + trace.uid + 'carpet';
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

function drawAxisLabels(xaxis, yaxis, trace, layer, labels, labelClass) {
    var labelJoin = layer.selectAll('text.' + labelClass).data(labels);

    labelJoin.enter().append('text')
        .classed(labelClass, true);

    labelJoin.each(function(label) {
        // The rest of the calculation is in calc_labels. Only the parts that depend upon
        // the screen space representation of the x and y axes are here:
        //
        // Compute the direction of the labels in pixel coordinates:
        var dx = label.dxy[0] * trace.dpdx(xaxis);
        var dy = label.dxy[1] * trace.dpdy(yaxis);

        // Compute the angle and adjust so that the labels are always upright
        // and the anchor is on the correct side:
        var angle = Math.atan2(dy, dx) * 180 / Math.PI;
        var endAnchor = label.endAnchor;
        if(angle < -90) {
            angle += 180;
            endAnchor = !endAnchor;
        } else if(angle > 90) {
            angle -= 180;
            endAnchor = !endAnchor;
        }

        // Compute the position in pixel coordinates
        var xy = trace.c2p(label.xy, xaxis, yaxis);

        d3.select(this).attr('x', xy[0] + label.axis.labelpadding * (endAnchor ? -1 : 1))
            .attr('y', xy[1] + label.font.size * 0.3)
            .attr('text-anchor', endAnchor ? 'end' : 'start')
            .text(label.text)
            .attr('transform', 'rotate(' + angle + ' ' + xy[0] + ',' + xy[1] + ')')
            .call(Drawing.font, label.font.family, label.font.size, label.font.color);
    });

    labelJoin.exit().remove();
}
