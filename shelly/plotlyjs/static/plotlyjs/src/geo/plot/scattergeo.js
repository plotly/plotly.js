'use strict';

/* global d3:false */

var Plotly = require('../../plotly'),
    getFromTopojson = require('../lib/get-from-topojson');

var plotScatterGeo = module.exports = {};

plotScatterGeo.calcGeoJSON = function(trace, topojson) {
    var cdi = [],
        marker = trace.marker;

    var N, fromTopojson, features, ids, getLonLat, lonlat, indexOfId;

    if(trace.locations) {
        N = trace.locations.length;
        fromTopojson = getFromTopojson(trace, topojson);
        features = fromTopojson.features;
        ids = fromTopojson.ids;
        getLonLat = function(trace, i) {
            indexOfId = ids.indexOf(trace.locations[i]);
            if(indexOfId === -1) return;
            return features[indexOfId].properties.centroid;
        };
    }
    else {
        N = trace.lon.length;
        getLonLat = function(trace, i) {
            return [trace.lon[i], trace.lat[i]];
        };
    }

    for(var i = 0; i < N; i++) {
        lonlat = getLonLat(trace, i);
        if(!lonlat) continue;
        cdi.push({lon: lonlat[0], lat: lonlat[1]});
    }

    cdi[0].trace = trace;
    if(marker !== undefined) Plotly.Lib.mergeArray(marker.size, cdi, 'ms');
    Plotly.Scatter.arraysToCalcdata(cdi);

    return cdi;
};

function makeLineGeoJSON(trace) {
    return {
        type: 'LineString',
        coordinates: [trace.lon, trace.lat],
        trace: trace
    };
}

plotScatterGeo.plot = function(geo, scattergeoData) {
    var Scatter = Plotly.Scatter,
        topojson = geo.topojson;

    // TODO remove this hack!!!
    d3.select('g.scattergeolayer').selectAll('*').remove();

    var gScatterGeoTraces = geo.framework.select('g.scattergeolayer')
        .selectAll('g.trace.scatter')
        .data(scattergeoData);
    gScatterGeoTraces.enter().append('g')
            .attr('class', 'trace scattergeo');

    gScatterGeoTraces.each(function(trace) {
        if(!Scatter.hasLines(trace)) return;
        d3.select(this)
            .append('path')
            .datum(makeLineGeoJSON(trace))
            .attr('class', 'js-line');
    });

    gScatterGeoTraces.append('g')
        .attr('class', 'points')
        .each(function(trace) {
            var s = d3.select(this),
                showMarkers = Scatter.hasMarkers(trace),
                showText = Scatter.hasText(trace),
                cdi = plotScatterGeo.calcGeoJSON(trace, topojson);

            if((!showMarkers && !showText) || trace.visible !== true) {
                s.remove();
                return;
            }

            if(showMarkers) {
                s.selectAll('path.point')
                    .data(cdi)
                    .enter().append('path')
                        .attr('class', 'point');
            }

            if(showText) {
                s.selectAll('g')
                    .data(Object)
                    .enter().append('g')
                        .append('text');
            }
        });

    plotScatterGeo.style(geo);
};

plotScatterGeo.style = function(geo) {
    var s = geo.framework.selectAll('g.trace.scattergeo');

    s.style('opacity', function(trace) { return trace.opacity; });

    s.selectAll('g.points')
        .each(function(trace){
            d3.select(this).selectAll('path.point')
                .call(Plotly.Drawing.pointStyle, trace);
            d3.select(this).selectAll('text')
                .call(Plotly.Drawing.textPointStyle, trace);
        });

    s.selectAll('g.trace path.js-line')
        .call(Plotly.Drawing.lineGroupStyle);
};
