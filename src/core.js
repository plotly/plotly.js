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
 */

var Plotly = require('./plotly');

// package version injected by `npm run preprocess`
exports.version = '1.10.0';

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
exports.purge = Plotly.purge;
exports.setPlotConfig = require('./plot_api/set_plot_config');
exports.register = Plotly.register;

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
