/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var hover = require('./hover');

module.exports = {
    moduleType: 'trace',
    name: 'scattergl',
    basePlotModule: require('../../plots/cartesian'),
    categories: ['gl', 'regl', 'cartesian', 'symbols', 'errorBarsOK', 'showLegend', 'scatter-like'],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    crossTraceDefaults: require('../scatter/cross_trace_defaults'),
    colorbar: require('../scatter/marker_colorbar'),
    formatLabels: require('./format_labels'),
    calc: require('./calc'),
    plot: require('./plot'),
    hoverPoints: hover.hoverPoints,
    selectPoints: require('./select'),

    meta: {
        hrName: 'scatter_gl',
        description: [
            'The data visualized as scatter point or lines is set in `x` and `y`',
            'using the WebGL plotting engine.',
            'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
            'to a numerical arrays.'
        ].join(' ')
    }
};
