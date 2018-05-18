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
    var u = trace.u;
    var v = trace.v;
    var w = trace.w;
    var len = Math.min(u.length, v.length, w.length);
    var normMax = -Infinity;
    var normMin = Infinity;
    var compMax = -Infinity;

    for(var i = 0; i < len; i++) {
        var uu = u[i];
        var u2 = uu * uu;
        var vv = v[i];
        var v2 = vv * vv;
        var ww = w[i];
        var w2 = ww * ww;
        var norm = Math.sqrt(u2 + v2 + w2);

        normMax = Math.max(normMax, norm);
        normMin = Math.min(normMin, norm);
        compMax = Math.max(compMax, u2, v2, w2);
    }

    // stash max norm value to convert cmix/cmax -> vertexIntensityBounds
    trace._normMax = normMax;
    // stash autorange pad using max 'component' value
    trace._pad = Math.sqrt(compMax) / (normMax || 1);

    colorscaleCalc(trace, [normMin, normMax], '', 'c');
};
