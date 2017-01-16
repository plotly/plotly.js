/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function(f, t) {
    var ot2, ot3, t2, t3;
    var ot = 1 - t;

    switch(f.length) {
        case 4:
            ot2 = ot * ot;
            ot3 = ot2 * ot;
            t2 = t * t;
            t3 = t2 * t;
            return f[0] * ot3 + 3 * (f[1] * ot2 * t + f[2] * ot * t2) + t3 * f[3];
        case 3:
            ot2 = ot * ot;
            t2 = t * t;
            return f[0] * ot2 + 2 * f[1] * ot * t + t2 * f[2];
        case 2:
            return ot * f[0] + t * f[1];
    }
};
