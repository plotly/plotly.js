'use strict';

var Plotly = require('../../plotly');

var ScatterGl = module.exports = {};

ScatterGl.attributes = {};

Plotly.Plots.register(ScatterGl, 'scattergl', ['gl2d']);

ScatterGl.supplyDefaults = function (traceIn, traceOut, defaultColor, layout) {

};
