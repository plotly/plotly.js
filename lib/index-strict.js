'use strict';

var core = require('../src/core');

core.register([
    require('../src/traces/bar'),
    require('../src/traces/box'),
    require('../src/traces/heatmap'),
    require('../src/traces/histogram'),
    require('../src/traces/histogram2d'),
    require('../src/traces/histogram2dcontour'),
    require('../src/traces/contour'),
    require('../src/traces/scatterternary'),
    require('../src/traces/violin'),
    require('../src/traces/funnel'),
    require('../src/traces/waterfall'),
    require('../src/traces/image'),
    require('../src/traces/pie'),
    require('../src/traces/sunburst'),
    require('../src/traces/treemap'),
    require('../src/traces/funnelarea'),
    require('../src/traces/scattergeo'),
    require('../src/traces/choropleth'),
    require('../src/traces/scattergl'),
    require('../src/traces/splom'),
    require('../src/traces/parcoords'),
    require('../src/traces/parcats'),
    require('../src/traces/scattermapbox'),
    require('../src/traces/choroplethmapbox'),
    require('../src/traces/densitymapbox'),
    require('../src/traces/sankey'),
    require('../src/traces/indicator'),
    require('../src/traces/table'),
    require('../src/traces/carpet'),
    require('../src/traces/scattercarpet'),
    require('../src/traces/contourcarpet'),
    require('../src/traces/ohlc'),
    require('../src/traces/candlestick'),
    require('../src/traces/scatterpolar'),
    require('../src/traces/scatterpolargl'),
    require('../src/traces/barpolar'),

    require('../src/transforms/aggregate'),
    require('../src/transforms/filter'),
    require('../src/transforms/groupby'),
    require('../src/transforms/sort'),
    require('../src/components/calendars')
]);

module.exports = (function(Plotly) { return Plotly; })(core);
