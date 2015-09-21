'use strict';

var Plotly = require('../../plotly');

var ScatterGeo = module.exports = {};

Plotly.Plots.register(ScatterGeo, 'scattergeo',
    ['geo', 'symbols', 'markerColorscale', 'showLegend'], {
    _hrName: 'scatter_geo',
    description: [
        'The data visualized as scatter point or lines on a geographic map',
        'is provided either by longitude/latitude pairs in `lon` and `lat`',
        'respectively or by geographic location IDs or names in `locations`.'
    ].join(' ')
});

ScatterGeo.attributes = require('../attributes/scattergeo');

ScatterGeo.supplyDefaults = function(traceIn, traceOut, defaultColor, layout) {
    var Scatter = Plotly.Scatter;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut,
                                 ScatterGeo.attributes, attr, dflt);
    }

    var len = ScatterGeo.handleLonLatLocDefaults(traceIn, traceOut, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('text');
    coerce('mode');

    if(Scatter.hasLines(traceOut)) {
        Scatter.lineDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    if(Scatter.hasMarkers(traceOut)) {
        Scatter.markerDefaults(traceIn, traceOut, defaultColor, layout, coerce);
    }

    if(Scatter.hasText(traceOut)) {
        Scatter.textDefaults(traceIn, traceOut, layout, coerce);
    }

    coerce('hoverinfo', (layout._dataLength === 1) ? 'lon+lat+location+text' : undefined);
};

ScatterGeo.handleLonLatLocDefaults = function(traceIn, traceOut, coerce) {
    var len = 0,
        locations = coerce('locations');

    var lon, lat;

    if(locations) {
        coerce('locationmode');
        len = locations.length;
        return len;
    }

    lon = coerce('lon') || [];
    lat = coerce('lat') || [];
    len = Math.min(lon.length, lat.length);

    if(len < lon.length) traceOut.lon = lon.slice(0, len);
    if(len < lat.length) traceOut.lat = lat.slice(0, len);

    return len;
};

ScatterGeo.colorbar = Plotly.Scatter.colorbar;

ScatterGeo.calc = function(gd, trace) {

    Plotly.Scatter.calcMarkerColorscales(trace);

};
