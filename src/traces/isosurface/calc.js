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
    var len = u.length;
    var normMax = -Infinity;
    var normMin = Infinity;

    for(var i = 0; i < len; i++) {
        var uu = u[i];
        var norm = uu;

        normMax = Math.max(normMax, norm);
        normMin = Math.min(normMin, norm);
    }

    trace._normMax = normMax;

    colorscaleCalc(trace, [normMin, normMax], '', 'c');
};
