/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Colorscale = require('../../components/colorscale');


// Compute auto-z and autocolorscale if applicable
module.exports = function calc(gd, trace) {
    Colorscale.calc(trace, trace.z, '', 'z');
};
