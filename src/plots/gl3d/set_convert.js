/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');
var Axes = require('../cartesian/axes');


module.exports = function setConvert(containerOut) {
    Axes.setConvert(containerOut);
    containerOut.setScale = Lib.noop;
};
