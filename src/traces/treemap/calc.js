/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var sunburstCalc = require('../sunburst/calc');

exports.calc = function(gd, trace) {
    return sunburstCalc.calc(gd, trace);
};

exports.crossTraceCalc = function(gd) {
    return sunburstCalc._runCrossTraceCalc('treemap', gd);
};
