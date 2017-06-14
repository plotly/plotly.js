/**
* Copyright 2012-2017, Plotly, Inc.
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

        var layers = traceGroup.selectAll('g.layers')
            .data([0]);
        layers.enter().append('g')
            .classed('layers', true);
        layers.style('opacity', d[0].trace.opacity);

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
    .each(stylePoints);

    function styleLines(d) {
        var trace = d[0].trace,
            showFill = trace.visible && trace.fill && trace.fill !== 'none',
            showLine = subTypes.hasLines(trace);

        if(trace && trace._module && trace._module.name === 'contourcarpet') {
            showLine = trace.contours.showlines;
            showFill = trace.contours.coloring === 'fill';
        }

        var fill = d3.select(this).select('.legendfill').selectAll('path')
            .data(showFill ? [d] : []);
        fill.enter().append('path').classed('js-fill', true);
        fill.exit().remove();
        fill.attr('d', 'M5,0h30v6h-30z')
            .call(Drawing.fillGroupStyle);

        var line = d3.select(this).select('.legendlines').selectAll('path')
            .data(showLine ? [d] : []);
        line.enter().append('path').classed('js-line', true)
            .attr('d', 'M5,0h30');
        line.exit().remove();
        line.call(Drawing.lineGroupStyle);
    }

    function stylePoints(d) {
        var d0 = d[0],
            trace = d0.trace,
            showMarkers = subTypes.hasMarkers(trace),
            showText = subTypes.hasText(trace),
            showLines = subTypes.hasLines(trace);

        var dMod, tMod;

        // 'scatter3d' and 'scattergeo' don't use gd.calcdata yet;
        // use d0.trace to infer arrayOk attributes

        function boundVal(attrIn, arrayToValFn, bounds) {
            var valIn = Lib.nestedProperty(trace, attrIn).get(),
                valToBound = (Array.isArray(valIn) && arrayToValFn) ?
                    arrayToValFn(valIn) : valIn;

            if(bounds) {
                if(valToBound < bounds[0]) return bounds[0];
                else if(valToBound > bounds[1]) return bounds[1];
            }
            return valToBound;
        }

        function pickFirst(array) { return array[0]; }

        // constrain text, markers, etc so they'll fit on the legend
        if(showMarkers || showText || showLines) {
            var dEdit = {},
                tEdit = {};

            if(showMarkers) {
                dEdit.mc = boundVal('marker.color', pickFirst);
                dEdit.mo = boundVal('marker.opacity', Lib.mean, [0.2, 1]);
                dEdit.ms = boundVal('marker.size', Lib.mean, [2, 16]);
                dEdit.mlc = boundVal('marker.line.color', pickFirst);
                dEdit.mlw = boundVal('marker.line.width', Lib.mean, [0, 5]);
                tEdit.marker = {
                    sizeref: 1,
                    sizemin: 1,
                    sizemode: 'diameter'
                };
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
        }

        var ptgroup = d3.select(this).select('g.legendpoints');

        var pts = ptgroup.selectAll('path.scatterpts')
            .data(showMarkers ? dMod : []);
        pts.enter().append('path').classed('scatterpts', true)
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
                .data(Registry.traceIs(trace, 'box') && trace.visible ? [d] : []);
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
                p.call(Color.stroke, trace.line.color);
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
