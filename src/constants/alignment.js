/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

// fraction of some size to get to a named position
module.exports = {
    // from bottom left: this is the origin of our paper-reference
    // positioning system
    FROM_BL: {
        left: 0,
        center: 0.5,
        right: 1,
        bottom: 0,
        middle: 0.5,
        top: 1
    },
    // from top left: this is the screen pixel positioning origin
    FROM_TL: {
        left: 0,
        center: 0.5,
        right: 1,
        bottom: 1,
        middle: 0.5,
        top: 0
    },
    // multiple of fontSize to get the vertical offset between lines
    LINE_SPACING: 1.3
};
