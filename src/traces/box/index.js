/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

var boxes = {
    attributes: require('./attributes'),
    layoutAttributes: require('./layout_attributes'),
    supplyDefaults: require('./defaults'),
    supplyLayoutDefaults: require('./layout_defaults'),
    calc: require('./calc'),
    setPositions: require('./set_positions'),
    plot: require('./plot'),
    style: require('./style'),
    hoverPoints: require('./hover')
};

Plotly.Plots.register(boxes, 'box',
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
});

module.exports = boxes;
