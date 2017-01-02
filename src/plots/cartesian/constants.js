/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


module.exports = {

    idRegex: {
        x: /^x([2-9]|[1-9][0-9]+)?$/,
        y: /^y([2-9]|[1-9][0-9]+)?$/
    },

    attrRegex: {
        x: /^xaxis([2-9]|[1-9][0-9]+)?$/,
        y: /^yaxis([2-9]|[1-9][0-9]+)?$/
    },

    // axis match regular expression
    xAxisMatch: /^xaxis[0-9]*$/,
    yAxisMatch: /^yaxis[0-9]*$/,

    // pattern matching axis ids and names
    AX_ID_PATTERN: /^[xyz][0-9]*$/,
    AX_NAME_PATTERN: /^[xyz]axis[0-9]*$/,

    // ms between first mousedown and 2nd mouseup to constitute dblclick...
    // we don't seem to have access to the system setting
    DBLCLICKDELAY: 300,

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
    HOVERMINTIME: 50,

    // max pixels off straight before a lasso select line counts as bent
    BENDPX: 1.5,

    // delay before a redraw (relayout) after smooth panning and zooming
    REDRAWDELAY: 50,

    // last resort axis ranges for x and y axes if we have no data
    DFLTRANGEX: [-1, 6],
    DFLTRANGEY: [-1, 4]
};
