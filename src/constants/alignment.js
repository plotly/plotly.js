/**
* Copyright 2012-2018, Plotly, Inc.
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
    // from bottom right: sometimes you just need the opposite of ^^
    FROM_BR: {
        left: 1,
        center: 0.5,
        right: 0,
        bottom: 0,
        middle: 0.5,
        top: 1
    },
    // multiple of fontSize to get the vertical offset between lines
    LINE_SPACING: 1.3,

    // multiple of fontSize to shift from the baseline to the midline
    // (to use when we don't calculate this shift from Drawing.bBox)
    // To be precise this should be half the cap height (capital letter)
    // of the font, and according to wikipedia:
    //   an "average" font might have a cap height of 70% of the em
    // https://en.wikipedia.org/wiki/Em_(typography)#History
    MID_SHIFT: 0.35,

    OPPOSITE_SIDE: {
        left: 'right',
        right: 'left',
        top: 'bottom',
        bottom: 'top'
    }
};
