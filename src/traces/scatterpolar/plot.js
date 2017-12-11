/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterPlot = require('../scatter/plot');

module.exports = function plot(subplot, moduleCalcData) {
    var xa = subplot.xaxis;
    var ya = subplot.yaxis;
    var radius = subplot.radius;

    var plotinfo = {
        xaxis: xa,
        yaxis: ya,
        plot: subplot.framework,
        layerClipId: subplot.hasClipOnAxisFalse ? subplot.clipIds.circle : null
    };

    scatterPlot(subplot.graphDiv, plotinfo, moduleCalcData);
};
