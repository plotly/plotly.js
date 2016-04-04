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
var subTypes = require('../../traces/scatter/subtypes');


module.exports = function plot(traces, plotinfo) {
    var xa = plotinfo.x(),
        ya = plotinfo.y();

    traces.each(function(d) {
        var trace = d[0].trace,
            // || {} is in case the trace (specifically scatterternary)
            // doesn't support error bars at all, but does go through
            // the scatter.plot mechanics, which calls ErrorBars.plot
            // internally
            xObj = trace.error_x || {},
            yObj = trace.error_y || {};

        var sparse = (
            subTypes.hasMarkers(trace) &&
            trace.marker.maxdisplayed > 0
        );

        if(!yObj.visible && !xObj.visible) return;

        var errorbars = d3.select(this).selectAll('g.errorbar')
            .data(Lib.identity);

        errorbars.enter().append('g')
            .classed('errorbar', true);

        errorbars.each(function(d) {
            var errorbar = d3.select(this);
            var coords = errorCoords(d, xa, ya);

            if(sparse && !d.vis) return;

            var path;

            if(yObj.visible && isNumeric(coords.x) &&
                    isNumeric(coords.yh) &&
                    isNumeric(coords.ys)) {
                var yw = yObj.width;

                path = 'M' + (coords.x - yw) + ',' +
                    coords.yh + 'h' + (2 * yw) + // hat
                    'm-' + yw + ',0V' + coords.ys; // bar

                if(!coords.noYS) path += 'm-' + yw +',0h' + (2 * yw); // shoe

                errorbar.append('path')
                    .classed('yerror', true)
                    .attr('d', path);
            }

            if(xObj.visible && isNumeric(coords.y) &&
                    isNumeric(coords.xh) &&
                    isNumeric(coords.xs)) {
                var xw = (xObj.copy_ystyle ? yObj : xObj).width;

                path = 'M' + coords.xh + ',' +
                    (coords.y - xw) + 'v' + (2 * xw) + // hat
                    'm0,-' + xw + 'H' + coords.xs; // bar

                if(!coords.noXS) path += 'm0,-' + xw + 'v' + (2 * xw); // shoe

                errorbar.append('path')
                    .classed('xerror', true)
                    .attr('d', path);
            }
        });
    });
};

// compute the coordinates of the error-bar objects
function errorCoords(d, xa, ya) {
    var out = {
        x: xa.c2p(d.x),
        y: ya.c2p(d.y)
    };

    // calculate the error bar size and hat and shoe locations
    if(d.yh !== undefined) {
        out.yh = ya.c2p(d.yh);
        out.ys = ya.c2p(d.ys);

        // if the shoes go off-scale (ie log scale, error bars past zero)
        // clip the bar and hide the shoes
        if(!isNumeric(out.ys)) {
            out.noYS = true;
            out.ys = ya.c2p(d.ys, true);
        }
    }

    if(d.xh !== undefined) {
        out.xh = xa.c2p(d.xh);
        out.xs = xa.c2p(d.xs);

        if(!isNumeric(out.xs)) {
            out.noXS = true;
            out.xs = xa.c2p(d.xs, true);
        }
    }

    return out;
}
