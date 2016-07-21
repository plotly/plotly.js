/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Streamtube = {};

Streamtube.plot = require('./convert');
Streamtube.attributes = require('./attributes');
Streamtube.supplyDefaults = require('./defaults');
Streamtube.colorbar = require('../scatter/colorbar');
Streamtube.calc = require('./calc');

Streamtube.moduleType = 'trace';
Streamtube.name = 'streamtube';
Streamtube.basePlotModule = require('../../plots/gl3d');
Streamtube.categories = ['gl3d', 'markerColorscale', 'showLegend'];
Streamtube.meta = {
    hrName: 'streamtube',
    description: [
        'The data visualized as a streamtube and/or its markers in 3D dimension',
        'is set in `x`, `y`, `z`.',
        'Text (appearing either on the chart or on hover only) is via `text`.',
        'Projections are achieved via `projection`.'
    ].join(' ')
};

module.exports = Streamtube;
