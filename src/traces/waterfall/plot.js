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

        if(!trace.connector || !trace.connector.visible || !trace.connector.line.width) return;

        var isHorizontal = (trace.orientation === 'h');
        var mode = trace.connector.mode;

        if(!plotinfo.isRangePlot) cd0.node3 = plotGroup;

        var group = Lib.ensureSingle(plotGroup, 'g', 'lines');

        var connectors = group.selectAll('g.line').data(Lib.identity);

        connectors.enter().append('g')
            .classed('line', true);

        connectors.exit().remove();

        var len = connectors[0].length;

        connectors.each(function(di, i) {
            var connector = d3.select(this);
            var shape = '';

            var x0, y0;
            var x1, y1;
            var x2, y2;
            var x3, y3;

            var delta = 0;
            if(i + 1 < len && Array.isArray(trace.offset)) {
                delta -= trace.offset[i + 1] - trace.offset[i];
            }

            if(isHorizontal) {
                x0 = xa.c2p(di.s1, true);
                y0 = ya.c2p(di.p1, true);

                x1 = xa.c2p(di.s0, true);
                y1 = ya.c2p(di.p0, true);

                x2 = xa.c2p(di.s1, true);
                y2 = ya.c2p(di.p1, true);

                if(i + 1 < len) {
                    x3 = xa.c2p(di.s0 + 1 - delta, true);
                    y3 = ya.c2p(di.p0 + 1 - delta, true);
                }
            } else {
                x0 = xa.c2p(di.p1, true);
                y0 = ya.c2p(di.s1, true);

                x1 = xa.c2p(di.p0, true);
                y1 = ya.c2p(di.s0, true);

                x2 = xa.c2p(di.p1, true);
                y2 = ya.c2p(di.s1, true);

                if(i + 1 < len) {
                    x3 = xa.c2p(di.p0 + 1 - delta, true);
                    y3 = ya.c2p(di.s0 + 1 - delta, true);
                }
            }

            if(mode === 'spanning') {
                if(!di.isSum && i > 0) {
                    if(isHorizontal) {
                        shape += 'M' + x1 + ',' + y0 + 'V' + y1;
                    } else {
                        shape += 'M' + x0 + ',' + y1 + 'H' + x1;
                    }
                }
            }

            if(mode !== 'between') {
                if(di.isSum || i < len - 1) {
                    if(isHorizontal) {
                        shape += 'M' + x2 + ',' + y1 + 'V' + y2;
                    } else {
                        shape += 'M' + x1 + ',' + y2 + 'H' + x2;
                    }
                }
            }

            if(x3 !== undefined && y3 !== undefined) {
                if(isHorizontal) {
                    shape += 'M' + x2 + ',' + y2 + 'V' + y3;
                } else {
                    shape += 'M' + x2 + ',' + y2 + 'H' + x3;
                }
            }

            Lib.ensureSingle(connector, 'path')
                .attr('d', shape)
                .call(Drawing.setClipUrl, plotinfo.layerClipId, gd);
        });
    });
}
