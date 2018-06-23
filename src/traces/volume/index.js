/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    moduleType: 'trace',
    name: 'volume',
    basePlotModule: require('../../plots/gl3d'),
    categories: ['gl3d'],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: {
        min: 'cmin',
        max: 'cmax'
    },
    calc: require('./calc'),
    plot: require('./convert'),

    meta: {
        description: [
            'Use volumes to visualize volumetric data.',
            '',
            'Specify a volume using 4 1D arrays,',
            '3 position arrays `x`, `y` and `z`',
            'and intensity array `u`.'
        ].join(' ')
    }
};
