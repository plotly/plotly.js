/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

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

Plotly.Plots.register(exports, 'histogram',
    ['cartesian', 'bar', 'histogram', 'oriented', 'errorBarsOK', 'showLegend'], {
    description: [
        'The sample data from which statistics are computed is set in `x`',
        'for vertically spanning histograms and',
        'in `y` for horizontally spanning histograms.',

        'Binning options are set `xbins` and `ybins` respectively',
        'if no aggregation data is provided.'
    ].join(' ')
});

exports.attributes = require('./attributes');

exports.layoutAttributes = require('../bar/layout_attributes');

exports.supplyDefaults = require('./defaults');

exports.supplyLayoutDefaults = require('../bar/layout_defaults');

exports.calc = require('./calc');

exports.setPositions = require('../bar/set_positions');

exports.plot = require('../bar/plot');

exports.style = require('../bar/style');

exports.colorbar = require('../scatter/colorbar');

exports.hoverPoints = require('../bar/hover');
