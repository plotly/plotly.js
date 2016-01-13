/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/*
 * Export the plotly.js API methods.
 *
 * This file is browserify'ed into a standalone 'Plotly' object.
 *
 */

var Plotly = require('./plotly');

// export the version found in the package.json
exports.version = require('../package.json').version;

// plot api
exports.plot = Plotly.plot;
exports.newPlot = Plotly.newPlot;
exports.restyle = Plotly.restyle;
exports.relayout = Plotly.relayout;
exports.redraw = Plotly.redraw;
exports.extendTraces = Plotly.extendTraces;
exports.prependTraces = Plotly.prependTraces;
exports.addTraces = Plotly.addTraces;
exports.deleteTraces = Plotly.deleteTraces;
exports.moveTraces = Plotly.moveTraces;
exports.setPlotConfig = require('./plot_api/set_plot_config');

// plot icons
exports.Icons = require('../build/ploticon');

// unofficial 'beta' plot methods, use at your own risk
exports.Plots = Plotly.Plots;
exports.Fx = Plotly.Fx;
exports.Snapshot = Plotly.Snapshot;
exports.PlotSchema = Plotly.PlotSchema;
exports.Queue = Plotly.Queue;

// export d3 used in the bundle
exports.d3 = require('d3');

Plotly.register({
    traces: {
        bar: require('./traces/bar'),
        box: require('./traces/box'),
        heatmap: require('./traces/heatmap'),
        histogram: require('./traces/histogram'),
        histogram2d: require('./traces/histogram2d'),
        histogram2dcontour: require('./traces/histogram2dcontour'),
        pie: require('./traces/pie'),
        contour: require('./traces/contour'),
        scatter3d: require('./traces/scatter3d'),
        surface: require('./traces/surface'),
        mesh3d: require('./traces/mesh3d'),
        scattergeo: require('./traces/scattergeo'),
        choropleth: require('./traces/choropleth'),
        scattergl: require('./traces/scattergl')
    }
});
