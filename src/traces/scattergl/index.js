/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var ScatterGl = {};

ScatterGl.attributes = require('./attributes');
ScatterGl.supplyDefaults = require('./defaults');
ScatterGl.colorbar = require('../scatter/colorbar');

// reuse the Scatter3D 'dummy' calc step so that legends know what to do
ScatterGl.calc = require('../scatter3d/calc');
ScatterGl.plot = require('./convert');

ScatterGl.moduleType = 'trace';
ScatterGl.name = 'scattergl';
ScatterGl.basePlotModule = require('../../plots/gl2d');
ScatterGl.categories = ['gl2d', 'symbols', 'errorBarsOK', 'markerColorscale', 'showLegend'];
ScatterGl.meta = {
    description: [
        'The data visualized as scatter point or lines is set in `x` and `y`',
        'using the WebGl plotting engine.',
        'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
        'to a numerical arrays.'
    ].join(' ')
};

module.exports = ScatterGl;
