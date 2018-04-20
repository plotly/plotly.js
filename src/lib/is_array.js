/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

// IE9 fallbacks

var ab = (typeof ArrayBuffer === 'undefined' || !ArrayBuffer.isView) ?
    {isView: function() { return false; }} :
    ArrayBuffer;

var dv = (typeof DataView === 'undefined') ?
    function() {} :
    DataView;

function isTypedArray(a) {
    return ab.isView(a) && !(a instanceof dv);
}

function isArrayOrTypedArray(a) {
    return Array.isArray(a) || isTypedArray(a);
}

function is1D(a) {
    return !isArrayOrTypedArray(a[0]);
}

module.exports = {
    isTypedArray: isTypedArray,
    isArrayOrTypedArray: isArrayOrTypedArray,
    is1D: is1D
};
