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

    // pixels to move mouse before you stop clamping to starting point
    MINDRAG: 8,

    // smallest dimension allowed for a select box
    MINSELECT: 12,

    // smallest dimension allowed for a zoombox
    MINZOOM: 20,

    // width of axis drag regions
    DRAGGERSIZE: 20,

    // max pixels off straight before a lasso select line counts as bent
    BENDPX: 1.5,

    // delay before a redraw (relayout) after smooth panning and zooming
    REDRAWDELAY: 50,

    // last resort axis ranges for x and y axes if we have no data
    DFLTRANGEX: [-1, 6],
    DFLTRANGEY: [-1, 4]
};
