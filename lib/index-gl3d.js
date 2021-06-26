'use strict';

var Plotly = require('./core');

Plotly.register([
    // traces
    require('./scatter3d'),
    require('./surface'),
    require('./isosurface'),
    require('./volume'),
    require('./mesh3d'),
    require('./cone'),
    require('./streamtube'),

    // transforms
    require('./aggregate'),
    require('./filter'),
    require('./groupby'),
    require('./sort'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
