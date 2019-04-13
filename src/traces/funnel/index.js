/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    attributes: require('./attributes'),
    layoutAttributes: require('./layout_attributes'),
    supplyDefaults: require('./defaults').supplyDefaults,
    crossTraceDefaults: require('./defaults').crossTraceDefaults,
    supplyLayoutDefaults: require('./layout_defaults'),
    calc: require('./calc'),
    crossTraceCalc: require('./cross_trace_calc'),
    plot: require('./plot'),
    style: require('./style').style,
    hoverPoints: require('./hover'),
    selectPoints: require('../bar/select'),

    moduleType: 'trace',
    name: 'funnel',
    basePlotModule: require('../../plots/cartesian'),
    categories: ['cartesian', 'svg', 'oriented', 'showLegend', 'zoomScale'],
    meta: {
        description: [ // TODO: update description
            'Draws funnel trace.',
            '"Funnel charts are a type of chart, often used to represent stages in a sales process',
            'and show the amount of potential revenue for each stage. This type of chart can also',
            'be useful in identifying potential problem areas in an organization’s sales processes.',
            'A funnel chart is similar to a stacked percent bar chart." (https://en.wikipedia.org/wiki/Funnel_chart)'
        ].join(' ')
    }
};
