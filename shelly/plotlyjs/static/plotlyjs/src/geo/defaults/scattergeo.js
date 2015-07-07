'use strict';

var Plotly = require('../../plotly');

var ScatterGeo = module.exports = {};

Plotly.Plots.register(ScatterGeo, 'scattergeo',
    ['geo', 'symbols', 'markerColorscale', 'showLegend']);

var scatterAttrs = Plotly.Scatter.attributes,
    scatterMarkerAttrs = scatterAttrs.marker,
    scatterLineAttrs = scatterAttrs.line,
    scatterMarkerLineAttrs = scatterMarkerAttrs.line;

var extendFlat = Plotly.Lib.extendFlat;

ScatterGeo.attributes = {
    lon: {type: 'data_array'},
    lat: {type: 'data_array'},
    locations: {type: 'data_array'},
    locationmode: {
        type: 'enumerated',
        values: ['ISO-3', 'USA-states', 'country names'],
        dflt: 'ISO-3'
    },
    mode: extendFlat(scatterAttrs.mode, {dflt: 'markers'}),
    text: scatterAttrs.text,
    line: {
        color: scatterLineAttrs.color,
        width: scatterLineAttrs.width,
        dash: scatterLineAttrs.dash
    },
    marker: {
        symbol: scatterMarkerAttrs.symbol,
        opacity: scatterMarkerAttrs.opacity,
        size: scatterMarkerAttrs.size,
        sizeref: scatterMarkerAttrs.sizeref,
        sizemode: scatterMarkerAttrs.sizemode,
        color: scatterMarkerAttrs.color,
        colorscale: scatterMarkerAttrs.colorscale,
        cauto: scatterMarkerAttrs.cauto,
        cmax: scatterMarkerAttrs.cmax,
        cmin: scatterMarkerAttrs.cmin,
        autocolorscale: scatterMarkerAttrs.autocolorscale,
        reversescale: scatterMarkerAttrs.reversescale,
        showscale: scatterMarkerAttrs.showscale,
        line: {
            color: scatterMarkerLineAttrs.color,
            width: scatterMarkerLineAttrs.width,
            colorscale: scatterMarkerLineAttrs.colorscale,
            cauto: scatterMarkerLineAttrs.cauto,
            cmax: scatterMarkerLineAttrs.cmax,
            cmin: scatterMarkerLineAttrs.cmin,
            autocolorscale: scatterMarkerLineAttrs.autocolorscale,
            reversescale: scatterMarkerLineAttrs.reversescale
        }
    },
    textfont: scatterAttrs.textfont,
    textposition: scatterAttrs.textposition,
    _nestedModules: {
        'marker.colorbar': 'Colorbar'
        // TODO error bars?
    }
};

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
