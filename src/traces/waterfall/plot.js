/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var Lib = require('../../lib');
var Drawing = require('../../components/drawing');
var barPlot = require('../bar/plot');

module.exports = function plot(gd, plotinfo, cdModule, traceLayer) {
    barPlot(gd, plotinfo, cdModule, traceLayer);

    plotConnectors(gd, plotinfo, cdModule, traceLayer);
};

function plotConnectors(gd, plotinfo, cdModule, traceLayer) {
    var xa = plotinfo.xaxis;
    var ya = plotinfo.yaxis;

    Lib.makeTraceGroups(traceLayer, cdModule, 'trace connectors').each(function(cd) {
        var plotGroup = d3.select(this);
        var cd0 = cd[0];
        var trace = cd0.trace;

        if(trace.type !== 'waterfall') return;
        if(!trace.connector || !trace.connector.width) return;

        var lw = trace.connector.width * 0.5;
        var isHorizontal = (trace.orientation === 'h');

        if(!plotinfo.isRangePlot) cd0.node3 = plotGroup;

        var pointGroup = Lib.ensureSingle(plotGroup, 'g', 'connectors');

        var connectors = pointGroup.selectAll('g.connector').data(Lib.identity);

        connectors.enter().append('g')
            .classed('connector', true);

        connectors.exit().remove();

        connectors.each(function(di, i) {
            // do not draw connectors from the last item
            if(i === connectors[0].length - 1) return;

            var connector = d3.select(this);
            var x0, x1, y0, y1;
            if(isHorizontal) {
                y0 = ya.c2p(di.p0, true);
                y1 = ya.c2p(di.p0 + 1, true);
                x0 = xa.c2p(di.s0, true);
                x1 = xa.c2p(di.s1, true);
            } else {
                x0 = xa.c2p(di.p0, true);
                x1 = xa.c2p(di.p0 + 1, true);
                y0 = ya.c2p(di.s0, true);
                y1 = ya.c2p(di.s1, true);
            }

            var shape;
            if(isHorizontal) {
                shape = 'M' + (x1 + lw) + ',' + y0 + 'V' + y1 + 'H' + (x1 - lw) + 'V' + y0 + 'Z';
            } else {
                shape = 'M' + x0 + ',' + (y1 + lw) + 'H' + x1 + 'V' + (y1 - lw) + 'H' + x0 + 'Z';
            }

            Lib.ensureSingle(connector, 'path')
            .style('vector-effect', 'non-scaling-stroke')
            .attr('d', shape)
            .call(Drawing.setClipUrl, plotinfo.layerClipId, gd);
        });
    });
}
