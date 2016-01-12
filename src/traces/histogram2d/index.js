/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plots = require('../../plots/plots');

var Histogram2D = {};

Plots.register(Histogram2D, 'histogram2d',
    ['cartesian', '2dMap', 'histogram'], {
        hrName: 'histogram_2d',
        description: [
            'The sample data from which statistics are computed is set in `x`',
            'and `y` (where `x` and `y` represent marginal distributions,',
            'binning is set in `xbins` and `ybins` in this case)',
            'or `z` (where `z` represent the 2D distribution and binning set,',
            'binning is set by `x` and `y` in this case).',
            'The resulting distribution is visualized as a heatmap.'
        ].join(' ')
    }
);

Histogram2D.attributes = require('./attributes');
Histogram2D.supplyDefaults = require('./defaults');
Histogram2D.calc = require('../heatmap/calc');
Histogram2D.plot = require('../heatmap/plot');
Histogram2D.colorbar = require('../heatmap/colorbar');
Histogram2D.style = require('../heatmap/style');
Histogram2D.hoverPoints = require('../heatmap/hover');

module.exports = Histogram2D;
