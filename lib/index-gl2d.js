'use strict';

var Plotly = require('./core');

Plotly.register([
    require('./scattergl'),
    require('./splom'),
    require('./pointcloud'),
    require('./heatmapgl'),
    require('./parcoords')
]);

module.exports = require('./register_extra')(Plotly);
