'use strict';

var Plotly = require('./core');

Plotly.register([
    require('./scattermapbox'),
    require('./choroplethmapbox'),
    require('./densitymapbox')
]);

module.exports = require('./register_extra')(Plotly);
