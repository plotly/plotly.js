/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

// returns true for a valid value object and false for tree nodes in the attribute hierarchy
module.exports = function(obj) {
    return obj && obj.valType !== undefined;
};
