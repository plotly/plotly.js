'use strict';

var Plotly = require('./core');

Plotly.register([
    // traces
    require('./scattergl'),
    require('./splom'),
    require('./pointcloud'),
    require('./heatmapgl'),
    require('./parcoords'),

    // transforms
    require('./aggregate'),
    require('./filter'),
    require('./groupby'),
    require('./sort'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
