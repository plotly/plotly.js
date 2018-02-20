/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

// IE9 fallback
var ab = (typeof ArrayBuffer === 'undefined' || !ArrayBuffer.isView) ?
    {isView: function() { return false; }} :
    ArrayBuffer;

exports.isArrayOrTypedArray = function(a) {
    return Array.isArray(a) || ab.isView(a);
};
