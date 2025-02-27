'use strict';

var plot = require('./plot');

var reglPrecompiled = require('./regl_precompiled');

Object.assign(plot.reglPrecompiled, reglPrecompiled);

module.exports = plot;
