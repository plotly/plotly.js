/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/**
 * Truncate a Float32Array to some length. A wrapper to support environments
 * (e.g. node-webkit) that do not implement Float32Array.prototype.slice
 */
module.exports = function truncate(float32ArrayIn, len) {
    // for some reason, ES2015 Float32Array.prototype.slice takes 2x as long...
    // therefore we aren't checking for its existence
    var float32ArrayOut = new Float32Array(len);
    for(var i = 0; i < len; i++) float32ArrayOut[i] = float32ArrayIn[i];
    return float32ArrayOut;
};
