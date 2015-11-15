/*
 * Export the plotly.js API methods.
 *
 * This file is browserify'ed into a standalone 'Plotly' object.
 *
 */

var Plotly = require('./plotly');

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

// unofficial 'beta' plot methods, use at your own risk
exports.Plots = Plotly.Plots;
exports.Fx = Plotly.Fx;
exports.Snapshot = Plotly.Snapshot;
exports.PlotSchema = Plotly.PlotSchema;

// export d3 used in the bundle
exports.d3 = require('d3');
