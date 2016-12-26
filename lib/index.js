/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Plotly = require('./core');

// traces
Plotly.register([
    require('./bar'),
    require('./box'),
    require('./heatmap'),
    require('./histogram'),
    require('./histogram2d'),
    require('./histogram2dcontour'),
    require('./pie'),
    require('./contour'),
    require('./scatterternary'),

    require('./scatter3d'),
    require('./surface'),
    require('./mesh3d'),

    require('./scattergeo'),
    require('./choropleth'),

    require('./scattergl'),
    require('./pointcloud'),
    require('./heatmapgl'),

    require('./scattermapbox'),

    require('./ohlc'),
    require('./candlestick')
]);

// transforms
//
// Please note that all *transform* methods are executed before
// all *calcTransform* methods - which could possibly lead to
// unexpected results when applying multiple transforms of different types
// to a given trace.
//
// For more info, see:
// https://github.com/plotly/plotly.js/pull/978#pullrequestreview-2403353
//
Plotly.register([
    require('./filter'),
    require('./groupby')
]);

// components
Plotly.register([
    require('./calendars')
]);

module.exports = Plotly;
