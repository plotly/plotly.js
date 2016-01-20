/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/*
 * This file is browserify'ed into a standalone 'Plotly' object.
 */

var Core = require('./core');

// package version injected by `npm run preprocess`
exports.version = '1.4.1';

// Load all trace modules
Core.register([
    require('./traces/bar'),
    require('./traces/box'),
    require('./traces/heatmap'),
    require('./traces/histogram'),
    require('./traces/histogram2d'),
    require('./traces/histogram2dcontour'),
    require('./traces/pie'),
    require('./traces/contour'),
    require('./traces/scatter3d'),
    require('./traces/surface'),
    require('./traces/mesh3d'),
    require('./traces/scattergeo'),
    require('./traces/choropleth'),
    require('./traces/scattergl')
]);

module.exports = Core;
