/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

/**
 * Histogram has its own attribute, defaults and calc steps,
 * but uses bar's plot to display
 * and bar's setPositions for stacking and grouping
 */

/**
 * histogram errorBarsOK is debatable, but it's put in for backward compat.
 * there are use cases for it - sqrt for a simple histogram works right now,
 * constant and % work but they're not so meaningful. I guess it could be cool
 * to allow quadrature combination of errors in summed histograms...
 */


var Histogram = {};

Histogram.attributes = require('./attributes');
Histogram.layoutAttributes = require('../bar/layout_attributes');
Histogram.supplyDefaults = require('./defaults');
Histogram.supplyLayoutDefaults = require('../bar/layout_defaults');
Histogram.calc = require('./calc');
Histogram.setPositions = require('../bar/set_positions');
Histogram.plot = require('../bar/plot');
Histogram.style = require('../bar/style');
Histogram.colorbar = require('../scatter/colorbar');
Histogram.hoverPoints = require('../bar/hover');

Histogram.moduleType = 'trace';
Histogram.name = 'histogram';
Histogram.basePlotModule = require('../../plots/cartesian');
Histogram.categories = ['cartesian', 'bar', 'histogram', 'oriented', 'errorBarsOK', 'showLegend'];
Histogram.meta = {
    description: [
        'The sample data from which statistics are computed is set in `x`',
        'for vertically spanning histograms and',
        'in `y` for horizontally spanning histograms.',
        'Binning options are set `xbins` and `ybins` respectively',
        'if no aggregation data is provided.'
    ].join(' ')
};

module.exports = Histogram;
