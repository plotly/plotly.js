/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Box = {};

Box.attributes = require('./attributes');
Box.layoutAttributes = require('./layout_attributes');
Box.supplyDefaults = require('./defaults');
Box.supplyLayoutDefaults = require('./layout_defaults');
Box.calc = require('./calc');
Box.setPositions = require('./set_positions');
Box.plot = require('./plot');
Box.style = require('./style');
Box.hoverPoints = require('./hover');

Box.moduleType = 'trace';
Box.name = 'box';
Box.basePlotModule = require('../../plots/cartesian');
Box.categories = ['cartesian', 'symbols', 'oriented', 'box', 'showLegend'];
Box.meta = {
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
};

module.exports = Box;
