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
    require('./scatter3d'),
    require('./surface'),
    require('./isosurface'),
    require('./volume'),
    require('./mesh3d'),
    require('./cone'),
    require('./streamtube'),
    require('./scattergeo'),
    require('./choropleth'),
    require('./scattergl'),
    require('./splom'),
    require('./pointcloud'),
    require('./heatmapgl'),
    require('./parcoords'),
    require('./parcats'),
    require('./scattermapbox'),
    require('./choroplethmapbox'),
    require('./densitymapbox'),
    require('./scattermap'),
    require('./choroplethmap'),
    require('./densitymap'),
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
    require('./barpolar'),
    require('./scattersmith'),

    // transforms
    require('./aggregate'),
    require('./filter'),
    require('./groupby'),
    require('./sort'),

    // components
    require('./calendars'),
]);

module.exports = Plotly;
