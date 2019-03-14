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

    Lib.makeTraceGroups(traceLayer, cdModule, 'trace bars').each(function(cd) {
        var plotGroup = d3.select(this);
        var cd0 = cd[0];
        var trace = cd0.trace;

        if(!trace.connector || !trace.connector.width || !trace.connector.mode) return;

        var hw = trace.connector.width * 0.5;

        var isHorizontal = (trace.orientation === 'h');
        var mode = trace.connector.mode;

        if(!plotinfo.isRangePlot) cd0.node3 = plotGroup;

        var group = Lib.ensureSingle(plotGroup, 'g', 'lines');

        var connectors = group.selectAll('g.lines').data(Lib.identity);

        connectors.enter().append('g')
            .classed('lines', true);

        connectors.exit().remove();

        connectors.each(function(di, i) {
            var connector = d3.select(this);
            var shape = '';

            var x0, y0;
            var x1, y1;
            var x2, y2;
            var x3, y3;

            if(isHorizontal) {
                x0 = xa.c2p(di.s1, true);
                y0 = ya.c2p(di.p1, true);

                x1 = xa.c2p(di.s0, true);
                y1 = ya.c2p(di.p0, true);

                x2 = xa.c2p(di.s1, true);
                y2 = ya.c2p(di.p1, true);

                if(i < connectors[0].length - 1) {
                    x3 = xa.c2p(di.s0 + 1, true);
                    y3 = ya.c2p(di.p0 + 1, true);
                }
            } else {
                x0 = xa.c2p(di.p1, true);
                y0 = ya.c2p(di.s1, true);

                x1 = xa.c2p(di.p0, true);
                y1 = ya.c2p(di.s0, true);

                x2 = xa.c2p(di.p1, true);
                y2 = ya.c2p(di.s1, true);

                if(i < connectors[0].length - 1) {
                    x3 = xa.c2p(di.p0 + 1, true);
                    y3 = ya.c2p(di.s0 + 1, true);
                }
            }

            if(mode === 'steps') {
                if(!di.isSum) {
                    if(isHorizontal) {
                        shape += 'M' + x0 + ',' + (y1 - hw) + 'V' + (y1 + hw) + 'H' + x1 + 'V' + (y1 - hw) + 'Z';
                    } else {
                        shape += 'M' + (x1 - hw) + ',' + y0 + 'H' + (x1 + hw) + 'V' + y1 + 'H' + (x1 - hw) + 'Z';
                    }
                }
            } else if(mode === 'begin+end') {
                if(isHorizontal) {
                    shape += 'M' + (x1 + hw) + ',' + y0 + 'V' + y1 + 'H' + (x1 - hw) + 'V' + y0 + 'Z';
                } else {
                    shape += 'M' + x0 + ',' + (y1 + hw) + 'H' + x1 + 'V' + (y1 - hw) + 'H' + x0 + 'Z';
                }
            }

            if(isHorizontal) {
                shape += 'M' + (x2 + hw) + ',' + y1 + 'V' + y2 + 'H' + (x2 - hw) + 'V' + y1 + 'Z';
            } else {
                shape += 'M' + x1 + ',' + (y2 + hw) + 'H' + x2 + 'V' + (y2 - hw) + 'H' + x1 + 'Z';
            }

            if(x3 !== undefined && y3 !== undefined) {
                if(isHorizontal) {
                    shape += 'M' + (x2 + hw) + ',' + y2 + 'V' + y3 + 'H' + (x2 - hw) + 'V' + y2 + 'Z';
                } else {
                    shape += 'M' + x2 + ',' + (y2 + hw) + 'H' + x3 + 'V' + (y2 - hw) + 'H' + x2 + 'Z';
                }
            }

            Lib.ensureSingle(connector, 'path')
            .style('vector-effect', 'non-scaling-stroke')
            .attr('d', shape)
            .call(Drawing.setClipUrl, plotinfo.layerClipId, gd);
        });
    });
}
