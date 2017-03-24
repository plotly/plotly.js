/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = function orientText(trace, xaxis, yaxis, xy, dxy) {
    var dx = dxy[0] * trace.dpdx(xaxis);
    var dy = dxy[1] * trace.dpdy(yaxis);
    var flip = 1;

    var angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if(angle < -90) {
        angle += 180;
        flip = -flip;
    } else if(angle > 90) {
        angle -= 180;
        flip = -flip;
    }

    return {
        angle: angle,
        flip: flip,
        p: trace.c2p(xy, xaxis, yaxis)
    };
};
