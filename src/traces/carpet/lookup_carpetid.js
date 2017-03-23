
/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/*
 * Given a trace, look up the carpet axis by carpetid.
 */
module.exports = function (gd, trace) {
    var carpetid = trace.carpetid;

    var n = gd._fullData.length;
    var firstAxis;
    for (var i = 0; i < n; i++) {
        var maybeCarpet = gd._fullData[i];
        if (maybeCarpet.type === 'carpet') {
            if (!firstAxis) {
                firstAxis = maybeCarpet;
            }

            if (maybeCarpet.carpetid === trace.carpetid) {
                return maybeCarpet;
            }
        }
    }

    return firstAxis;
}
