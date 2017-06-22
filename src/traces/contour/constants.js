/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';
module.exports = {
    // some constants to help with marching squares algorithm
    // where does the path start for each index?
    BOTTOMSTART: [1, 9, 13, 104, 713],
    TOPSTART: [4, 6, 7, 104, 713],
    LEFTSTART: [8, 12, 14, 208, 1114],
    RIGHTSTART: [2, 3, 11, 208, 1114],

    // which way [dx,dy] do we leave a given index?
    // saddles are already disambiguated
    NEWDELTA: [
        null, [-1, 0], [0, -1], [-1, 0],
        [1, 0], null, [0, -1], [-1, 0],
        [0, 1], [0, 1], null, [0, 1],
        [1, 0], [1, 0], [0, -1]
    ],

    // for each saddle, the first index here is used
    // for dx||dy<0, the second for dx||dy>0
    CHOOSESADDLE: {
        104: [4, 1],
        208: [2, 8],
        713: [7, 13],
        1114: [11, 14]
    },

    // after one index has been used for a saddle, which do we
    // substitute to be used up later?
    SADDLEREMAINDER: {1: 4, 2: 8, 4: 1, 7: 13, 8: 2, 11: 14, 13: 7, 14: 11}
};
