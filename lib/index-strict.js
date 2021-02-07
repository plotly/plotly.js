'use strict';

var Plotly = require('./core');

// traces
Plotly.register([
    require('./bar'),
    require('./box'),
    require('./heatmap'),
    require('./histogram'),
    require('./histogram2d'),
    require('./histogram2dcontour'),
    require('./contour'),
    require('./scatterternary'),
    require('./violin'),
    require('./funnel'),
    require('./waterfall'),
    require('./image'),

    require('./pie'),
    require('./sunburst'),
    require('./treemap'),
    require('./funnelarea'),

    require('./scattergeo'),
    require('./choropleth'),

    require('./scattergl'),
    require('./splom'),

    require('./parcoords'),
    require('./parcats'),

    require('./scattermapbox'),
    require('./choroplethmapbox'),
    require('./densitymapbox'),

    require('./sankey'),
    require('./indicator'),

    require('./table'),

    require('./carpet'),
    require('./scattercarpet'),
    require('./contourcarpet'),

    require('./ohlc'),
    require('./candlestick'),

    require('./scatterpolar'),
    require('./scatterpolargl'),
    require('./barpolar')
]);

module.exports = require('./register_extra')(Plotly);
