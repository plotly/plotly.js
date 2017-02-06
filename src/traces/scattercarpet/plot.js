/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var scatterPlot = require('../scatter/plot');
var Axes = require('../../plots/cartesian/axes');

module.exports = function plot(gd, plotinfoproxy, data) {
    var i, trace, node;

    var carpet = data[0][0].carpet;

    // mimic cartesian plotinfo
    var plotinfo = {
        xaxis: Axes.getFromId(gd, carpet.xaxis || 'x'),
        yaxis: Axes.getFromId(gd, carpet.yaxis || 'y'),
        plot: plotinfoproxy.plot
    };

    scatterPlot(plotinfo.graphDiv, plotinfo, data);

    for(i = 0; i < data.length; i++) {
        trace = data[i][0].trace;

        // Note: .select is adequate but seems to mutate the node data,
        // which is at least a bit suprising and causes problems elsewhere
        node = plotinfo.plot.selectAll('g.trace' + trace.uid + ' .js-line');

        // Note: it would be more efficient if this didn't need to be applied
        // separately to all scattercarpet traces, but that would require
        // lots of reorganization of scatter traces that is otherwise not
        // necessary. That makes this a potential optimization.
        node.attr('clip-path', 'url(#clip' + carpet.uid + 'carpet)');
    }
};
