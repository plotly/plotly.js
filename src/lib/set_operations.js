/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


/**
 * Computes the set difference of two arrays.
 *
 * @param {array} a
 * @param {array} b
 * @returns out all elements of a that are not in b.
 *      If a is not an array, an empty array is returned.
 *      If b is not an array, a is returned.
 */
function difference(a, b) {
    if(!Array.isArray(a)) return [];
    if(!Array.isArray(b)) return a;

    var hash = {};
    var out = [];
    var i;

    for(i = 0; i < b.length; i++) {
        hash[b[i]] = 1;
    }

    for(i = 0; i < a.length; i++) {
        var ai = a[i];
        if(!hash[ai]) out.push(ai);
    }

    return out;
}

module.exports = {
    difference: difference
};
