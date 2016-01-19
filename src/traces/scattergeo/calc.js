/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var calcMarkerColorscale = require('../scatter/marker_colorscale_calc');


module.exports = function calc(gd, trace) {
    var cd = [{x: false, y: false, trace: trace, t: {}}];

    calcMarkerColorscale(trace);

    return cd;
};
