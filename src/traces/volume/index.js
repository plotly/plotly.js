/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Volume = {};

Volume.attributes = require('./attributes');
Volume.supplyDefaults = require('../isosurface/defaults');
Volume.calc = require('../isosurface/calc');
Volume.colorbar = {
    min: 'cmin',
    max: 'cmax'
};
Volume.plot = require('./convert');

Volume.moduleType = 'trace';
Volume.name = 'volume',
Volume.basePlotModule = require('../../plots/gl3d');
Volume.categories = ['gl3d'];
Volume.meta = {
    description: [
        'Draws volume trace between iso-min and iso-max values with coordinates given by',
        'four 1-dimensional arrays containing the `value`, `x`, `y` and `z` of every vertex',
        'of a uniform or non-uniform 3-D grid. Horizontal or vertical slices, caps as well as',
        'spaceframe between iso-min and iso-max values could also be drawn using this trace.'
    ].join(' ')
};

module.exports = Volume;
