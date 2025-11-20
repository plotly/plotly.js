'use strict';

var Plotly = require('./core');

Plotly.register([
    // traces
    require('./scatter3d'),
    require('./surface'),
    require('./isosurface'),
    require('./volume'),
    require('./bar3d'),
    require('./mesh3d'),
    require('./cone'),
    require('./streamtube'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
