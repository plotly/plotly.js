'use strict';

var Plotly = require('../../../plotly');
var traceAttributes = require('./trace_attributes');

Plotly.Plots.registerSubplot('geo', 'geo', 'geo', traceAttributes);

exports.layoutAttributes = require('./attributes');
exports.supplyLayoutDefaults = require('./defaults');
