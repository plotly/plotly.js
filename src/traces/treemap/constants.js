/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    CLICK_TRANSITION_TIME: 750,
    CLICK_TRANSITION_EASING: 'poly',
    eventDataKeys: [
        // string
        'root',
        'entry',
        // 'parent', // no need to add parent here which is added somewhere else!
        'currentPath',

        // percentages i.e. ratios
        'percentRoot',
        'percentEntry',
        'percentParent',

        // sums
        'sumRoot',
        'sumEntry',
        'sumParent'
    ],
    gapWithPathbar: 1 // i.e. one pixel
};
