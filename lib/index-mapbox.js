'use strict';

var Plotly = require('./core');

Plotly.register([
    // traces
    require('./scattermapbox'),
    require('./choroplethmapbox'),
    require('./densitymapbox'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
