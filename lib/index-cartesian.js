'use strict';

var Plotly = require('./core');

Plotly.register([
    // traces
    require('./bar'),
    require('./box'),
    require('./heatmap'),
    require('./histogram'),
    require('./histogram2d'),
    require('./histogram2dcontour'),
    require('./contour'),
    require('./scatterternary'),
    require('./violin'),
    require('./image'),
    require('./pie'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
