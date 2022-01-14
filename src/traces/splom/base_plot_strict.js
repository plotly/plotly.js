'use strict';

var base_plot = require('./base_plot');
var reglPrecompiled = require('./regl_precompiled');

Object.assign(base_plot.reglPrecompiled, reglPrecompiled);


module.exports = base_plot;