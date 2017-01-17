/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = function makeClipPath(xctrl, yctrl, aax, bax) {
    var i, xc, yc, x, y;
    var segments = [];

    var asmoothing = !!aax.smoothing;
    var bsmoothing = !!bax.smoothing;
    var nea1 = xctrl.length - 1;
    var neb1 = xctrl[0].length - 1;

    // Along the lower a axis:
    for(i = 0, x = [], y = []; i <= nea1; i++) {
        x[i] = xctrl[i][0];
        y[i] = yctrl[i][0];
    }
    segments.push({x: x, y: y, bicubic: asmoothing});

    // Along the upper b axis:
    xc = xctrl[nea1];
    yc = yctrl[nea1];
    for(i = 0, x = [], y = []; i <= neb1; i++) {
        x[i] = xc[i];
        y[i] = yc[i];
    }
    segments.push({x: x, y: y, bicubic: bsmoothing});

    // Backwards along the upper a axis:
    for(i = nea1, x = [], y = []; i >= 0; i--) {
        x[nea1 - i] = xctrl[i][neb1];
        y[nea1 - i] = yctrl[i][neb1];
    }
    segments.push({x: x, y: y, bicubic: asmoothing});

    // Backwards along the lower b axis:
    xc = xctrl[0];
    yc = yctrl[0];
    for(i = neb1, x = [], y = []; i >= 0; i--) {
        x[neb1 - i] = xc[i];
        y[neb1 - i] = yc[i];
    }
    segments.push({x: x, y: y, bicubic: bsmoothing});

    return segments;
};
