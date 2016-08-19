/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/**
 * Return true for arrays, whether they're untyped or not.
 */
module.exports = function isArray(a) {
    return Array.isArray(a) || ArrayBuffer.isView(a);
};
