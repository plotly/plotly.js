/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = function flipScale(scl) {
    var N = scl.length,
        sclNew = new Array(N),
        si;

    for(var i = N-1, j = 0; i >= 0; i--, j++) {
        si = scl[i];
        sclNew[j] = [1 - si[0], si[1]];
    }

    return sclNew;
};
