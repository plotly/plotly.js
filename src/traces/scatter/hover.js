/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Fx = require('../../plots/cartesian/graph_interact');
var ErrorBars = require('../../components/errorbars');
var getTraceColor = require('./get_trace_color');


module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd,
        trace = cd[0].trace,
        xa = pointData.xa,
        ya = pointData.ya,
        dx = function(di) {
            // scatter points: d.mrc is the calculated marker radius
            // adjust the distance so if you're inside the marker it
            // always will show up regardless of point size, but
            // prioritize smaller points
            var rad = Math.max(3, di.mrc || 0);
            return Math.max(Math.abs(xa.c2p(di.x) - xa.c2p(xval)) - rad, 1 - 3 / rad);
        },
        dy = function(di) {
            var rad = Math.max(3, di.mrc || 0);
            return Math.max(Math.abs(ya.c2p(di.y) - ya.c2p(yval)) - rad, 1 - 3 / rad);
        },
        dxy = function(di) {
            var rad = Math.max(3, di.mrc || 0),
                dx = Math.abs(xa.c2p(di.x) - xa.c2p(xval)),
                dy = Math.abs(ya.c2p(di.y) - ya.c2p(yval));
            return Math.max(Math.sqrt(dx * dx + dy * dy) - rad, 1 - 3 / rad);
        },
        distfn = Fx.getDistanceFunction(hovermode, dx, dy, dxy);

    Fx.getClosest(cd, distfn, pointData);

    // skip the rest (for this trace) if we didn't find a close point
    if(pointData.index === false) return;

    // the closest data point
    var di = cd[pointData.index],
        xc = xa.c2p(di.x, true),
        yc = ya.c2p(di.y, true),
        rad = di.mrc || 1;

    pointData.color = getTraceColor(trace, di);

    pointData.x0 = xc - rad;
    pointData.x1 = xc + rad;
    pointData.xLabelVal = di.x;

    pointData.y0 = yc - rad;
    pointData.y1 = yc + rad;
    pointData.yLabelVal = di.y;

    if(di.tx) pointData.text = di.tx;
    else if(trace.text) pointData.text = trace.text;

    ErrorBars.hoverInfo(di, trace, pointData);

    return [pointData];
};
