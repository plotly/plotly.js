/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    moduleType: 'trace',
    name: 'indicator',
    basePlotModule: require('./base_plot'),
    categories: ['svg', 'noOpacity', 'noHover'],
    animatable: true,

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults').supplyDefaults,

    calc: require('./calc').calc,

    plot: require('./plot'),

    meta: {
        description: [
            'TODO: add description'
        ].join(' ')
    }
};
