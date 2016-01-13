/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Scatter = require('../scatter');
var Scatter3D = require('../scatter3d');

var ScatterGl = {};

ScatterGl.attributes = require('./attributes');
ScatterGl.supplyDefaults = require('./defaults');
ScatterGl.colorbar = Scatter.colorbar;

// reuse the Scatter3D 'dummy' calc step so that legends know what to do
ScatterGl.calc = Scatter3D.calc;
ScatterGl.plot = require('./convert');

ScatterGl._type = 'scattergl';
ScatterGl._categories = ['gl2d', 'symbols', 'errorBarsOK', 'markerColorscale', 'showLegend'];
ScatterGl._meta = {
    description: [
        'The data visualized as scatter point or lines is set in `x` and `y`',
        'using the WebGl plotting engine.',
        'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
        'to a numerical arrays.'
    ].join(' ')
};

module.exports = ScatterGl;
