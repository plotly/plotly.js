'use strict';

var Plotly = require('./core');

Plotly.register([
    // traces
    require('./scattermap'),
    require('./choroplethmap'),
    require('./densitymap'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
