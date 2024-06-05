'use strict';

var Plotly = require('./core');

Plotly.register([
    // traces
    require('./scattermaplibre'),
    require('./choroplethmaplibre'),
    require('./densitymaplibre'),

    // transforms
    require('./aggregate'),
    require('./filter'),
    require('./groupby'),
    require('./sort'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
