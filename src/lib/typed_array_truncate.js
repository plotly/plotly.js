/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

function truncateFloat32(arrayIn, len) {
    var arrayOut = new Float32Array(len);
    for(var i = 0; i < len; i++) arrayOut[i] = arrayIn[i];
    return arrayOut;
}

function truncateFloat64(arrayIn, len) {
    var arrayOut = new Float64Array(len);
    for(var i = 0; i < len; i++) arrayOut[i] = arrayIn[i];
    return arrayOut;
}

/**
 * Truncate a typed array to some length.
 * For some reason, ES2015 Float32Array.prototype.slice takes
 * 2x as long, therefore we aren't checking for its existence
 */
module.exports = function truncate(arrayIn, len) {
    if(arrayIn instanceof Float32Array) return truncateFloat32(arrayIn, len);
    if(arrayIn instanceof Float64Array) return truncateFloat64(arrayIn, len);
    throw new Error('This array type is not yet supported by `truncate`.');
};
