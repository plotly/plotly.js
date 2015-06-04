'use strict';

/* global d3:false */

var Plotly = require('../../plotly'),
    getFromTopojson = require('../lib/get-from-topojson');

var plotScatterGeo = module.exports = {};

plotScatterGeo.calcGeoJSON = function(trace, topojson) {
    var cdi = [];

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

    Plotly.Scatter.arraysToCalcdata(cdi);

    cdi[0].trace = trace;
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
    var gScatterGeo = geo.framework.select('scattegeolayer'),
        Scatter = Plotly.Scatter;
        
    gScatterGeo
        .append('g')
        .data(scattergeoData)
        .attr('class', 'trace scattergeo')
        .each(function(trace) {
            var s = d3.select(this),
                cdi = plotScatterGeo.calcGeoJSON(trace);

            if(Scatter.hasLines(trace)) {
                s.append('path')
                    .datum(makeLineGeoJSON(trace))
                    .attr('class', 'js-line');
            }

            if(Scatter.hasMarkers(trace)) {
                s.append('g')
                    .data(cdi)
                    .attr('class', 'points')
                    .each(function() {
                        d3.select(this)
                            .selectAll('path.point')
                                .data(Object)
                            .enter().append('path')
                                .attr('class', 'point');
                    });
            }

            if(Scatter.hasText(trace)) {
                s.append('g')
                    .data(cdi)
                    .attr('class', 'points')
                    .each(function() {
                        d3.select(this)
                            .selectAll('g')
                                .data(Object)
                            .enter().append('g')
                                .append('text');
                    });
            }
        });

    plotScatterGeo.style(geo);
};

plotScatterGeo.style = function(geo) {
    var s = geo.framework.selectAll('g.trace.scattergeo');

    // TODO merge with Plotly.Scatter.style

    s.style('opacity', function(d) { return d[0].trace.opacity; });

    s.selectAll('g.points')
        .each(function(d){
            d3.select(this).selectAll('path.point')
                .call(Plotly.Drawing.pointStyle, d.trace || d[0].trace);
            d3.select(this).selectAll('text')
                .call(Plotly.Drawing.textPointStyle, d.trace || d[0].trace);
        });

    s.selectAll('g.trace path.js-line')
        .call(Plotly.Drawing.lineGroupStyle);
};
