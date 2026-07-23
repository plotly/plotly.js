'use strict';

var d3 = require('@plotly/d3');

var Lib = require('../../lib');
var Drawing = require('../../components/drawing');
var colorscaleStroke = require('./style').colorscaleStroke;

// Fixed arrowhead wedge angle (radians). Arrow direction is fully
// determined by u,v (see angPx below); this constant only controls the
// relative angle of the point of the arrowhead
const HEAD_ANGLE = Math.PI / 12;

// Length (px) of each arrowhead arm per unit of marker.line.width at
// arrowsize = 1. With the head's half-angle of PI/12, this yields an opening
// roughly 3x the line width, matching the `marker.arrowsize` spec
const HEAD_LEN_PER_WIDTH = 5.8;

// Minimum line width value used when calculating arrowhead size, to ensure
// arrowhead is visible at narrow line widths. This minimum is ignored when
// `arrowsize` is set manually
const MIN_LINE_WIDTH_FOR_ARROWSIZE = 1.5;

// Max arrowhead length as a fraction of the body length, so the head stays
// slightly shorter than the body for very short arrows
const MAX_HEAD_FRAC = 0.7;

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
            return 'trace quiver trace' + d[0].trace.uid;
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

    cdscatter[0][plotinfo.isRangePlot ? 'nodeRangePlot3' : 'node3'] = d3.select(element);

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

    // Use maxNorm precomputed in calc
    const maxNorm = trace._maxNorm || 0;
    const anglemode = trace.anglemode;
    const sizemode = trace.sizemode;
    const sizeref = trace.sizeref;
    const anchor = trace.anchor;

    // Adjust scale factor if anglemode is 'paper'
    const scaleFactor = (anglemode === 'paper') ? trace._scaleFactor * Math.sqrt(Math.abs(xa._m * ya._m)) : trace._scaleFactor;
    const markerArrowsize = trace.marker.arrowsize;

    // Update line segments
    lineSegments.each(function(cdi) {
        const path = d3.select(this);

        // Skip invalid points
        if(cdi.x === undefined || cdi.y === undefined) {
            path.attr('d', null);
            return;
        }

        // Compute pixel location of vector tip, *relative to* vector base (before scaling).
        // If anglemode is 'paper', then u/v are interpreted in pixel coordinates, so we can use them directly.
        // If anglemode is 'data', then u/v are interpreted in data coordinates, so we need to convert them to pixel coordinates.
        // TODO: This probably doesn't work for log axes, but let's ignore log axes for now
        // since I'm not sure they make sense for quiver plots anyway
        const pu = ((anglemode === 'paper') ? cdi._u * Math.sign(xa._m) : d3.round(xa._m * cdi._u)) * scaleFactor;
        const pv = ((anglemode === 'paper') ? cdi._v * Math.sign(ya._m) : d3.round(ya._m * cdi._v)) * scaleFactor;

        // Compute arrow in data space
        // Check whether arrowsize was set explicitly in the input trace
        const hasExplicitArrowsize = (trace._input.marker || {}).arrowsize !== undefined;

        var px0, px1, py0, py1;
        if(anchor === 'tip') {
            px0 = xa.c2p(cdi.x) - pu;
            py0 = ya.c2p(cdi.y) - pv;
            px1 = xa.c2p(cdi.x);
            py1 = ya.c2p(cdi.y);
        } else if(anchor === 'center') {
            px0 = xa.c2p(cdi.x) - pu / 2;
            py0 = ya.c2p(cdi.y) - pv / 2;
            px1 = xa.c2p(cdi.x) + pu / 2;
            py1 = ya.c2p(cdi.y) + pv / 2;
        } else { // tail
            px0 = xa.c2p(cdi.x);
            py0 = ya.c2p(cdi.y);
            px1 = xa.c2p(cdi.x) + pu;
            py1 = ya.c2p(cdi.y) + pv;
        }

        // Store the arrow body endpoints in calcData so that
        // hovertext can be shown based on distance to the whole arrow segment,
        // not just the base point (x,y)
        cdi._px0 = px0;
        cdi._py0 = py0;
        cdi._px1 = px1;
        cdi._py1 = py1;

        // Arrowhead is sized in pixels (relative to the line width)
        // so it remains the same regardless of zoom, rather than scaling with the data space
        // Set max head size so the head stays slightly shorter than the arrow body
        // (e.g. for very short arrows when zoomed out). No head for zero-length arrows.
        var lineWidthForArrowsize = trace.marker.line.width;
        // If arrowsize is not set explicitly, increase line width for arrowsize calculations
        // to a minimum value, in order to avoid very small arrowheads
        if(!hasExplicitArrowsize) lineWidthForArrowsize = Math.max(lineWidthForArrowsize, MIN_LINE_WIDTH_FOR_ARROWSIZE);

        const bodyLenPx = Math.sqrt((px1 - px0) * (px1 - px0) + (py1 - py0) * (py1 - py0));
        const maxHeadPx = MAX_HEAD_FRAC * bodyLenPx;
        const headLenPx = Math.min(HEAD_LEN_PER_WIDTH * markerArrowsize * lineWidthForArrowsize, maxHeadPx);
        const angPx = Math.atan2(py1 - py0, px1 - px0);

        const ph1x = px1 - headLenPx * Math.cos(angPx - HEAD_ANGLE);
        const ph1y = py1 - headLenPx * Math.sin(angPx - HEAD_ANGLE);
        const ph2x = px1 - headLenPx * Math.cos(angPx + HEAD_ANGLE);
        const ph2y = py1 - headLenPx * Math.sin(angPx + HEAD_ANGLE);

        const pathData = 'M' + px0 + ',' + py0 + 'L' + px1 + ',' + py1 + 'L' + ph1x + ',' + ph1y + 'L' + px1 + ',' + py1 + 'L' + ph2x + ',' + ph2y;
        path.attr('d', pathData);
    });

    // Apply styling using Plotly's standard styling system
    var marker = trace.marker || {};
    var markerLine = marker.line || {};
    var lineColor = Lib.isArrayOrTypedArray(marker.color) ? undefined : marker.color;
    Drawing.lineGroupStyle(lineSegments, markerLine.width, lineColor, markerLine.dash);

    // If colorscale present, color arrows by marker.color or magnitude |(u,v)|.
    // Shared with style.js so the static render and restyle stay in sync.
    if(trace._hasColorscale) colorscaleStroke(lineSegments, trace);

    // Render text labels at data points
    var textGroup = d3.select(element).selectAll('g.text')
        .data([cdscatter]);

    textGroup.enter().append('g').classed('text', true);

    Drawing.setClipUrl(textGroup, plotinfo.layerClipId, gd);

    var textJoin = textGroup.selectAll('g.textpoint')
        .data(cdscatter);

    textJoin.enter().append('g').classed('textpoint', true).append('text');
    textJoin.exit().remove();

    textJoin.each(function(d) {
        var g = d3.select(this);
        var hasNode = Drawing.translatePoint(d, g.select('text'), xa, ya);
        if(!hasNode) g.remove();
    });

    textJoin.selectAll('text')
        .call(Drawing.textPointStyle, trace, gd)
        .each(function(d) {
            var x = xa.c2p(d.x);
            var y = ya.c2p(d.y);
            d3.select(this).selectAll('tspan.line').each(function() {
                d3.select(this).attr({x: x, y: y});
            });
        });

    // Handle transitions
    if(transitionOpts && transitionOpts.duration > 0) {
        var transition = d3.transition()
            .duration(transitionOpts.duration)
            .ease(transitionOpts.easing);

        lineSegments.transition(transition)
            .style('opacity', 1);
    }
}
