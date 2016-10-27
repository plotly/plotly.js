/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

/**
 * Extract colorscale into numeric domain and color range.
 *
 * @param {array} scl colorscale array of arrays
 * @param {number} cmin minimum color value (used to clamp scale)
 * @param {number} cmax maximum color value (used to clamp scale)
 */
module.exports = function extractScale(scl, cmin, cmax) {
    var N = scl.length,
        domain = new Array(N),
        range = new Array(N);

    for(var i = 0; i < N; i++) {
        var si = scl[i];

        domain[i] = cmin + si[0] * (cmax - cmin);
        range[i] = si[1];
    }

    return {
        domain: domain,
        range: range
    };
};
