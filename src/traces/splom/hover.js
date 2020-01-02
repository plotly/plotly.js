/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var helpers = require('./helpers');
var calcHover = require('../scattergl/hover').calcHover;

function hoverPoints(pointData, xval, yval) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var scene = pointData.scene;
    var cdata = scene.matrixOptions.cdata;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var xpx = xa.c2p(xval);
    var ypx = ya.c2p(yval);
    var maxDistance = pointData.distance;

    var xi = helpers.getDimIndex(trace, xa);
    var yi = helpers.getDimIndex(trace, ya);
    if(xi === false || yi === false) return [pointData];

    var x = cdata[xi];
    var y = cdata[yi];

    var id, dxy;
    var minDist = maxDistance;

    for(var i = 0; i < x.length; i++) {
        var ptx = x[i];
        var pty = y[i];
        var dx = xa.c2p(ptx) - xpx;
        var dy = ya.c2p(pty) - ypx;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if(dist < minDist) {
            minDist = dxy = dist;
            id = i;
        }
    }

    pointData.index = id;
    pointData.distance = minDist;
    pointData.dxy = dxy;

    if(id === undefined) return [pointData];

    return [calcHover(pointData, x, y, trace)];
}

module.exports = {
    hoverPoints: hoverPoints
};
