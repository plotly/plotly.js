'use strict';

var d3 = require('@plotly/d3');

var Registry = require('../../registry');
var Lib = require('../../lib');
var Drawing = require('../../components/drawing');

module.exports = function plot(gd, plotinfo, cdscatter, scatterLayer, transitionOpts, makeOnCompleteCallback) {
    var join, onComplete;

    // If transition config is provided, then it is only a partial replot and traces not
    // updated are removed.
    var isFullReplot = !transitionOpts;
    var hasTransition = !!transitionOpts && transitionOpts.duration > 0;

    join = scatterLayer.selectAll('g.trace')
        .data(cdscatter, function(d) { return d[0].trace.uid; });

    // Append new traces:
    join.enter().append('g')
        .attr('class', function(d) {
            return 'trace scatterquiver trace' + d[0].trace.uid;
        })
        .style('stroke-miterlimit', 2);
    join.order();

    if(hasTransition) {
        if(makeOnCompleteCallback) {
            onComplete = makeOnCompleteCallback();
        }

        var transition = d3.transition()
            .duration(transitionOpts.duration)
            .ease(transitionOpts.easing)
            .each('end', function() {
                onComplete && onComplete();
            })
            .each('interrupt', function() {
                onComplete && onComplete();
            });

        transition.each(function() {
            scatterLayer.selectAll('g.trace').each(function(d, i) {
                plotOne(gd, i, plotinfo, d, cdscatter, this, transitionOpts);
            });
        });
    } else {
        join.each(function(d, i) {
            plotOne(gd, i, plotinfo, d, cdscatter, this, transitionOpts);
        });
    }

    if(isFullReplot) {
        join.exit().remove();
    }
};

function plotOne(gd, idx, plotinfo, cdscatter, cdscatterAll, element, transitionOpts) {
    var trace = cdscatter[0].trace;
    var xa = plotinfo.xaxis;
    var ya = plotinfo.yaxis;
    var fullLayout = gd._fullLayout;

    // Create line group for arrows
    var lines = d3.select(element).selectAll('g.lines')
        .data([cdscatter]);

    lines.enter().append('g')
        .classed('lines', true);

    Drawing.setClipUrl(lines, plotinfo.layerClipId, gd);

    // Create line segments for each arrow
    var lineSegments = lines.selectAll('path.js-line')
        .data(cdscatter);

    lineSegments.enter().append('path')
        .classed('js-line', true)
        .style('vector-effect', 'non-scaling-stroke');

    lineSegments.exit().remove();

    // Update line segments
    lineSegments.each(function(d) {
        var path = d3.select(this);
        var segment = d;
        
        if(segment.length === 0) return;

        // Convert data coordinates to pixel coordinates
        var pixelCoords = segment.map(function(point) {
            return {
                x: xa.c2p(point.x),
                y: ya.c2p(point.y)
            };
        });

        // Create SVG path from pixel coordinates
        var pathData = 'M' + pixelCoords[0].x + ',' + pixelCoords[0].y;
        for(var i = 1; i < pixelCoords.length; i++) {
            pathData += 'L' + pixelCoords[i].x + ',' + pixelCoords[i].y;
        }

        path.attr('d', pathData);
    });

    // Apply styling using Plotly's standard styling system
    Drawing.lineGroupStyle(lineSegments, trace.line && trace.line.width, trace.line && trace.line.color, trace.line && trace.line.dash);

    // Handle transitions
    if(transitionOpts && transitionOpts.duration > 0) {
        var transition = d3.transition()
            .duration(transitionOpts.duration)
            .ease(transitionOpts.easing);

        lineSegments.transition(transition)
            .style('opacity', 1);
    }
}