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
 * @param {array} a
 * @param {array} b
 * @returns all elements of a that are not in b.
 *      If a is not an array, an empty array is returned.
 *      If b is not an array, a is returned.
 */
function difference(a, b) {
    if(!Array.isArray(a)) {
        return [];
    }
    if(!Array.isArray(b)) {
        return a;
    }
    return a.filter(function(e) {
        return b.indexOf(e) < 0;
    });
}

module.exports = {
    difference: difference
};
