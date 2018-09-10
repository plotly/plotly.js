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
    var value = trace.value;
    var len = value.length;
    var vMax = -Infinity;
    var vMin = Infinity;

    for(var i = 0; i < len; i++) {
        var v = value[i];
        vMax = Math.max(vMax, v);
        vMin = Math.min(vMin, v);
    }

    trace._vMax = vMax;

    colorscaleCalc(trace, [vMin, vMax], '', 'c');

    var x = trace.x;
    var y = trace.y;
    var z = trace.z;

    var xMax = -Infinity;
    var xMin = Infinity;
    var yMax = -Infinity;
    var yMin = Infinity;
    var zMax = -Infinity;
    var zMin = Infinity;

    for(var i = 0; i < len; i++) {
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

    trace._xbnds = [xMin, xMax];
    trace._ybnds = [yMin, yMax];
    trace._zbnds = [zMin, zMax];

};
