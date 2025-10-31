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

    // Create one path per data point (arrow)
    var lineSegments = lines.selectAll('path.js-line')
        .data(cdscatter);

    lineSegments.enter().append('path')
        .classed('js-line', true)
        .style('vector-effect', 'non-scaling-stroke');

    lineSegments.exit().remove();

    // Update line segments
    lineSegments.each(function(cdi) {
        var path = d3.select(this);

        // Skip invalid points
        if(cdi.x === undefined || cdi.y === undefined) {
            path.attr('d', null);
            return;
        }

        // Compute arrow in data space
        var scale = trace.scale || 1;
        var scaleRatio = trace.scaleratio || 1;
        var arrowScale = trace.arrow_scale || 0.2;
        var angle = trace.angle || Math.PI / 12; // small default

        var u = (trace.u && trace.u[cdi.i]) || 0;
        var v = (trace.v && trace.v[cdi.i]) || 0;

        var dx = u * scale * scaleRatio;
        var dy = v * scale;
        var barbLen = Math.sqrt((dx * dx) / scaleRatio + dy * dy);
        var arrowLen = barbLen * arrowScale;
        var barbAng = Math.atan2(dy, dx / scaleRatio);

        var ang1 = barbAng + angle;
        var ang2 = barbAng - angle;

        var x0 = cdi.x;
        var y0 = cdi.y;
        var x1 = x0 + dx;
        var y1 = y0 + dy;

        var xh1 = x1 - arrowLen * Math.cos(ang1) * scaleRatio;
        var yh1 = y1 - arrowLen * Math.sin(ang1);
        var xh2 = x1 - arrowLen * Math.cos(ang2) * scaleRatio;
        var yh2 = y1 - arrowLen * Math.sin(ang2);

        // Convert to pixels
        var p0x = xa.c2p(x0);
        var p0y = ya.c2p(y0);
        var p1x = xa.c2p(x1);
        var p1y = ya.c2p(y1);
        var ph1x = xa.c2p(xh1);
        var ph1y = ya.c2p(yh1);
        var ph2x = xa.c2p(xh2);
        var ph2y = ya.c2p(yh2);

        var pathData = 'M' + p0x + ',' + p0y + 'L' + p1x + ',' + p1y + 'L' + ph1x + ',' + ph1y + 'L' + p1x + ',' + p1y + 'L' + ph2x + ',' + ph2y;
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