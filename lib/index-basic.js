'use strict';

var Plotly = require('./core');

Plotly.register([
    // traces
    require('./bar'),
    require('./pie'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
