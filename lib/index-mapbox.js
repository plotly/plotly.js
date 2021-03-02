'use strict';

var Plotly = require('./core');

Plotly.register([
    // traces
    require('./scattermapbox'),
    require('./choroplethmapbox'),
    require('./densitymapbox'),

    // transforms
    require('./aggregate'),
    require('./filter'),
    require('./groupby'),
    require('./sort'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
