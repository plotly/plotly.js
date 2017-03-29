/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Fx = require('../../plots/cartesian/graph_interact');
var Lib = require('../../lib');

var MAXDIST = require('../../plots/cartesian/constants').MAXDIST;


module.exports = function hoverPoints(pointData, xval, yval, hovermode, contour) {
    // never let a heatmap override another type as closest point
    if(pointData.distance < MAXDIST) return;

    var cd0 = pointData.cd[0],
        trace = cd0.trace,
        xa = pointData.xa,
        ya = pointData.ya,
        x = cd0.x,
        y = cd0.y,
        z = cd0.z,
        zmask = cd0.zmask,
        x2 = x,
        y2 = y,
        xl,
        yl,
        nx,
        ny;

    if(pointData.index !== false) {
        try {
            nx = Math.round(pointData.index[1]);
            ny = Math.round(pointData.index[0]);
        }
        catch(e) {
            Lib.error('Error hovering on heatmap, ' +
                'pointNumber must be [row,col], found:', pointData.index);
            return;
        }
        if(nx < 0 || nx >= z[0].length || ny < 0 || ny > z.length) {
            return;
        }
    }
    else if(Fx.inbox(xval - x[0], xval - x[x.length - 1]) > MAXDIST ||
            Fx.inbox(yval - y[0], yval - y[y.length - 1]) > MAXDIST) {
        return;
    }
    else {
        if(contour) {
            var i2;
            x2 = [2 * x[0] - x[1]];

            for(i2 = 1; i2 < x.length; i2++) {
                x2.push((x[i2] + x[i2 - 1]) / 2);
            }
            x2.push([2 * x[x.length - 1] - x[x.length - 2]]);

            y2 = [2 * y[0] - y[1]];
            for(i2 = 1; i2 < y.length; i2++) {
                y2.push((y[i2] + y[i2 - 1]) / 2);
            }
            y2.push([2 * y[y.length - 1] - y[y.length - 2]]);
        }
        nx = Math.max(0, Math.min(x2.length - 2, Lib.findBin(xval, x2)));
        ny = Math.max(0, Math.min(y2.length - 2, Lib.findBin(yval, y2)));
    }

    var x0 = xa.c2p(x[nx]),
        x1 = xa.c2p(x[nx + 1]),
        y0 = ya.c2p(y[ny]),
        y1 = ya.c2p(y[ny + 1]);

    if(contour) {
        x1 = x0;
        xl = x[nx];
        y1 = y0;
        yl = y[ny];
    }
    else {
        xl = (x[nx] + x[nx + 1]) / 2;
        yl = (y[ny] + y[ny + 1]) / 2;
        if(trace.zsmooth) {
            x0 = x1 = (x0 + x1) / 2;
            y0 = y1 = (y0 + y1) / 2;
        }
    }

    var zVal = z[ny][nx];
    if(zmask && !zmask[ny][nx]) zVal = undefined;

    var text;
    if(Array.isArray(cd0.text) && Array.isArray(cd0.text[ny])) {
        text = cd0.text[ny][nx];
    }

    return [Lib.extendFlat(pointData, {
        index: [ny, nx],
        // never let a 2D override 1D type as closest point
        distance: MAXDIST + 10,
        x0: x0,
        x1: x1,
        y0: y0,
        y1: y1,
        xLabelVal: xl,
        yLabelVal: yl,
        zLabelVal: zVal,
        text: text
    })];
};
