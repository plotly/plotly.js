/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/*
 * Export the plotly.js API methods.
 */

var Plotly = require('./plotly');

// package version injected by `npm run preprocess`
exports.version = '1.31.2';

// inject promise polyfill
require('es6-promise').polyfill();

// inject plot css
require('../build/plotcss');

// inject default MathJax config
require('./fonts/mathjax_config');

// plot api
exports.plot = Plotly.plot;
exports.newPlot = Plotly.newPlot;
exports.restyle = Plotly.restyle;
exports.relayout = Plotly.relayout;
exports.redraw = Plotly.redraw;
exports.update = Plotly.update;
exports.extendTraces = Plotly.extendTraces;
exports.prependTraces = Plotly.prependTraces;
exports.addTraces = Plotly.addTraces;
exports.deleteTraces = Plotly.deleteTraces;
exports.moveTraces = Plotly.moveTraces;
exports.purge = Plotly.purge;
exports.setPlotConfig = require('./plot_api/set_plot_config');
exports.register = require('./plot_api/register');
exports.toImage = require('./plot_api/to_image');
exports.downloadImage = require('./snapshot/download');
exports.validate = require('./plot_api/validate');
exports.addFrames = Plotly.addFrames;
exports.deleteFrames = Plotly.deleteFrames;
exports.animate = Plotly.animate;

// scatter is the only trace included by default
exports.register(require('./traces/scatter'));

// register all registrable components modules
exports.register([
    require('./components/fx'),
    require('./components/legend'),
    require('./components/annotations'),
    require('./components/annotations3d'),
    require('./components/shapes'),
    require('./components/images'),
    require('./components/updatemenus'),
    require('./components/sliders'),
    require('./components/rangeslider'),
    require('./components/rangeselector')
]);

// plot icons
exports.Icons = require('../build/ploticon');

// unofficial 'beta' plot methods, use at your own risk
exports.Plots = Plotly.Plots;
exports.Fx = require('./components/fx');
exports.Snapshot = require('./snapshot');
exports.PlotSchema = require('./plot_api/plot_schema');
exports.Queue = require('./lib/queue');

// export d3 used in the bundle
exports.d3 = require('d3');
