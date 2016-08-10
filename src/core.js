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
exports.version = '1.16.2';

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
exports.toImage = require('./plot_api/to_image');
exports.downloadImage = require('./snapshot/download');
exports.validate = require('./plot_api/validate');

// plot icons
exports.Icons = require('../build/ploticon');

// unofficial 'beta' plot methods, use at your own risk
exports.Plots = Plotly.Plots;
exports.Fx = Plotly.Fx;
exports.Snapshot = Plotly.Snapshot;
exports.PlotSchema = Plotly.PlotSchema;
exports.Queue = Plotly.Queue;

// export d3 used in the bundle
var d3 = exports.d3 = require('d3');

function attrsFunction(selection, map) {
  return selection.each(function() {
    var x = map.apply(this, arguments), s = d3.select(this);
    for (var name in x) s.attr(name, x[name]);
  });
}

function attrsObject(selection, map) {
  for (var name in map) selection.attr(name, map[name]);
  return selection;
}

d3.selection.prototype.attrs = function(map) {
  return (typeof map === "function" ? attrsFunction : attrsObject)(this, map);
};

function stylesFunction(selection, map, priority) {
  return selection.each(function() {
    var x = map.apply(this, arguments), s = d3.select(this);
    for (var name in x) s.style(name, x[name], priority);
  });
}

function stylesObject(selection, map, priority) {
  for (var name in map) selection.style(name, map[name], priority);
  return selection;
}

d3.selection.prototype.styles = function(map, priority) {
  return (typeof map === "function" ? stylesFunction : stylesObject)(this, map, priority == null ? "" : priority);
};
