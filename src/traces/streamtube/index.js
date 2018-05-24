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
    name: 'streamtube',
    basePlotModule: require('../../plots/gl3d'),
    categories: ['gl3d'],

    attributes: require('./attributes'),
    supplyDefaults: require('./defaults'),
    colorbar: require('../cone/colorbar'),
    calc: require('./calc'),
    plot: require('./convert'),

    meta: {
        description: [
            'Use streamtube trace to visualize flow in a vector field',
            '',
            '....'
        ].join(' ')
    }
};
