/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/**
 * sanitized modulus function that always returns in the range [0, d)
 * rather than (-d, 0] if v is negative
 */
function mod(v, d) {
    var out = v % d;
    return out < 0 ? out + d : out;
}

/**
 * sanitized modulus function that always returns in the range [-1.5*d, 1.5*d]
 * rather than (-d, 0] if v is negative
 */
function modHalf(v, d) {
    var d2 = 2 * d;
    return Math.abs(v) > d ?
        v - Math.round(v / d2) * d2 :
        v;
}

module.exports = {
    mod: mod,
    modHalf: modHalf
};
