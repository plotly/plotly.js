/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var calc = require('../sunburst/calc');

exports.calc = function(gd, trace) {
    return calc.calc(gd, trace);
};

exports.crossTraceCalc = function(gd) {
    return calc._runCrossTraceCalc('treemap', gd);
};
