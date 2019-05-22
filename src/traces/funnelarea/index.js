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
    name: 'funnelarea',
    basePlotModule: require('./base_plot'),
    categories: ['pie-like', 'funnelarea', 'showLegend'],

    attributes: require('./attributes'),
    layoutAttributes: require('./layout_attributes'),
    supplyDefaults: require('./defaults'),
    supplyLayoutDefaults: require('./layout_defaults'),

    calc: require('./calc').calc,
    crossTraceCalc: require('./calc').crossTraceCalc,

    plot: require('./plot'),
    style: require('./style'),
    styleOne: require('../pie/style_one'),

    meta: {
        description: [
            'TODO'
        ].join(' ')
    }
};
