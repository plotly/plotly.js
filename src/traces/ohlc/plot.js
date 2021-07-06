'use strict';

var d3 = require('@plotly/d3');

var Lib = require('../../lib');

module.exports = function plot(gd, plotinfo, cdOHLC, ohlcLayer) {
    var ya = plotinfo.yaxis;
    var xa = plotinfo.xaxis;
    var posHasRangeBreaks = !!xa.rangebreaks;

    Lib.makeTraceGroups(ohlcLayer, cdOHLC, 'trace ohlc').each(function(cd) {
        var plotGroup = d3.select(this);
        var cd0 = cd[0];
        var t = cd0.t;
        var trace = cd0.trace;

        if(trace.visible !== true || t.empty) {
            plotGroup.remove();
            return;
        }

        var tickLen = t.tickLen;

        var paths = plotGroup.selectAll('path').data(Lib.identity);

        paths.enter().append('path');

        paths.exit().remove();

        paths.attr('d', function(d) {
            if(d.empty) return 'M0,0Z';

            var xo = xa.c2p(d.pos - tickLen, true);
            var xc = xa.c2p(d.pos + tickLen, true);
            var x = posHasRangeBreaks ? (xo + xc) / 2 : xa.c2p(d.pos, true);

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
