/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = {
    // padding in pixels around text
    TEXTPAD: 3,
    // 'value' and 'label' are not really necessary for bar traces,
    // but they were made available to `texttemplate` (maybe by accident)
    // via tokens `%{value}` and `%{label}` starting in 1.50.0,
    // so let's include them in the event data also.
    eventDataKeys: ['value', 'label']
};
