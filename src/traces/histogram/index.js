/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

/** 
 * Histogram has its own calc function,
 * but uses Bars.plot to display
 * and Bars.setPositions for stacking and grouping
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

exports.layoutAttributes = require('../bars/layout_attributes');

exports.supplyDefaults = require('../bars/defaults');

exports.supplyLayoutDefaults = require('../bars/layout_defaults');

exports.calc = require('./calc');

exports.setPositions = require('../bars/set_positions');

exports.plot = require('../bars/plot');

exports.style = require('../bars/style');

exports.colorbar = require('../scatter/colorbar');

exports.hoverPoints = require('../bars/hover');
