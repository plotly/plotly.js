/**
* Copyright 2012-2019, Plotly, Inc.
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
        'Draws isosurfaces between iso-min and iso-max values with coordinates given by',
        'four 1-dimensional arrays containing the `value`, `x`, `y` and `z` of every vertex',
        'of a uniform or non-uniform 3-D grid. Horizontal or vertical slices, caps as well as',
        'spaceframe between iso-min and iso-max values could also be drawn using this trace.'
    ].join(' ')
};

module.exports = Isosurface;
