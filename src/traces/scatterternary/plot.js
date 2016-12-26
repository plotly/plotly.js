/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var scatterPlot = require('../scatter/plot');


module.exports = function plot(ternary, data) {
    var plotContainer = ternary.plotContainer;

    // remove all nodes inside the scatter layer
    plotContainer.select('.scatterlayer').selectAll('*').remove();

    // mimic cartesian plotinfo
    var plotinfo = {
        xaxis: ternary.xaxis,
        yaxis: ternary.yaxis,
        plot: plotContainer
    };

    var calcdata = new Array(data.length),
        fullCalcdata = ternary.graphDiv.calcdata;

    for(var i = 0; i < fullCalcdata.length; i++) {
        var j = data.indexOf(fullCalcdata[i][0].trace);

        if(j === -1) continue;

        calcdata[j] = fullCalcdata[i];

        // while we're here and have references to both the Ternary object
        // and fullData, connect the two (for use by hover)
        data[j]._ternary = ternary;
    }

    scatterPlot(ternary.graphDiv, plotinfo, calcdata);
};
