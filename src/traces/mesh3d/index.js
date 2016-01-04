/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

var Mesh3D = module.exports = {};

Plotly.Plots.register(Mesh3D, 'mesh3d', ['gl3d'], {
    description: [
        'Draws sets of triangles with coordinates given by',
        'three 1-dimensional arrays in `x`, `y`, `z` and',
        '(1) a sets of `i`, `j`, `k` indices',
        '(2) Delaunay triangulation or',
        '(3) the Alpha-shape algorithm or',
        '(4) the Convex-hull algorithm'
    ].join(' ')
});

Mesh3D.attributes = require('./attributes');

Mesh3D.supplyDefaults = require('./defaults');

Mesh3D.colorbar = require('../heatmap/colorbar');
