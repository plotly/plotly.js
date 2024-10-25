'use strict';

var Plotly = require('./core');

Plotly.register([
    // traces
    require('./scattergeo'),
    require('./choropleth'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
