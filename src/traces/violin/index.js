/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    attributes: require('./attributes'),
    layoutAttributes: require('./layout_attributes'),
    supplyDefaults: require('./defaults'),
    supplyLayoutDefaults: require('./layout_defaults'),
    calc: require('./calc'),
    setPositions: require('../box/set_positions'),
    plot: require('./plot'),
    style: require('./style'),
    hoverPoints: require('../box/hover'),
    selectPoints: require('../box/select'),

    moduleType: 'trace',
    name: 'violin',
    basePlotModule: require('../../plots/cartesian'),
    categories: ['cartesian', 'symbols', 'oriented', 'box-violin', 'showLegend'],
    meta: {
        description: [
            'In vertical (horizontal) violin plots,',
            'statistics are computed using `y` (`x`) values.',
            'By supplying an `x` (`y`) array, one violin per distinct x (y) value',
            'is drawn',
            'If no `x` (`y`) {array} is provided, a single violin is drawn.',
            'That violin position is then positioned with',
            'with `name` or with `x0` (`y0`) if provided.'
        ].join(' ')
    }
};
