'use strict';

var Plotly = require('../../plotly');

var Gl2dLayout = module.exports = {};

Plotly.Plots.registerSubplot('gl2d', ['xaxis', 'yaxis'], ['x', 'y'],
    Plotly.Axes.traceAttributes);
