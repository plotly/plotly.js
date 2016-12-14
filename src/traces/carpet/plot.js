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
        // uid = trace.uid,
        xa = plotinfo.xaxis,
        ya = plotinfo.yaxis,
        aax = trace.aaxis,
        bax = trace.baxis;
        // id = 'carpet' + uid;

    var x = cd[0].x;
    var y = cd[0].y;
    var a = cd[0].a;
    var b = cd[0].b;

    // XXX: Layer choice??
    var gridLayer = plotinfo.plot.selectAll('.maplayer');

    var minorLayer = makeg(gridLayer, 'g', 'minorlayer');
    var majorLayer = makeg(gridLayer, 'g', 'majorlayer');
    var boundaryLayer = makeg(gridLayer, 'g', 'boundarylayer');
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
}

function drawGridLines(xaxis, yaxis, layer, axis, axisLetter, gridlines) {
    var lineClass = 'const-' + axisLetter + '-lines';
    var gridjoin = layer.selectAll('.' + lineClass).data(gridlines);

    gridjoin.enter().append('path')
        .classed(lineClass, true)
        .style('vector-effect', 'non-scaling-stroke');

    gridjoin.each(function(d, i) {
        var gridline = d;
        var axis = gridline.axis;
        var x = gridline.x;
        var y = gridline.y;

        var xp = map1dArray([], x, xaxis.c2p);
        var yp = map1dArray([], y, yaxis.c2p);

        var d = makepath(xp, yp, gridline.smoothing);

        var el = d3.select(this);
        el.attr('d', d)
            .style('stroke-width', gridline.width)
            .style('stroke', gridline.color)
            .style('fill', 'none');
    })
    .exit().remove();
}

function drawAxisLabels(xaxis, yaxis, layer, gridLines, side) {
    gridjoin.enter().append('path')
        .classed(lineClass, true)
        .style('vector-effect', 'non-scaling-stroke');

    var width = isMajor ? axis.gridwidth : axis.minorgridwidth;
    var color = isMajor ? axis.gridcolor : axis.minorgridcolor;

    gridjoin.each(function(d, i) {
        var gridline = d;
        var axis = gridline.axis;
        var x = gridline.x;
        var y = gridline.y;

        var xp = map1dArray([], x, xaxis.c2p);
        var yp = map1dArray([], y, yaxis.c2p);

        var d = makepath(xp, yp, gridline.smoothing);

        var el = d3.select(this);
        el.attr('d', d)
            .style('stroke-width', width)
            .style('stroke', color)
            .style('fill', 'none');
    })
    .exit().remove();



    return;
    // We'll differentiate the screen-space coordinates to get the orientation of labels:
    var ax = ls.ax;

    // Check whether labels are active for this set:
    var active = [side === 'lo' ? 'start' : 'end', 'both'].indexOf(ax.showlabels) !== -1;

    // *Always* do the join. Otherwise labels can't disappear without a total replot
    var joinData = active ? ax._majorIndices : [];

    var labelClass = ls.baseClass + '-axis-labels-' + side;
    var labelJoin = layer.selectAll('text.' + labelClass).data(joinData);

    labelJoin.enter().append('text')
        .classed(labelClass, true);

    var idx0 = side === 'lo' ? 0 : ls.n - 1;
    var idx1 = side === 'lo' ? 1 : ls.n - 2;

    labelJoin.each(function(d, i) {
        var lineIdx = ax._majorIndices[i];

        var el = d3.select(this);

        var prefix;
        switch(ax.showlabelprefix) {
            case 'first':
                prefix = i === 0 ? ax.labelprefix : '';
                break;
            case 'all':
                prefix = ax.labelprefix;
                break;
            case 'last':
                prefix = i === ax._majorIndices.length - 1 ? ax.labelprefix : '';
                break;
        }

        var suffix;
        switch(ax.showlabelsuffix) {
            case 'first':
                suffix = i === 0 ? ax.labelsuffix : '';
                break;
            case 'all':
                suffix = ax.labelsuffix;
                break;
            case 'last':
                suffix = i === ax._majorIndices.length - 1 ? ax.labelsuffix : '';
                break;
        }

        var x0 = ls.xc(lineIdx, idx0);
        var x1 = ls.xc(lineIdx, idx1);
        var y0 = ls.yc(lineIdx, idx0);
        var y1 = ls.yc(lineIdx, idx1);

        var dx = x1 - x0;
        var dy = y1 - y0;
        var l = Math.sqrt(dx * dx + dy * dy);
        dx /= l;
        dy /= l;

        var angle = Math.atan2(dy, dx) * 180 / Math.PI;
        var endAnchor = true;
        if(angle < -90) {
            angle += 180;
            endAnchor = !endAnchor;
        } else if(angle > 90) {
            angle -= 180;
            endAnchor = !endAnchor;
        }

        // XXX: Use existing text functions
        el.attr('x', x0 + ax.labelpadding * (endAnchor ? -1 : 1)) // These are pre-transform offsets
            .attr('y', y0 + 5) // Shift down to hackily vertically center
            .attr('text-anchor', endAnchor ? 'end' : 'start')
            .text(prefix + ls.data[lineIdx].toFixed(3) + suffix)
            .attr('transform', 'rotate(' + angle + ' ' + x0 + ',' + y0 + ')')
            .call(Drawing.font, ax.labelfont.family, ax.labelfont.size, ax.labelfont.color);
    });

    labelJoin.exit().remove();
}
