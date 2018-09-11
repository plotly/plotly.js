/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var isPlainObject = require('./is_plain_object');

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

/*
 * Test whether an input object is 1D.
 *
 * Assumes we already know the object is an array.
 *
 * Looks only at the first element, if the dimensionality is
 * not consistent we won't figure that out here.
 */
function isArray1D(a) {
    return !isArrayOrTypedArray(a[0]);
}

function isTypedArrayEncoding(a) {
    return (isPlainObject(a) &&
        a.hasOwnProperty('dtype') && a.hasOwnProperty('value'));
}

module.exports = {
    isTypedArray: isTypedArray,
    isArrayOrTypedArray: isArrayOrTypedArray,
    isArray1D: isArray1D,
    isTypedArrayEncoding: isTypedArrayEncoding
};
