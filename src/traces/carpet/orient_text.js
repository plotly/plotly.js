/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = function orientText(carpet, xaxis, yaxis, xy, dxy) {
    var dx = dxy[0] * carpet.dpdx(xaxis);
    var dy = dxy[1] * carpet.dpdy(yaxis);
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
        p: carpet.c2p(xy, xaxis, yaxis)
    };
};
