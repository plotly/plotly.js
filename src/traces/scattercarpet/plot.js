/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var scatterPlot = require('../scatter/plot');
var Axes = require('../../plots/cartesian/axes');

module.exports = function plot(gd, plotinfoproxy, data) {

    var carpet = data[0][0].carpet;

    // mimic cartesian plotinfo
    var plotinfo = {
        xaxis: Axes.getFromId(gd, carpet.xaxis || 'x'),
        yaxis: Axes.getFromId(gd, carpet.yaxis || 'y'),
        plot: plotinfoproxy.plot
    };

    /* var calcdata = new Array(data.length),
        fullCalcdata = gd.calcdata;

    for(var i = 0; i < fullCalcdata.length; i++) {
        var j = data.indexOf(fullCalcdata[i][0].trace);

        if(j === -1) continue;

        calcdata[j] = fullCalcdata[i];

        // while we're here and have references to both the Carpet object
        // and fullData, connect the two (for use by hover)
        data[j]._carpet = plotinfo;
    }*/

    scatterPlot(plotinfo.graphDiv, plotinfo, data);
};
