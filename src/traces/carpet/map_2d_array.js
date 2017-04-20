/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/*
 * Map an array of x or y coordinates (c) to screen-space pixel coordinates (p).
 * The output array is optional, but if provided, it will be reused without
 * reallocation to the extent possible.
 */
module.exports = function mapArray(out, data, func) {
    var i, j;

    if(!Array.isArray(out)) {
        // If not an array, make it an array:
        out = [];
    } else if(out.length > data.length) {
        // If too long, truncate. (If too short, it will grow
        // automatically so we don't care about that case)
        out = out.slice(0, data.length);
    }

    for(i = 0; i < data.length; i++) {
        if(!Array.isArray(out[i])) {
            // If not an array, make it an array:
            out[i] = [];
        } else if(out[i].length > data.length) {
            // If too long, truncate. (If too short, it will grow
            // automatically so we don't care about[i] that case)
            out[i] = out[i].slice(0, data.length);
        }

        for(j = 0; j < data[0].length; j++) {
            out[i][j] = func(data[i][j]);
        }
    }
    return out;
};
