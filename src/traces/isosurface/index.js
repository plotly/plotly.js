/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Isosurface = {};

Isosurface.attributes = require('./attributes');
Isosurface.supplyDefaults = require('./defaults');
Isosurface.calc = require('./calc');
Isosurface.colorbar = {
    min: 'cmin',
    max: 'cmax'
};
Isosurface.plot = require('./convert');

Isosurface.moduleType = 'trace';
Isosurface.name = 'isosurface',
Isosurface.basePlotModule = require('../../plots/gl3d');
Isosurface.categories = ['gl3d'];
Isosurface.meta = {
    description: [
        'Draws isosurface with coordinates given by',
        'three 1-dimensional arrays in `x`, `y`, `z`',
        'with `width`, `height` & `depth` lengths as well as',
        'another 1-dimensional array volume (data cube).',
    ].join(' ')
};

module.exports = Isosurface;
