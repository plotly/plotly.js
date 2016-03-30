/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

module.exports = {
    'linear': function(val) { return val; },
    'log': function(val) { return Math.log(val)/Math.log(10); },
    'date': function(val) { return Lib.dateTime2ms(val); },
    'category': function(_, i) { return i; }
};
