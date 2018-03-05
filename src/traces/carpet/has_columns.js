/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isArrayOrTypedArray = require('../../lib').isArrayOrTypedArray;

module.exports = function(data) {
    return isArrayOrTypedArray(data[0]);
};
