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
            // ...
        ].join(' ')
    },

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
};

register(require('../scatter'));
register(require('./transform'));
