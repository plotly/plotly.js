/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

var Scatter3D = module.exports = {};

Plotly.Plots.register(Scatter3D,
    'scatter3d', ['gl3d', 'symbols', 'markerColorscale', 'showLegend'], {
    hrName: 'scatter_3d',
    description: [
        'The data visualized as scatter point or lines in 3D dimension', 
        'is set in `x`, `y`, `z`.',
        'Text (appearing either on the chart or on hover only) is via `text`.',
        'Bubble charts are achieved by setting `marker.size` and/or `marker.color`',
        'Projections are achieved via `projection`.',
        'Surface fills are achieved via `surfaceaxis`.'
    ].join(' ')
});

Scatter3D.attributes = require('./attributes');

Scatter3D.markerSymbols = require('../../constants/gl_markers.json');

Scatter3D.supplyDefaults = require('./defaults');

Scatter3D.colorbar = Plotly.Scatter.colorbar;

Scatter3D.calc = function(gd, trace) {
    // this is a kludge to put the array attributes into
    // calcdata the way Scatter.plot does, so that legends and
    // popovers know what to do with them.
    var cd = [{x: false, y: false, trace: trace, t: {}}];
    Plotly.Scatter.arraysToCalcdata(cd);

    Plotly.Scatter.calcMarkerColorscales(trace);

    return cd;
};
