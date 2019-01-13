/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorscaleCalc = require('../../components/colorscale/calc');

module.exports = function calc(gd, trace) {

    var vMin = trace.isomin;
    var vMax = trace.isomax;
    if(vMin === undefined) vMin = Math.min.apply(null, trace.value);
    if(vMax === undefined) vMax = Math.max.apply(null, trace.value);

    if(vMin === vMax) return;
    if(vMin > vMax) {
        var vTmp = vMin;
        vMin = vMax;
        vMax = vTmp;
    }

    colorscaleCalc(gd, trace, {
        vals: [vMin, vMax],
        containerStr: '',
        cLetter: 'c'
    });
};
