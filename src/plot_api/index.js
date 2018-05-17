/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var main = require('./plot_api');

exports.plot = main.plot;
exports.newPlot = main.newPlot;
exports.restyle = main.restyle;
exports.relayout = main.relayout;
exports.redraw = main.redraw;
exports.update = main.update;
exports.react = main.react;
exports.extendTraces = main.extendTraces;
exports.prependTraces = main.prependTraces;
exports.addTraces = main.addTraces;
exports.deleteTraces = main.deleteTraces;
exports.moveTraces = main.moveTraces;
exports.purge = main.purge;
exports.addFrames = main.addFrames;
exports.deleteFrames = main.deleteFrames;
exports.animate = main.animate;
exports.setPlotConfig = main.setPlotConfig;

exports.toImage = require('./to_image');
exports.validate = require('./validate');
exports.downloadImage = require('../snapshot/download');
exports.makeTemplate = require('./plot_template').makeTemplate;
exports.applyTemplate = require('./plot_template').applyTemplate;
