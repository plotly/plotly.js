/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var CIRCLE_SIDES = 32;  // should be divisible by 4

module.exports = {
    CIRCLE_SIDES: CIRCLE_SIDES,
    i000: 0,
    i090: CIRCLE_SIDES / 4,
    i180: CIRCLE_SIDES / 2,
    i270: CIRCLE_SIDES / 4 * 3,
    cos45: Math.cos(Math.PI / 4),
    sin45: Math.sin(Math.PI / 4),
    SQRT2: Math.sqrt(2)
};
