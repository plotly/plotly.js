/**
* Copyright 2012-2020, Plotly, Inc.
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
            'An indicator is used to visualize a single `value` along with some',
            'contextual information such as `steps` or a `threshold`, using a',
            'combination of three visual elements: a number, a delta, and/or a gauge.',
            'Deltas are taken with respect to a `reference`.',
            'Gauges can be either angular or bullet (aka linear) gauges.'
        ].join(' ')
    }
};
