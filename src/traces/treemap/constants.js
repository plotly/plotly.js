/**
* Copyright 2012-2020, Plotly, Inc.
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
        'currentPath',
        'root',
        'entry',
        // no need to add 'parent' here

        // percentages i.e. ratios
        'percentRoot',
        'percentEntry',
        'percentParent'
    ],
    gapWithPathbar: 1 // i.e. one pixel
};
