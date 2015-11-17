/**
* Copyright 2012-2015, Plotly, Inc.
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
        ''
    ].join(' ')
});

Mesh3D.attributes = require('./attributes');

Mesh3D.supplyDefaults = require('./defaults');

Mesh3D.colorbar = Plotly.Colorbar.traceColorbar;
