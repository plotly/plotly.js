'use strict';

var Plotly = require('./core');

Plotly.register([
    require('./bar'),
    require('./pie')
]);

module.exports = require('./register_extra')(Plotly);
