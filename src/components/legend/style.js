/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var Registry = require('../../registry');
var Lib = require('../../lib');
var Drawing = require('../drawing');
var Color = require('../color');

var subTypes = require('../../traces/scatter/subtypes');
var stylePie = require('../../traces/pie/style_one');

module.exports = function style(s, gd) {
    s.each(function(d) {
        var traceGroup = d3.select(this);

        var layers = Lib.ensureSingle(traceGroup, 'g', 'layers');
        layers.style('opacity', d[0].trace.opacity);

        // Marker vertical alignment
        var valignFactor = 0;
        if(gd._fullLayout.legend.valign === 'top') valignFactor = 1.0;
        if(gd._fullLayout.legend.valign === 'bottom') valignFactor = -1.0;
        var markerOffsetY = valignFactor * (0.5 * (d[0].lineHeight - d[0].height + 3));
        if(markerOffsetY) layers.attr('transform', 'translate(0,' + markerOffsetY + ')');

        var fill = layers
            .selectAll('g.legendfill')
                .data([d]);
        fill.enter().append('g')
            .classed('legendfill', true);

        var line = layers
            .selectAll('g.legendlines')
                .data([d]);
        line.enter().append('g')
            .classed('legendlines', true);

        var symbol = layers
            .selectAll('g.legendsymbols')
                .data([d]);
        symbol.enter().append('g')
            .classed('legendsymbols', true);

        symbol.selectAll('g.legendpoints')
            .data([d])
          .enter().append('g')
            .classed('legendpoints', true);
    })
    .each(styleBars)
    .each(styleBoxes)
    .each(stylePies)
    .each(styleLines)
    .each(stylePoints)
    .each(styleCandles)
    .each(styleOHLC);

    function styleLines(d) {
        var trace = d[0].trace;
        var showFill = trace.visible && trace.fill && trace.fill !== 'none';
        var showLine = subTypes.hasLines(trace);
        var contours = trace.contours;
        var showGradientLine = false;
        var showGradientFill = false;

        if(contours) {
            var coloring = contours.coloring;

            if(coloring === 'lines') {
                showGradientLine = true;
            }
            else {
                showLine = coloring === 'none' || coloring === 'heatmap' ||
                    contours.showlines;
            }

            if(contours.type === 'constraint') {
                showFill = contours._operation !== '=';
            }
            else if(coloring === 'fill' || coloring === 'heatmap') {
                showGradientFill = true;
            }
        }

        // with fill and no markers or text, move the line and fill up a bit
        // so it's more centered
        var markersOrText = subTypes.hasMarkers(trace) || subTypes.hasText(trace);
        var anyFill = showFill || showGradientFill;
        var anyLine = showLine || showGradientLine;
        var pathStart = (markersOrText || !anyFill) ? 'M5,0' :
            // with a line leave it slightly below center, to leave room for the
            // line thickness and because the line is usually more prominent
            anyLine ? 'M5,-2' : 'M5,-3';

        var this3 = d3.select(this);

        var fill = this3.select('.legendfill').selectAll('path')
            .data(showFill || showGradientFill ? [d] : []);
        fill.enter().append('path').classed('js-fill', true);
        fill.exit().remove();
        fill.attr('d', pathStart + 'h30v6h-30z')
            .call(showFill ? Drawing.fillGroupStyle : fillGradient);

        var line = this3.select('.legendlines').selectAll('path')
            .data(showLine || showGradientLine ? [d] : []);
        line.enter().append('path').classed('js-line', true);
        line.exit().remove();

        // this is ugly... but you can't apply a gradient to a perfectly
        // horizontal or vertical line. Presumably because then
        // the system doesn't know how to scale vertical variation, even
        // though there *is* no vertical variation in this case.
        // so add an invisibly small angle to the line
        // This issue (and workaround) exist across (Mac) Chrome, FF, and Safari
        line.attr('d', pathStart + (showGradientLine ? 'l30,0.0001' : 'h30'))
            .call(showLine ? Drawing.lineGroupStyle : lineGradient);

        function fillGradient(s) {
            if(s.size()) {
                var gradientID = 'legendfill-' + trace.uid;
                Drawing.gradient(s, gd, gradientID, 'horizontalreversed',
                    trace.colorscale, 'fill');
            }
        }

        function lineGradient(s) {
            if(s.size()) {
                var gradientID = 'legendline-' + trace.uid;
                Drawing.lineGroupStyle(s);
                Drawing.gradient(s, gd, gradientID, 'horizontalreversed',
                    trace.colorscale, 'stroke');
            }
        }

    }

    function stylePoints(d) {
        var d0 = d[0];
        var trace = d0.trace;
        var showMarkers = subTypes.hasMarkers(trace);
        var showText = subTypes.hasText(trace);
        var showLines = subTypes.hasLines(trace);
        var dMod, tMod;

        // 'scatter3d' don't use gd.calcdata,
        // use d0.trace to infer arrayOk attributes

        function boundVal(attrIn, arrayToValFn, bounds) {
            var valIn = Lib.nestedProperty(trace, attrIn).get();
            var valToBound = (Lib.isArrayOrTypedArray(valIn) && arrayToValFn) ?
                arrayToValFn(valIn) :
                valIn;

            if(bounds) {
                if(valToBound < bounds[0]) return bounds[0];
                else if(valToBound > bounds[1]) return bounds[1];
            }
            return valToBound;
        }

        function pickFirst(array) { return array[0]; }

        // constrain text, markers, etc so they'll fit on the legend
        if(showMarkers || showText || showLines) {
            var dEdit = {};
            var tEdit = {};

            if(showMarkers) {
                dEdit.mc = boundVal('marker.color', pickFirst);
                dEdit.mx = boundVal('marker.symbol', pickFirst);
                dEdit.mo = boundVal('marker.opacity', Lib.mean, [0.2, 1]);
                dEdit.mlc = boundVal('marker.line.color', pickFirst);
                dEdit.mlw = boundVal('marker.line.width', Lib.mean, [0, 5]);
                tEdit.marker = {
                    sizeref: 1,
                    sizemin: 1,
                    sizemode: 'diameter'
                };

                var ms = boundVal('marker.size', Lib.mean, [2, 16]);
                dEdit.ms = ms;
                tEdit.marker.size = ms;
            }

            if(showLines) {
                tEdit.line = {
                    width: boundVal('line.width', pickFirst, [0, 10])
                };
            }

            if(showText) {
                dEdit.tx = 'Aa';
                dEdit.tp = boundVal('textposition', pickFirst);
                dEdit.ts = 10;
                dEdit.tc = boundVal('textfont.color', pickFirst);
                dEdit.tf = boundVal('textfont.family', pickFirst);
            }

            dMod = [Lib.minExtend(d0, dEdit)];
            tMod = Lib.minExtend(trace, tEdit);

            // always show legend items in base state
            tMod.selectedpoints = null;
        }

        var ptgroup = d3.select(this).select('g.legendpoints');

        var pts = ptgroup.selectAll('path.scatterpts')
            .data(showMarkers ? dMod : []);
        // make sure marker is on the bottom, in case it enters after text
        pts.enter().insert('path', ':first-child')
            .classed('scatterpts', true)
            .attr('transform', 'translate(20,0)');
        pts.exit().remove();
        pts.call(Drawing.pointStyle, tMod, gd);

        // 'mrc' is set in pointStyle and used in textPointStyle:
        // constrain it here
        if(showMarkers) dMod[0].mrc = 3;

        var txt = ptgroup.selectAll('g.pointtext')
            .data(showText ? dMod : []);
        txt.enter()
            .append('g').classed('pointtext', true)
                .append('text').attr('transform', 'translate(20,0)');
        txt.exit().remove();
        txt.selectAll('text').call(Drawing.textPointStyle, tMod, gd);
    }

    function styleBars(d) {
        var trace = d[0].trace,
            marker = trace.marker || {},
            markerLine = marker.line || {},
            barpath = d3.select(this).select('g.legendpoints')
                .selectAll('path.legendbar')
                .data(Registry.traceIs(trace, 'bar') ? [d] : []);
        barpath.enter().append('path').classed('legendbar', true)
            .attr('d', 'M6,6H-6V-6H6Z')
            .attr('transform', 'translate(20,0)');
        barpath.exit().remove();
        barpath.each(function(d) {
            var p = d3.select(this),
                d0 = d[0],
                w = (d0.mlw + 1 || markerLine.width + 1) - 1;

            p.style('stroke-width', w + 'px')
                .call(Color.fill, d0.mc || marker.color);

            if(w) {
                p.call(Color.stroke, d0.mlc || markerLine.color);
            }
        });
    }

    function styleBoxes(d) {
        var trace = d[0].trace,
            pts = d3.select(this).select('g.legendpoints')
                .selectAll('path.legendbox')
                .data(Registry.traceIs(trace, 'box-violin') && trace.visible ? [d] : []);
        pts.enter().append('path').classed('legendbox', true)
            // if we want the median bar, prepend M6,0H-6
            .attr('d', 'M6,6H-6V-6H6Z')
            .attr('transform', 'translate(20,0)');
        pts.exit().remove();
        pts.each(function() {
            var w = trace.line.width,
                p = d3.select(this);

            p.style('stroke-width', w + 'px')
                .call(Color.fill, trace.fillcolor);

            if(w) {
                Color.stroke(p, trace.line.color);
            }
        });
    }

    function styleCandles(d) {
        var trace = d[0].trace,
            pts = d3.select(this).select('g.legendpoints')
                .selectAll('path.legendcandle')
                .data(trace.type === 'candlestick' && trace.visible ? [d, d] : []);
        pts.enter().append('path').classed('legendcandle', true)
            .attr('d', function(_, i) {
                if(i) return 'M-15,0H-8M-8,6V-6H8Z'; // increasing
                return 'M15,0H8M8,-6V6H-8Z'; // decreasing
            })
            .attr('transform', 'translate(20,0)')
            .style('stroke-miterlimit', 1);
        pts.exit().remove();
        pts.each(function(_, i) {
            var container = trace[i ? 'increasing' : 'decreasing'];
            var w = container.line.width,
                p = d3.select(this);

            p.style('stroke-width', w + 'px')
                .call(Color.fill, container.fillcolor);

            if(w) {
                Color.stroke(p, container.line.color);
            }
        });
    }

    function styleOHLC(d) {
        var trace = d[0].trace,
            pts = d3.select(this).select('g.legendpoints')
                .selectAll('path.legendohlc')
                .data(trace.type === 'ohlc' && trace.visible ? [d, d] : []);
        pts.enter().append('path').classed('legendohlc', true)
            .attr('d', function(_, i) {
                if(i) return 'M-15,0H0M-8,-6V0'; // increasing
                return 'M15,0H0M8,6V0'; // decreasing
            })
            .attr('transform', 'translate(20,0)')
            .style('stroke-miterlimit', 1);
        pts.exit().remove();
        pts.each(function(_, i) {
            var container = trace[i ? 'increasing' : 'decreasing'];
            var w = container.line.width,
                p = d3.select(this);

            p.style('fill', 'none')
                .call(Drawing.dashLine, container.line.dash, w);

            if(w) {
                Color.stroke(p, container.line.color);
            }
        });
    }

    function stylePies(d) {
        var trace = d[0].trace,
            pts = d3.select(this).select('g.legendpoints')
                .selectAll('path.legendpie')
                .data(Registry.traceIs(trace, 'pie') && trace.visible ? [d] : []);
        pts.enter().append('path').classed('legendpie', true)
            .attr('d', 'M6,6H-6V-6H6Z')
            .attr('transform', 'translate(20,0)');
        pts.exit().remove();

        if(pts.size()) pts.call(stylePie, d[0], trace);
    }
};
