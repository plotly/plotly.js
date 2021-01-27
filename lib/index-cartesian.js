'use strict';

var Plotly = require('./core');

Plotly.register([
    require('./bar'),
    require('./box'),
    require('./heatmap'),
    require('./histogram'),
    require('./histogram2d'),
    require('./histogram2dcontour'),
    require('./image'),
    require('./pie'),
    require('./contour'),
    require('./scatterternary'),
    require('./violin')
]);

module.exports = require('./register_extra')(Plotly);
