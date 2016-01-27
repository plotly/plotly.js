/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Histogram2D = {};

Histogram2D.attributes = require('./attributes');
Histogram2D.supplyDefaults = require('./defaults');
Histogram2D.calc = require('../heatmap/calc');
Histogram2D.plot = require('../heatmap/plot');
Histogram2D.colorbar = require('../heatmap/colorbar');
Histogram2D.style = require('../heatmap/style');
Histogram2D.hoverPoints = require('../heatmap/hover');

Histogram2D.moduleType = 'trace';
Histogram2D.name = 'histogram2d';
Histogram2D.basePlotModule = require('../../plots/cartesian');
Histogram2D.categories = ['cartesian', '2dMap', 'histogram'];
Histogram2D.meta = {
    hrName: 'histogram_2d',
    description: [
        'The sample data from which statistics are computed is set in `x`',
        'and `y` (where `x` and `y` represent marginal distributions,',
        'binning is set in `xbins` and `ybins` in this case)',
        'or `z` (where `z` represent the 2D distribution and binning set,',
        'binning is set by `x` and `y` in this case).',
        'The resulting distribution is visualized as a heatmap.'
    ].join(' ')
};

module.exports = Histogram2D;
