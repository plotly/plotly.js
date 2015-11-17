/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

var ScatterGl = module.exports = {};

Plotly.Plots.register(ScatterGl, 'scattergl',
    ['gl2d', 'symbols', 'errorBarsOK', 'markerColorscale', 'showLegend'], {
    description: [
        'The data visualized as scatter point or lines is set in `x` and `y`',
        'using the WebGl plotting engine.',
        'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
        'to a numerical arrays.'
    ].join(' ')
});

ScatterGl.attributes = require('./attributes');

ScatterGl.supplyDefaults = require('./defaults');

ScatterGl.colorbar = Plotly.Scatter.colorbar;

// reuse the Scatter3D 'dummy' calc step so that legends know what to do
ScatterGl.calc = Plotly.Scatter3D.calc;
