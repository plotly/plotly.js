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

    if(polygon === false) {
        // clear selection
        for(i = 0; i < cd.length; i++) {
            cd[i].selected = 0;
        }
    } else {
        for(i = 0; i < cd.length; i++) {
            var di = cd[i];

            if(polygon.contains(di.ct)) {
                selection.push({
                    pointNumber: i,
                    x: xa.c2d(di.x),
                    y: ya.c2d(di.y)
                });
                di.selected = 1;
            } else {
                di.selected = 0;
            }
        }
    }

    return selection;
};
