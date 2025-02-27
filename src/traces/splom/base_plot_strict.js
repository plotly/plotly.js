'use strict';

var basePlot = require('./base_plot');
var reglPrecompiled = require('./regl_precompiled');

Object.assign(basePlot.reglPrecompiled, reglPrecompiled);


module.exports = basePlot;
