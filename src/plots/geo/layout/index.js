'use strict';

var Plotly = require('../../../plotly');
var attributes = require('./attributes');

Plotly.Plots.registerSubplot('geo', 'geo', 'geo', attributes);

exports.layoutAttributes = require('./layout_attributes');
exports.supplyLayoutDefaults = require('./defaults');
