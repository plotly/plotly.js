/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/*
 * Ensures an array has the right amount of storage space. If it doesn't
 * exist, it creates an array. If it does exist, it returns it if too
 * short or truncates it in-place.
 *
 * The goal is to just reuse memory to avoid a bit of excessive garbage
 * collection.
 */
module.exports = function ensureArray(out, n) {
    if(!Array.isArray(out)) out = [];

    // If too long, truncate. (If too short, it will grow
    // automatically so we don't care about that case)
    out.length = n;

    return out;
};
