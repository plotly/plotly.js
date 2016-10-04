/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Plotly = require('./core');

Plotly.register([
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
    require('./scattergl'),
    require('./pointcloud'),
    require('./scatterternary'),
    require('./scattermapbox')
]);

// add transforms
Plotly.register([
    require('./filter')
]);

module.exports = Plotly;
