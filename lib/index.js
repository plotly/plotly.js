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

// Load all trace modules
Core.register([
    require('./bar'),
    require('./box'),
    require('./heatmap'),
    require('./histogram'),
    require('./histogram2d'),
    require('./histogram2dcontour'),
    require('./pie'),
    require('./contour'),
    require('./scatter3d'),
    require('./surface'),
    require('./mesh3d'),
    require('./scattergeo'),
    require('./choropleth'),
    require('./scattergl')
]);

module.exports = Core;
