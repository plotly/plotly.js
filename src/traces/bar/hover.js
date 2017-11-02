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
var fillHoverText = require('../scatter/fill_hover_text');

module.exports = function hoverPoints(pointData, xval, yval, hovermode) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var t = cd[0].t;

    var posVal, sizeVal, posLetter, sizeLetter, dx, dy;

    function thisBarMinPos(di) { return di[posLetter] - di.w / 2; }
    function thisBarMaxPos(di) { return di[posLetter] + di.w / 2; }

    var minPos = (hovermode === 'closest') ?
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

    var maxPos = (hovermode === 'closest') ?
        thisBarMaxPos :
        function(di) {
            return Math.max(thisBarMaxPos(di), di.p + t.bargroupwidth / 2);
        };

    function positionFn(di) {
        return Fx.inbox(minPos(di) - posVal, maxPos(di) - posVal);
    }

    function sizeFn(di) {
        // add a gradient so hovering near the end of a
        // bar makes it a little closer match
        return Fx.inbox(di.b - sizeVal, di[sizeLetter] - sizeVal) +
            (di[sizeLetter] - sizeVal) / (di[sizeLetter] - di.b);
    }

    if(trace.orientation === 'h') {
        posVal = yval;
        sizeVal = xval;
        posLetter = 'y';
        sizeLetter = 'x';
        dx = sizeFn;
        dy = positionFn;
    }
    else {
        posVal = xval;
        sizeVal = yval;
        posLetter = 'x';
        sizeLetter = 'y';
        dy = sizeFn;
        dx = positionFn;
    }

    var pa = pointData[posLetter + 'a'];
    var sa = pointData[sizeLetter + 'a'];

    var distfn = Fx.getDistanceFunction(hovermode, dx, dy);
    Fx.getClosest(cd, distfn, pointData);

    // skip the rest (for this trace) if we didn't find a close point
    if(pointData.index === false) return;

    // the closest data point
    var index = pointData.index;
    var di = cd[index];
    var mc = di.mcc || trace.marker.color;
    var mlc = di.mlcc || trace.marker.line.color;
    var mlw = di.mlw || trace.marker.line.width;

    if(Color.opacity(mc)) pointData.color = mc;
    else if(Color.opacity(mlc) && mlw) pointData.color = mlc;

    var size = (trace.base) ? di.b + di.s : di.s;
    pointData[sizeLetter + '0'] = pointData[sizeLetter + '1'] = sa.c2p(di[sizeLetter], true);
    pointData[sizeLetter + 'LabelVal'] = size;

    pointData[posLetter + '0'] = pa.c2p(minPos(di), true);
    pointData[posLetter + '1'] = pa.c2p(maxPos(di), true);
    pointData[posLetter + 'LabelVal'] = di.p;

    fillHoverText(di, trace, pointData);
    ErrorBars.hoverInfo(di, trace, pointData);

    return [pointData];
};
