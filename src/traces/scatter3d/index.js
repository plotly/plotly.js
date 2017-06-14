/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Scatter3D = {};

Scatter3D.plot = require('./convert');
Scatter3D.attributes = require('./attributes');
Scatter3D.markerSymbols = require('../../constants/gl3d_markers');
Scatter3D.supplyDefaults = require('./defaults');
Scatter3D.colorbar = require('../scatter/colorbar');
Scatter3D.calc = require('./calc');

Scatter3D.moduleType = 'trace';
Scatter3D.name = 'scatter3d';
Scatter3D.basePlotModule = require('../../plots/gl3d');
Scatter3D.categories = ['gl3d', 'symbols', 'markerColorscale', 'showLegend'];
Scatter3D.meta = {
    hrName: 'scatter_3d',
    description: [
        'The data visualized as scatter point or lines in 3D dimension',
        'is set in `x`, `y`, `z`.',
        'Text (appearing either on the chart or on hover only) is via `text`.',
        'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
        'Projections are achieved via `projection`.',
        'Surface fills are achieved via `surfaceaxis`.'
    ].join(' ')
};

module.exports = Scatter3D;
