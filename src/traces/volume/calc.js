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
    var values = trace.values;
    var len = values.length;
    var vMax = -Infinity;
    var vMin = Infinity;

    for(var i = 0; i < len; i++) {
        var v = values[i];
        vMax = Math.max(vMax, v);
        vMin = Math.min(vMin, v);
    }

    trace._vMax = vMax;
    colorscaleCalc(trace, [vMin, vMax], '', 'c');
};
