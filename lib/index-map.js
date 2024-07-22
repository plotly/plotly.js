'use strict';

var Plotly = require('./core');

Plotly.register([
    // traces
    require('./scattermap'),
    require('./choroplethmap'),
    require('./densitymap'),

    // transforms
    require('./aggregate'),
    require('./filter'),
    require('./groupby'),
    require('./sort'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
