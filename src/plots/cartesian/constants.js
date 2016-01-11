/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


module.exports = {
    // ms between first mousedown and 2nd mouseup to constitute dblclick...
    // we don't seem to have access to the system setting
    DBLCLICKDELAY: 600,

    // pixels to move mouse before you stop clamping to starting point
    MINDRAG: 8,

    // smallest dimension allowed for a select box
    MINSELECT: 12,

    // smallest dimension allowed for a zoombox
    MINZOOM: 20,

    // width of axis drag regions
    DRAGGERSIZE: 20,

    // max pixels away from mouse to allow a point to highlight
    MAXDIST: 20,

    // hover labels for multiple horizontal bars get tilted by this angle
    YANGLE: 60,

    // size and display constants for hover text
    HOVERARROWSIZE: 6, // pixel size of hover arrows
    HOVERTEXTPAD: 3, // pixels padding around text
    HOVERFONTSIZE: 13,
    HOVERFONT: 'Arial, sans-serif',

    // minimum time (msec) between hover calls
    HOVERMINTIME: 100,

    // max pixels off straight before a lasso select line counts as bent
    BENDPX: 1.5
};
