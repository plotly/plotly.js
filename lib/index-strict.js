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
    require('./funnel'),
    require('./waterfall'),
    require('./image'),
    require('./pie'),
    require('./sunburst'),
    require('./treemap'),
    require('./icicle'),
    require('./funnelarea'),
    require('./scattergeo'),
    require('./choropleth'),
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
    require('./barpolar'),

    // transforms
    require('./aggregate'),
    require('./filter'),
    require('./groupby'),
    require('./sort'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
