'use strict';

var plot = require('./plot');

var reglPrecompiled = require('./regl_precompiled');

var reglPrecompiledDep = require('../scattergl/regl_precompiled');

Object.assign(plot.reglPrecompiled, reglPrecompiled);

Object.assign(plot.reglPrecompiled, reglPrecompiledDep);

module.exports = plot;
