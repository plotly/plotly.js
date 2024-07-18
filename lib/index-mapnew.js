'use strict';

var Plotly = require('./core');

Plotly.register([
    // traces
    require('./scattermapnew'),
    require('./choroplethmapnew'),
    require('./densitymapnew'),

    // transforms
    require('./aggregate'),
    require('./filter'),
    require('./groupby'),
    require('./sort'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
