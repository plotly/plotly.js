/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

Plotly.Plots.register(exports, 'histogram2d',
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
});

exports.attributes = require('../heatmap/attributes');

exports.supplyDefaults = require('../heatmap/defaults');

exports.calc = require('../heatmap/calc');

exports.plot = require('../heatmap/plot');

exports.colorbar = require('../heatmap/colorbar');

exports.style = require('../heatmap/style');

exports.hoverPoints = require('../heatmap/hover');
