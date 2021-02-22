'use strict';

var core = require('./core');

core.register([
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
    require('./calendars')
]);

module.exports = (function(Plotly) { return Plotly; })(core);
