'use strict';

var Plotly = require('./core');

Plotly.register([
    // traces
    require('./scattergl'),
    require('./splom'),
    require('./parcoords'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
