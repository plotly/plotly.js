'use strict';

var d3 = require('@plotly/d3');

var Lib = require('../../lib');
var Drawing = require('../../components/drawing');
var Colorscale = require('../../components/colorscale');

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

    // Precompute norms for sizing
    var uArr = trace.u || [];
    var vArr = trace.v || [];
    var maxNorm = 0;
    for(var ni = 0; ni < trace._length; ni++) {
        var uu = uArr[ni] || 0;
        var vv = vArr[ni] || 0;
        var nrm = Math.sqrt(uu * uu + vv * vv);
        if(nrm > maxNorm) maxNorm = nrm;
    }
    var sizemode = trace.sizemode || 'scaled';
    var sizeref = (trace.sizeref !== undefined) ? trace.sizeref : (sizemode === 'raw' ? 1 : 0.5);
    var anchor = trace.anchor || 'tail';

    // Update line segments
    lineSegments.each(function(cdi) {
        var path = d3.select(this);

        // Skip invalid points
        if(cdi.x === undefined || cdi.y === undefined) {
            path.attr('d', null);
            return;
        }

        // Compute arrow in data space
        // Derive pixel-per-data scaling from axes at this point
        var pxPerX = Math.abs(xa.c2p(cdi.x + 1) - xa.c2p(cdi.x));
        var pxPerY = Math.abs(ya.c2p(cdi.y + 1) - ya.c2p(cdi.y));
        var scaleRatio = (pxPerX && pxPerY) ? (pxPerY / pxPerX) : 1;
        var baseHeadScale = 0.2;
        var arrowScale = (trace.arrowsize !== undefined)
            ? (baseHeadScale * trace.arrowsize)
            : (trace.arrow_scale !== undefined ? trace.arrow_scale : baseHeadScale);
        // Fixed arrowhead wedge angle (radians).
        // Arrow direction is fully determined by u,v (see barbAng below);
        // this constant only controls the opening of the head.
        var headAngle = Math.PI / 12;

        var u = (trace.u && trace.u[cdi.i]) || 0;
        var v = (trace.v && trace.v[cdi.i]) || 0;

        var norm = Math.sqrt(u * u + v * v);
        var unitx = norm ? (u / norm) : 0;
        var unity = norm ? (v / norm) : 0;
        var baseLen;
        if(sizemode === 'scaled') {
            var n = maxNorm ? (norm / maxNorm) : 0;
            baseLen = n * sizeref;
        } else {
            baseLen = norm * sizeref;
        }

        var dxBase = unitx * baseLen;
        var dyBase = unity * baseLen;
        var dx = dxBase * scaleRatio;
        var dy = dyBase;
        var barbLen = Math.sqrt((dx * dx) / scaleRatio + dy * dy);
        var arrowLen = barbLen * arrowScale;
        var barbAng = Math.atan2(dy, dx / scaleRatio);

        var ang1 = barbAng + headAngle;
        var ang2 = barbAng - headAngle;

        var x0, y0, x1, y1;
        if(anchor === 'tip') {
            x1 = cdi.x;
            y1 = cdi.y;
            x0 = x1 - dx;
            y0 = y1 - dy;
        } else if(anchor === 'cm' || anchor === 'center' || anchor === 'middle') {
            x0 = cdi.x - dx / 2;
            y0 = cdi.y - dy / 2;
            x1 = cdi.x + dx / 2;
            y1 = cdi.y + dy / 2;
        } else { // tail
            x0 = cdi.x;
            y0 = cdi.y;
            x1 = x0 + dx;
            y1 = y0 + dy;
        }

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

    // If colorscale present, color arrows by magnitude |(u,v)|
    if(trace._hasColorscale) {
        var colorFunc = Colorscale.makeColorScaleFuncFromTrace(trace);
        lineSegments.style('stroke', function(cdi) {
            var cArr = trace.c;
            var value;
            if(Lib.isArrayOrTypedArray(cArr) && cArr.length > cdi.i && isFinite(cArr[cdi.i])) {
                value = cArr[cdi.i];
            } else {
                var uVal = (trace.u && trace.u[cdi.i]) || 0;
                var vVal = (trace.v && trace.v[cdi.i]) || 0;
                value = Math.sqrt(uVal * uVal + vVal * vVal);
            }
            return colorFunc(value);
        });
    }

    // Handle transitions
    if(transitionOpts && transitionOpts.duration > 0) {
        var transition = d3.transition()
            .duration(transitionOpts.duration)
            .ease(transitionOpts.easing);

        lineSegments.transition(transition)
            .style('opacity', 1);
    }
}
