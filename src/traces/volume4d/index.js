/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Volume4d = {};

Volume4d.attributes = require('./attributes');
Volume4d.supplyDefaults = require('../isosurface/defaults');
Volume4d.calc = require('../isosurface/calc');
Volume4d.colorbar = {
    min: 'cmin',
    max: 'cmax'
};
Volume4d.plot = require('./convert');

Volume4d.moduleType = 'trace';
Volume4d.name = 'volume4d',
Volume4d.basePlotModule = require('../../plots/gl3d');
Volume4d.categories = ['gl3d'];
Volume4d.meta = {
    description: [
        'Draws volume4d trace between iso-min and iso-max values with coordinates given by',
        'four 1-dimensional arrays containing the `value`, `x`, `y` and `z` of every vertex',
        'of a uniform or non-uniform 3-D grid. Horizontal or vertical slices, caps as well as',
        'spaceframe between iso-min and iso-max values could also be drawn using this trace.'
    ].join(' ')
};

module.exports = Volume4d;
