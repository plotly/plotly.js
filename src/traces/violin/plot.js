/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');
var Lib = require('../../lib');
var Drawing = require('../../components/drawing');
var boxPlot = require('../box/plot');
var linePoints = require('../scatter/line_points');

module.exports = function plot(gd, plotinfo, cd) {
    var fullLayout = gd._fullLayout;
    var xa = plotinfo.xaxis;
    var ya = plotinfo.yaxis;

    var traces = plotinfo.plot.select('.violinlayer')
        .selectAll('g.trace.violins')
            .data(cd)
      .enter().append('g')
        .attr('class', 'trace violins');

    traces.each(function(d) {
        var cd0 = d[0];
        var t = cd0.t;
        var trace = cd0.trace;
        var sel = cd0.node3 = d3.select(this);
        var numViolins = fullLayout._numBoxes;
        var group = (fullLayout.violinmode === 'group' && numViolins > 1);
        // violin max half width
        var bdPos = t.bdPos = t.dPos * (1 - fullLayout.violingap) * (1 - fullLayout.violingroupgap) / (group ? numViolins : 1);
        // violin center offset
        var bPos = t.bPos = group ? 2 * t.dPos * (-0.5 + (t.num + 0.5) / numViolins) * (1 - fullLayout.violingap) : 0;

        if(trace.visible !== true || t.empty) {
            d3.select(this).remove();
            return;
        }

        sel.selectAll('path.violin')
            .data(Lib.identity)
            .enter().append('path')
            .style('vector-effect', 'non-scaling-stroke')
            .attr('class', 'violin')
            .each(function(d) {
                var density = d.density;
                var lineData = [];
                var i;

                // TODO add scale by 'area' and by 'count'
                var scale = d.violinMaxWidth / bdPos;

                // TODO add support for one-sided violins
                for(i = 0; i < density.length; i++) {
                    lineData.push({
                        x: d.pos + bPos + (density[i].v / scale),
                        y: density[i].t
                    });
                }
                for(i--; i >= 0; i--) {
                    lineData.push({
                        x: d.pos + bPos - (density[i].v / scale),
                        y: density[i].t
                    });
                }

                var segments = linePoints(lineData, {
                    xaxis: xa,
                    yaxis: ya,
                    connectGaps: true,
                    baseTolerance: 0.75,
                    shape: 'spline',
                    simplify: true
                });

                var path = Drawing.smoothclosed(segments[0], trace.line.smoothing);

                d3.select(this).attr('d', path);
            });

        if(trace.points) {
            boxPlot.plotPoints(sel, plotinfo, trace, t);
        }

        // TODO quartile line etc
    });
};
