/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Streamtubes = {};

Streamtubes.plot = require('./convert');
Streamtubes.attributes = require('./attributes');
Streamtubes.supplyDefaults = require('./defaults');
Streamtubes.colorbar = require('../scatter/colorbar');
Streamtubes.calc = require('./calc');

Streamtubes.moduleType = 'trace';
Streamtubes.name = 'streamtubes';
Streamtubes.basePlotModule = require('../../plots/gl3d');
Streamtubes.categories = ['gl3d', 'markerColorscale', 'showLegend'];
Streamtubes.meta = {
    hrName: 'streamtubes',
    description: [
        'The data visualized as scatter point or streamtubes in 3D dimension',
        'is set in `x`, `y`, `z`.',
        'Text (appearing either on the chart or on hover only) is via `text`.',
        'Projections are achieved via `projection`.'
    ].join(' ')
};

module.exports = Streamtubes;
