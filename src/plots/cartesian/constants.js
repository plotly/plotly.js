/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';
var counterRegex = require('../../lib').counterRegex;


module.exports = {

    idRegex: {
        x: counterRegex('x'),
        y: counterRegex('y')
    },

    attrRegex: counterRegex('[xy]axis'),

    // axis match regular expression
    xAxisMatch: counterRegex('xaxis'),
    yAxisMatch: counterRegex('yaxis'),

    // pattern matching axis ids and names
    // note that this is more permissive than counterRegex, as
    // id2name, name2id, and cleanId accept "x1" etc
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

    // throttling limit (ms) for selectPoints calls
    SELECTDELAY: 100,

    // cache ID suffix for throttle
    SELECTID: '-select',

    // last resort axis ranges for x and y axes if we have no data
    DFLTRANGEX: [-1, 6],
    DFLTRANGEY: [-1, 4],

    // Layers to keep trace types in the right order.
    // from back to front:
    // 1. heatmaps, 2D histos and contour maps
    // 2. bars / 1D histos
    // 3. errorbars for bars and scatter
    // 4. scatter
    // 5. box plots
    traceLayerClasses: [
        'imagelayer',
        'maplayer',
        'barlayer',
        'carpetlayer',
        'boxlayer',
        'scatterlayer'
    ],

    layerValue2layerClass: {
        'above traces': 'above',
        'below traces': 'below'
    }
};
