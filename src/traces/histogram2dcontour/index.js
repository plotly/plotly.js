/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

Plotly.Plots.register(exports, 'histogram2dcontour',
    ['cartesian', '2dMap', 'contour', 'histogram'], {
        hrName: 'histogram_2d_contour',
        description: [
            'The sample data from which statistics are computed is set in `x`',
            'and `y` (where `x` and `y` represent marginal distributions,',
            'binning is set in `xbins` and `ybins` in this case)',
            'or `z` (where `z` represent the 2D distribution and binning set,',
            'binning is set by `x` and `y` in this case).',
            'The resulting distribution is visualized as a contour plot.'
        ].join(' ')
    }
);

exports.attributes = require('./attributes');

exports.supplyDefaults = require('./defaults');

exports.calc = require('../contour/calc');

exports.plot = require('../contour/plot');

exports.style = require('../contour/style');

exports.colorbar = require('../contour/colorbar');

exports.hoverPoints = require('../contour/hover');
