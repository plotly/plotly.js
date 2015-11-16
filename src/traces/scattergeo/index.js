'use strict';

var Plotly = require('../../plotly');

var ScatterGeo = module.exports = {};

Plotly.Plots.register(ScatterGeo, 'scattergeo',
    ['geo', 'symbols', 'markerColorscale', 'showLegend'], {
    hrName: 'scatter_geo',
    description: [
        'The data visualized as scatter point or lines on a geographic map',
        'is provided either by longitude/latitude pairs in `lon` and `lat`',
        'respectively or by geographic location IDs or names in `locations`.'
    ].join(' ')
});

ScatterGeo.attributes = require('./attributes');

ScatterGeo.supplyDefaults = require('./defaults');

ScatterGeo.colorbar = Plotly.Scatter.colorbar;

ScatterGeo.calc = function(gd, trace) {

    Plotly.Scatter.calcMarkerColorscales(trace);

};
