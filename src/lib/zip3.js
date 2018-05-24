/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function zip3(x, y, z) {
    var result = new Array(x.length);
    for(var i = 0; i < x.length; i++) {
        result[i] = [x[i], y[i], z[i]];
    }
    return result;
};
