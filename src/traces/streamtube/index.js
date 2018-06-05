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
            'Use streamtube trace to visualize flow in a vector fields.',
            '',
            'Specify a vector field using 6 1D arrays of equal length,',
            '3 position arrays `x`, `y` and `z`',
            'and 3 vector component arrays `u`, `v`, `w`.',
            '',
            'By default, the tubes\' starting positions will be cut from the vector field\'s',
            'x-z plane at its minimum y value.',
            'To specify your own starting position, use attributes `startx`, `starty`',
            'and `startz`.'
        ].join(' ')
    }
};
