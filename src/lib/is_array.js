/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/**
 * Return true for arrays, whether they're untyped or not.
 */

// IE9 fallback
var ab = (typeof ArrayBuffer === 'undefined' || !ArrayBuffer.isView) ?
    {isView: function() { return false; }} :
    ArrayBuffer;

module.exports = function isArray(a) {
    return Array.isArray(a) || ab.isView(a);
};
