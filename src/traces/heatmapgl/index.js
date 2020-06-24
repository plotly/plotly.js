/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: require('../heatmap/colorbar'),

    calc: require('../heatmap/calc'),
    plot: require('./convert'),

    moduleType: 'trace',
    name: 'heatmapgl',
    basePlotModule: require('../../plots/gl2d'),
    categories: ['gl', 'gl2d', '2dMap'],
    meta: {
        description: [
            'WebGL version of the heatmap trace type.'
        ].join(' ')
    }
};
