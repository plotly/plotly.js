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
    name: 'candlestick',
    basePlotModule: require('../../plots/cartesian'),
    categories: ['cartesian', 'showLegend'],
    meta: {
        description: [
            'The candlestick is a style of financial chart describing',
            'open, high, low and close for a given `x` coordinate (most likely time).',

            'The boxes represent the spread between the `open` and `close` values and',
            'the lines represent the spread between the `low` and `high` values',

            'Sample points where the close value is higher (lower) then the open',
            'value are called increasing (decreasing).',

            'By default, increasing candles are drawn in green whereas',
            'decreasing are drawn in red.'
        ].join(' ')
    },

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
};

register(require('../box'));
register(require('./transform'));
