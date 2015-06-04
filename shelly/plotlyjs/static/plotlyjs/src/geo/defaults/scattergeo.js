'use strict';

var Plotly = require('../../plotly');

var ScatterGeo = module.exports = {};

Plotly.Plots.register(ScatterGeo, 'scattergeo', ['geo', 'symbols', 'showLegend']);

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
        values: ['ISO-3', 'USA-states'],
        dflt: 'IS0-3'
    },
    mode: extendFlat(scatterAttrs.mode,
                     {dflt: 'markers'}),
    text: scatterAttrs.text,
    textfont: scatterAttrs.textfont,
    textposition: scatterAttrs.textposition,
    line: {
        color: scatterLineAttrs.color,
        width: scatterLineAttrs.width,
        dash: scatterLineAttrs.dash
    },
    marker: {
        symbol: scatterMarkerAttrs.symbol,
        opacity: scatterMarkerAttrs.opacity,
        size: scatterMarkerAttrs.size,
        color: scatterMarkerAttrs.color,
        line: {
            color: scatterMarkerLineAttrs.color,
            width: scatterMarkerLineAttrs.width
        }
    }
};

ScatterGeo.supplyDefaults = function(traceIn, traceOut, defaultColor, layout) {
    var Scatter = Plotly.Scatter;

    var lineColor, markerColor, isBubble, len;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut,
                                 ScatterGeo.attributes, attr, dflt);
    }

    len = ScatterGeo.handleLonLatLocDefaults(traceIn, traceOut, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }
    coerce('locationmode');

    coerce('text');
    coerce('mode');

    isBubble = Scatter.isBubble(traceIn);

    // TODO refactor -> Scatter.isBubble for 2d, 3d and geo
    if(Scatter.hasMarkers(traceOut)) {
        markerColor = coerce('marker.color', defaultColor);
        coerce('marker.symbol');
        coerce('marker.size');
        coerce('marker.opacity', isBubble ? 0.7 : 1);
        coerce('marker.line.width', isBubble ? 1 : 0);
        coerce('marker.line.color',
               isBubble ? Plotly.Color.background : Plotly.Color.defaultLine);
    }

    if(Scatter.hasLines(traceOut)) {
        // don't try to inherit a color array
        lineColor = coerce('line.color',
            (Array.isArray(markerColor) ? false : markerColor) || defaultColor);
        coerce('line.width');
        coerce('line.dash');
    }

    if(Scatter.hasText(traceOut)) {
        coerce('textposition');
        coerce('textfont', layout.font);
    }
};

ScatterGeo.handleLonLatLocDefaults = function(traceIn, traceOut, coerce) {
    var len = 0,
        locations = coerce('locations');

    var lon, lat;

    if(locations) {
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

ScatterGeo.calc = function(gd, trace) {

    // TODO sanitize data

};
