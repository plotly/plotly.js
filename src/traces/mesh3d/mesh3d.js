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
