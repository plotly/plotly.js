/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Mesh3D = {};

Mesh3D.attributes = require('./attributes');
Mesh3D.supplyDefaults = require('./defaults');
Mesh3D.calc = require('./calc');
Mesh3D.colorbar = require('./colorbar');
Mesh3D.plot = require('./convert');

Mesh3D.moduleType = 'trace';
Mesh3D.name = 'mesh3d',
Mesh3D.basePlotModule = require('../../plots/gl3d');
Mesh3D.categories = ['gl3d'];
Mesh3D.meta = {
    description: [
        'Draws sets of triangles with coordinates given by',
        'three 1-dimensional arrays in `x`, `y`, `z` and',
        '(1) a sets of `i`, `j`, `k` indices',
        '(2) Delaunay triangulation or',
        '(3) the Alpha-shape algorithm or',
        '(4) the Convex-hull algorithm'
    ].join(' ')
};

module.exports = Mesh3D;
