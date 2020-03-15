/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isTypedArray = require('../../lib').isTypedArray;

exports.convertTypedArray = function(a) {
    return isTypedArray(a) ? Array.prototype.slice.call(a) : a;
};

exports.isOrdinal = function(dimension) {
    return !!dimension.tickvals;
};

exports.isVisible = function(dimension) {
    return dimension.visible || !('visible' in dimension);
};
