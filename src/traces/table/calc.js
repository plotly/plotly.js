/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var wrap = require('../../lib/gup').wrap;

module.exports = function calc(gd, trace) {
    return wrap(trace);
};
