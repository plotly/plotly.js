/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var Lib = require('../../lib');

module.exports = function plot(gd, plotinfo, cdOHLC, ohlcLayer) {
    var xa = plotinfo.xaxis;
    var ya = plotinfo.yaxis;

    var traces = ohlcLayer.selectAll('g.trace')
        .data(cdOHLC, function(d) { return d[0].trace.uid; });

    traces.enter().append('g')
        .attr('class', 'trace ohlc');

    traces.exit().remove();

    traces.order();

    traces.each(function(d) {
        var cd0 = d[0];
        var t = cd0.t;
        var trace = cd0.trace;
        var sel = d3.select(this);
        if(!plotinfo.isRangePlot) cd0.node3 = sel;

        if(trace.visible !== true || t.empty) {
            sel.remove();
            return;
        }

        var tickLen = t.tickLen;

        var paths = sel.selectAll('path').data(Lib.identity);

        paths.enter().append('path');

        paths.exit().remove();

        paths.attr('d', function(d) {
            var x = xa.c2p(d.pos, true);
            var xo = xa.c2p(d.pos - tickLen, true);
            var xc = xa.c2p(d.pos + tickLen, true);

            var yo = ya.c2p(d.o, true);
            var yh = ya.c2p(d.h, true);
            var yl = ya.c2p(d.l, true);
            var yc = ya.c2p(d.c, true);

            return 'M' + xo + ',' + yo + 'H' + x +
                'M' + x + ',' + yh + 'V' + yl +
                'M' + xc + ',' + yc + 'H' + x;
        });
    });
};
