/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');
var isNumeric = require('fast-isnumeric');

var Lib = require('../../lib');
var Color = require('../../components/color');
var ErrorBars = require('../../components/errorbars');

var arraysToCalcdata = require('./arrays_to_calcdata');


module.exports = function plot(gd, plotinfo, cdbar) {
    var xa = plotinfo.xaxis,
        ya = plotinfo.yaxis,
        fullLayout = gd._fullLayout;

    var bartraces = plotinfo.plot.select('.barlayer')
        .selectAll('g.trace.bars')
            .data(cdbar)
      .enter().append('g')
        .attr('class', 'trace bars');

    bartraces.append('g')
        .attr('class', 'points')
        .each(function(d) {
            var t = d[0].t,
                trace = d[0].trace;

            arraysToCalcdata(d);

            d3.select(this).selectAll('path')
                .data(Lib.identity)
              .enter().append('path')
                .each(function(di) {
                    // now display the bar
                    // clipped xf/yf (2nd arg true): non-positive
                    // log values go off-screen by plotwidth
                    // so you see them continue if you drag the plot
                    var x0, x1, y0, y1;
                    if(trace.orientation === 'h') {
                        y0 = ya.c2p(t.poffset + di.p, true);
                        y1 = ya.c2p(t.poffset + di.p + t.barwidth, true);
                        x0 = xa.c2p(di.b, true);
                        x1 = xa.c2p(di.s + di.b, true);
                    }
                    else {
                        x0 = xa.c2p(t.poffset + di.p, true);
                        x1 = xa.c2p(t.poffset + di.p + t.barwidth, true);
                        y1 = ya.c2p(di.s + di.b, true);
                        y0 = ya.c2p(di.b, true);
                    }

                    if(!isNumeric(x0) || !isNumeric(x1) ||
                            !isNumeric(y0) || !isNumeric(y1) ||
                            x0 === x1 || y0 === y1) {
                        d3.select(this).remove();
                        return;
                    }
                    var lw = (di.mlw + 1 || trace.marker.line.width + 1 ||
                            (di.trace ? di.trace.marker.line.width : 0) + 1) - 1,
                        offset = d3.round((lw / 2) % 1, 2);
                    function roundWithLine(v) {
                        // if there are explicit gaps, don't round,
                        // it can make the gaps look crappy
                        return (fullLayout.bargap === 0 && fullLayout.bargroupgap === 0) ?
                            d3.round(Math.round(v) - offset, 2) : v;
                    }
                    function expandToVisible(v, vc) {
                        // if it's not in danger of disappearing entirely,
                        // round more precisely
                        return Math.abs(v - vc) >= 2 ? roundWithLine(v) :
                        // but if it's very thin, expand it so it's
                        // necessarily visible, even if it might overlap
                        // its neighbor
                        (v > vc ? Math.ceil(v) : Math.floor(v));
                    }
                    if(!gd._context.staticPlot) {
                        // if bars are not fully opaque or they have a line
                        // around them, round to integer pixels, mainly for
                        // safari so we prevent overlaps from its expansive
                        // pixelation. if the bars ARE fully opaque and have
                        // no line, expand to a full pixel to make sure we
                        // can see them
                        var op = Color.opacity(di.mc || trace.marker.color),
                            fixpx = (op < 1 || lw > 0.01) ?
                                roundWithLine : expandToVisible;
                        x0 = fixpx(x0, x1);
                        x1 = fixpx(x1, x0);
                        y0 = fixpx(y0, y1);
                        y1 = fixpx(y1, y0);
                    }
                    d3.select(this).attr('d',
                        'M' + x0 + ',' + y0 + 'V' + y1 + 'H' + x1 + 'V' + y0 + 'Z');
                });
        });

    // error bars are on the top
    bartraces.call(ErrorBars.plot, plotinfo);

};
