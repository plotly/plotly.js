/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function (na, nb, cheaterslope) {
    var i, j;
    var data = [];

    for (i = 0; i < na; i++) {
        data[i] = [];
        for (j = 0; j < nb; j++) {
            data[i][j] = i - j * cheaterslope;
        }
    }

    return data;
}
