/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    // max pixels away from mouse to allow a point to highlight
    MAXDIST: 20,

    // hover labels for multiple horizontal bars get tilted by this angle
    YANGLE: 60,

    // size and display constants for hover text

    // pixel size of hover arrows
    HOVERARROWSIZE: 6,
    // pixels padding around text
    HOVERTEXTPAD: 3,
    // hover font
    HOVERFONTSIZE: 13,
    HOVERFONT: 'Arial, sans-serif',

    // minimum time (msec) between hover calls
    HOVERMINTIME: 50
};
