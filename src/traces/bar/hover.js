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
var Color = require('../../components/color');


module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd,
        trace = cd[0].trace,
        t = cd[0].t,
        xa = pointData.xa,
        ya = pointData.ya,
        barDelta = (hovermode === 'closest') ?
            t.barwidth / 2 :
            t.bargroupwidth / 2,
        barPos;

    if(hovermode !== 'closest') barPos = function(di) { return di.p; };
    else if(trace.orientation === 'h') barPos = function(di) { return di.y; };
    else barPos = function(di) { return di.x; };

    var dx, dy;
    if(trace.orientation === 'h') {
        dx = function(di) {
            // add a gradient so hovering near the end of a
            // bar makes it a little closer match
            return Fx.inbox(di.b - xval, di.x - xval) + (di.x - xval) / (di.x - di.b);
        };
        dy = function(di) {
            var centerPos = barPos(di) - yval;
            return Fx.inbox(centerPos - barDelta, centerPos + barDelta);
        };
    }
    else {
        dy = function(di) {
            return Fx.inbox(di.b - yval, di.y - yval) + (di.y - yval) / (di.y - di.b);
        };
        dx = function(di) {
            var centerPos = barPos(di) - xval;
            return Fx.inbox(centerPos - barDelta, centerPos + barDelta);
        };
    }

    var distfn = Fx.getDistanceFunction(hovermode, dx, dy);
    Fx.getClosest(cd, distfn, pointData);

    // skip the rest (for this trace) if we didn't find a close point
    if(pointData.index === false) return;

    // the closest data point
    var di = cd[pointData.index],
        mc = di.mcc || trace.marker.color,
        mlc = di.mlcc || trace.marker.line.color,
        mlw = di.mlw || trace.marker.line.width;
    if(Color.opacity(mc)) pointData.color = mc;
    else if(Color.opacity(mlc) && mlw) pointData.color = mlc;

    if(trace.orientation === 'h') {
        pointData.x0 = pointData.x1 = xa.c2p(di.x, true);
        pointData.xLabelVal = di.b + di.s;

        pointData.y0 = ya.c2p(barPos(di) - barDelta, true);
        pointData.y1 = ya.c2p(barPos(di) + barDelta, true);
        pointData.yLabelVal = di.p;
    }
    else {
        pointData.y0 = pointData.y1 = ya.c2p(di.y, true);
        pointData.yLabelVal = di.b + di.s;

        pointData.x0 = xa.c2p(barPos(di) - barDelta, true);
        pointData.x1 = xa.c2p(barPos(di) + barDelta, true);
        pointData.xLabelVal = di.p;
    }

    if(di.tx) pointData.text = di.tx;

    ErrorBars.hoverInfo(di, trace, pointData);

    return [pointData];
};
