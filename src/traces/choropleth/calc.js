/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var colorscaleCalc = require('../../components/colorscale/calc');


module.exports = function calc(gd, trace) {
    colorscaleCalc(trace, trace.z, '', 'z');
};
