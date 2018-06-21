/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


/*
 * Computes the set difference of two arrays.
 *
 * Returns all elements of a that are not in b.
 */
function difference(a, b) {
    return a.filter(function(e) {
        return b.indexOf(e) < 0;
    });
}

module.exports = {
    difference: difference
};
