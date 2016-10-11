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

// configuration
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
exports.Sliders = require('./components/sliders');
exports.ModeBar = require('./components/modebar');

// plot api
require('./plot_api/plot_api');
