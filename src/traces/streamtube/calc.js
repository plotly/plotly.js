/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorscaleCalc = require('../../components/colorscale/calc');

module.exports = function calc(gd, trace) {
    var i;

    var u = trace.u;
    var v = trace.v;
    var w = trace.w;
    var vlen = Math.min(u.length, v.length, w.length);
    var normMax = -Infinity;
    var normMin = Infinity;

    for(i = 0; i < vlen; i++) {
        var uu = u[i];
        var vv = v[i];
        var ww = w[i];
        var norm = Math.sqrt(uu * uu + vv * vv + ww * ww);

        normMax = Math.max(normMax, norm);
        normMin = Math.min(normMin, norm);
    }

    trace._normMax = normMax;

    colorscaleCalc(trace, [normMin, normMax], '', 'c');

    var xMax = -Infinity;
    var xMin = Infinity;
    var yMax = -Infinity;
    var yMin = Infinity;
    var zMax = -Infinity;
    var zMin = Infinity;

    var x = trace.x;
    var y = trace.y;
    var z = trace.z;
    var plen = Math.min(x.length, y.length, z.length);

    for(i = 0; i < plen; i++) {
        var xx = x[i];
        xMax = Math.max(xMax, xx);
        xMin = Math.min(xMin, xx);

        var yy = y[i];
        yMax = Math.max(yMax, yy);
        yMin = Math.min(yMin, yy);

        var zz = z[i];
        zMax = Math.max(zMax, zz);
        zMin = Math.min(zMin, zz);
    }

    var startx = trace.startx;
    var starty = trace.starty;
    var startz = trace.startz;
    var slen = Math.min(startx.length, starty.length, startz.length);

    for(i = 0; i < slen; i++) {
        var sx = startx[i];
        xMax = Math.max(xMax, sx);
        xMin = Math.min(xMin, sx);

        var sy = starty[i];
        yMax = Math.max(yMax, sy);
        yMin = Math.min(yMin, sy);

        var sz = startz[i];
        zMax = Math.max(zMax, sz);
        zMin = Math.min(zMin, sz);
    }

    trace._xbnds = [xMin, xMax];
    trace._ybnds = [yMin, yMax];
    trace._zbnds = [zMin, zMax];
};
