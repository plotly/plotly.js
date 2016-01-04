/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = function maxRowLength(z) {
    var len = 0;

    for(var i = 0; i < z.length; i++) {
        len = Math.max(len, z[i].length);
    }

    return len;
};
