/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Fx = require('../../components/fx');
var ErrorBars = require('../../components/errorbars');
var Color = require('../../components/color');


module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var t = cd[0].t;
    var xa = pointData.xa;
    var ya = pointData.ya;

    var posVal, thisBarMinPos, thisBarMaxPos, minPos, maxPos, dx, dy;

    var positionFn = function(di) {
        return Fx.inbox(minPos(di) - posVal, maxPos(di) - posVal);
    };

    if(trace.orientation === 'h') {
        posVal = yval;
        thisBarMinPos = function(di) { return di.y - di.w / 2; };
        thisBarMaxPos = function(di) { return di.y + di.w / 2; };
        dx = function(di) {
            // add a gradient so hovering near the end of a
            // bar makes it a little closer match
            return Fx.inbox(di.b - xval, di.x - xval) + (di.x - xval) / (di.x - di.b);
        };
        dy = positionFn;
    }
    else {
        posVal = xval;
        thisBarMinPos = function(di) { return di.x - di.w / 2; };
        thisBarMaxPos = function(di) { return di.x + di.w / 2; };
        dy = function(di) {
            return Fx.inbox(di.b - yval, di.y - yval) + (di.y - yval) / (di.y - di.b);
        };
        dx = positionFn;
    }

    minPos = (hovermode === 'closest') ?
        thisBarMinPos :
        function(di) {
            /*
             * In compare mode, accept a bar if you're on it *or* its group.
             * Nearly always it's the group that matters, but in case the bar
             * was explicitly set wider than its group we'd better accept the
             * whole bar.
             */
            return Math.min(thisBarMinPos(di), di.p - t.bargroupwidth / 2);
        };

    maxPos = (hovermode === 'closest') ?
        thisBarMaxPos :
        function(di) {
            return Math.max(thisBarMaxPos(di), di.p + t.bargroupwidth / 2);
        };

    var distfn = Fx.getDistanceFunction(hovermode, dx, dy);
    Fx.getClosest(cd, distfn, pointData);

    // skip the rest (for this trace) if we didn't find a close point
    if(pointData.index === false) return;

    // the closest data point
    var index = pointData.index,
        di = cd[index],
        mc = di.mcc || trace.marker.color,
        mlc = di.mlcc || trace.marker.line.color,
        mlw = di.mlw || trace.marker.line.width;
    if(Color.opacity(mc)) pointData.color = mc;
    else if(Color.opacity(mlc) && mlw) pointData.color = mlc;

    var size = (trace.base) ? di.b + di.s : di.s;
    if(trace.orientation === 'h') {
        pointData.x0 = pointData.x1 = xa.c2p(di.x, true);
        pointData.xLabelVal = size;

        pointData.y0 = ya.c2p(minPos(di), true);
        pointData.y1 = ya.c2p(maxPos(di), true);
        pointData.yLabelVal = di.p;
    }
    else {
        pointData.y0 = pointData.y1 = ya.c2p(di.y, true);
        pointData.yLabelVal = size;

        pointData.x0 = xa.c2p(minPos(di), true);
        pointData.x1 = xa.c2p(maxPos(di), true);
        pointData.xLabelVal = di.p;
    }

    if(di.htx) pointData.text = di.htx;
    else if(trace.hovertext) pointData.text = trace.hovertext;
    else if(di.tx) pointData.text = di.tx;
    else if(trace.text) pointData.text = trace.text;

    ErrorBars.hoverInfo(di, trace, pointData);

    return [pointData];
};
