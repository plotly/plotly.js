/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Plotly = require('../../plotly');

Plotly.Plots.register(exports, 'box',
    ['cartesian', 'symbols', 'oriented', 'box', 'showLegend'], {
        description: [
            'In vertical (horizontal) box plots,',
            'statistics are computed using `y` (`x`) values.',
            'By supplying an `x` (`y`) array, one box per distinct x (y) value',
            'is drawn',
            'If no `x` (`y`) {array} is provided, a single box is drawn.',
            'That box position is then positioned with',
            'with `name` or with `x0` (`y0`) if provided.',
            'Each box spans from quartile 1 (Q1) to quartile 3 (Q3).',
            'The second quartile (Q2) is marked by a line inside the box.',
            'By default, the whiskers correspond to the box\' edges',
            '+/- 1.5 times the interquartile range (IQR = Q3-Q1),',
            'see *boxpoints* for other options.'
        ].join(' ')
    }
);

exports.attributes = require('./attributes');
exports.layoutAttributes = require('./layout_attributes');
exports.supplyDefaults = require('./defaults');
exports.supplyLayoutDefaults = require('./layout_defaults');
exports.calc = require('./calc');
exports.setPositions = require('./set_positions');
exports.plot = require('./plot');
exports.style = require('./style');
exports.hoverPoints = require('./hover');
