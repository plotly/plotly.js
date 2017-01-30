/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var scatterPlot = require('../scatter/plot');


module.exports = function plot(ternary, moduleCalcData) {
    var plotContainer = ternary.plotContainer;

    // remove all nodes inside the scatter layer
    plotContainer.select('.scatterlayer').selectAll('*').remove();

    // mimic cartesian plotinfo
    var plotinfo = {
        xaxis: ternary.xaxis,
        yaxis: ternary.yaxis,
        plot: plotContainer
    };

    // add ref to ternary subplot object in fullData traces
    for(var i = 0; i < moduleCalcData.length; i++) {
        moduleCalcData[i][0].trace._ternary = ternary;
    }

    scatterPlot(ternary.graphDiv, plotinfo, moduleCalcData);
};
