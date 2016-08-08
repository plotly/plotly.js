/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/*
 * Pack internal modules unto an object.
 *
 * This object is require'ed in as 'Plotly' in numerous src and test files.
 * Require'ing 'Plotly' bypasses circular dependencies.
 *
 * Future development should move away from this pattern.
 *
 */

// promise polyfill
require('es6-promise').polyfill();

// lib functions
exports.Lib = require('./lib');
exports.util = require('./lib/svg_text_utils');
exports.Queue = require('./lib/queue');

// plot css
require('../build/plotcss');

// configuration
exports.MathJaxConfig = require('./fonts/mathjax_config');
exports.defaultConfig = require('./plot_api/plot_config');

// plots
exports.Plots = require('./plots/plots');
exports.Axes = require('./plots/cartesian/axes');
exports.Fx = require('./plots/cartesian/graph_interact');

// components
exports.Color = require('./components/color');
exports.Drawing = require('./components/drawing');
exports.Colorscale = require('./components/colorscale');
exports.Colorbar = require('./components/colorbar');
exports.ErrorBars = require('./components/errorbars');
exports.Annotations = require('./components/annotations');
exports.Shapes = require('./components/shapes');
exports.Legend = require('./components/legend');
exports.Images = require('./components/images');
exports.UpdateMenus = require('./components/updatemenus');
exports.ModeBar = require('./components/modebar');

// plot api
require('./plot_api/plot_api');
exports.PlotSchema = require('./plot_api/plot_schema');

// imaging routines
exports.Snapshot = require('./snapshot');
