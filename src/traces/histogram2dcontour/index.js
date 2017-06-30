/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Histogram2dContour = {};

Histogram2dContour.attributes = require('./attributes');
Histogram2dContour.supplyDefaults = require('./defaults');
Histogram2dContour.calc = require('../contour/calc');
Histogram2dContour.plot = require('../contour/plot').plot;
Histogram2dContour.style = require('../contour/style');
Histogram2dContour.colorbar = require('../contour/colorbar');
Histogram2dContour.hoverPoints = require('../contour/hover');

Histogram2dContour.moduleType = 'trace';
Histogram2dContour.name = 'histogram2dcontour';
Histogram2dContour.basePlotModule = require('../../plots/cartesian');
Histogram2dContour.categories = ['cartesian', '2dMap', 'contour', 'histogram'];
Histogram2dContour.meta = {
    hrName: 'histogram_2d_contour',
    description: [
        'The sample data from which statistics are computed is set in `x`',
        'and `y` (where `x` and `y` represent marginal distributions,',
        'binning is set in `xbins` and `ybins` in this case)',
        'or `z` (where `z` represent the 2D distribution and binning set,',
        'binning is set by `x` and `y` in this case).',
        'The resulting distribution is visualized as a contour plot.'
    ].join(' ')
};

module.exports = Histogram2dContour;
