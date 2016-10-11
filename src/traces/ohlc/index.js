/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var register = require('../../plot_api/register');

module.exports = {
    moduleType: 'trace',
    name: 'ohlc',
    basePlotModule: require('../../plots/cartesian'),
    categories: ['cartesian', 'showLegend'],
    meta: {
        description: [
            'The ohlc (short for Open-High-Low-Close) is a style of financial chart describing',
            'open, high, low and close for a given `x` coordinate (most likely time).',

            'The tip of the lines represent the `low` and `high` values and',
            'the horizontal segments represent the `open` and `close` values.',

            'Sample points where the close value is higher (lower) then the open',
            'value are called increasing (decreasing).',

            'By default, increasing candles are drawn in green whereas',
            'decreasing are drawn in red.'
        ].join(' ')
    },

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
};

register(require('../scatter'));
register(require('./transform'));
