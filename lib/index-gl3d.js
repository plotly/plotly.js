'use strict';

var Plotly = require('./core');

Plotly.register([
    require('./scatter3d'),
    require('./surface'),
    require('./mesh3d'),
    require('./isosurface'),
    require('./volume'),
    require('./cone'),
    require('./streamtube')
]);

module.exports = require('./register_extra')(Plotly);
