'use strict';

var scatterPlot = require('../scatter/plot');
var Axes = require('../../plots/cartesian/axes');
var Drawing = require('../../components/drawing');

module.exports = function plot(gd, plotinfoproxy, data, layer) {
    var i, trace, node;

    var carpet = data[0][0].carpet;

    var xaxis = Axes.getFromId(gd, carpet.xaxis || 'x');
    var yaxis = Axes.getFromId(gd, carpet.yaxis || 'y');

    // mimic cartesian plotinfo
    var plotinfo = {
        xaxis: xaxis,
        yaxis: yaxis,
        plot: plotinfoproxy.plot,
    };

    for(i = 0; i < data.length; i++) {
        trace = data[i][0].trace;

        trace._xA = xaxis;
        trace._yA = yaxis;
    }

    scatterPlot(gd, plotinfo, data, layer);

    for(i = 0; i < data.length; i++) {
        trace = data[i][0].trace;

        // Note: .select is adequate but seems to mutate the node data,
        // which is at least a bit surprising and causes problems elsewhere
        node = layer.selectAll('g.trace' + trace.uid + ' .js-line');

        // Note: it would be more efficient if this didn't need to be applied
        // separately to all scattercarpet traces, but that would require
        // lots of reorganization of scatter traces that is otherwise not
        // necessary. That makes this a potential optimization.
        Drawing.setClipUrl(node, data[i][0].carpet._clipPathId, gd);
    }
};
