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
module.exports = function mod(v, d) {
    var out = v % d;
    return out < 0 ? out + d : out;
};
