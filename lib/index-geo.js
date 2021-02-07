'use strict';

var Plotly = require('./core');

Plotly.register([
    require('./scattergeo'),
    require('./choropleth')
]);

module.exports = require('./register_extra')(Plotly);
