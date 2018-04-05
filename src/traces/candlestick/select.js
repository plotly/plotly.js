/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = function selectPoints(searchInfo, polygon) {
    var cd = searchInfo.cd;
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var selection = [];
    var i;
    var posOffset = cd[0].t.bPos;

    if(polygon === false) {
        // clear selection
        for(i = 0; i < cd.length; i++) {
            cd[i].selected = 0;
        }
    } else {
        for(i = 0; i < cd.length; i++) {
            var di = cd[i];
            var y = (di.q1 + di.q3) / 2;

            if(polygon.contains([xa.c2p(di.pos + posOffset), ya.c2p(y)])) {
                selection.push({
                    pointNumber: di.i,
                    x: xa.c2d(di.pos),
                    y: ya.c2d(y)
                });
                di.selected = 1;
            } else {
                di.selected = 0;
            }
        }
    }

    return selection;
};
