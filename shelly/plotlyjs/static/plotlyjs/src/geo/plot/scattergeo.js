'use strict';

/* global d3:false */

var Plotly = require('../../plotly'),
    extractTopojson = require('../lib/topojson-utils').extractTopojson;

var plotScatterGeo = module.exports = {};

plotScatterGeo.calcGeoJSON = function(trace, topojson) {
    var cdi = [],
        marker = trace.marker || {},
        hasLocationData = Array.isArray(trace.locations);

    var N, fromTopojson, features, ids, getLonLat, lonlat, indexOfId;

    if(hasLocationData) {
        N = trace.locations.length;
        fromTopojson = extractTopojson(trace, topojson);
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

        cdi.push({
            lon: lonlat[0],
            lat: lonlat[1],
            location: hasLocationData ? trace.locations[i] : null
        });
    }

    if(cdi.length > 0) {
        cdi[0].trace = trace;
        Plotly.Lib.mergeArray(marker.size, cdi, 'ms');
        Plotly.Scatter.arraysToCalcdata(cdi);
    }

    return cdi;
};

function makeLineGeoJSON(trace) {
    var N = trace.lon.length,
        coordinates = new Array(N);

    for (var i = 0; i < N; i++) {
        coordinates[i] = [trace.lon[i], trace.lat[i]];
    }

    return {
        type: 'LineString',
        coordinates: coordinates,
        trace: trace
    };
}

plotScatterGeo.plot = function(geo, scattergeoData) {
    var gScatterGeo = geo.framework.select('g.scattergeolayer'),
        Scatter = Plotly.Scatter,
        topojson = geo.topojson;

    // TODO move to more d3-idiomatic pattern (that's work on replot)
    gScatterGeo.html('');

    function handleMouseOver(d) {
        if(!geo.showHover) return;

        var xy = geo.projection([d.lon, d.lat]),
            trace = d3.select(this.parentNode).data()[0],
            text;

        // TODO incorporate 'hoverinfo'
        if(Array.isArray(trace.locations)) text = d.location;
        else text = '(' + d.lon + ', ' + d.lat + ')';

        if(d.tx) text += '<br>' + d.tx;

        Plotly.Fx.loneHover(
            {
                x: xy[0],
                y: xy[1],
                text: text,
                name: trace.name,  // TODO should only appear if data.length>1
                color: d.mc || (trace.marker || {}).color
            },
            {container: geo.hoverContainer.node()}
        );
    }

    var gScatterGeoTraces = gScatterGeo
        .selectAll('g.trace.scatter')
        .data(scattergeoData);

    gScatterGeoTraces.enter().append('g')
            .attr('class', 'trace scattergeo');

    // TODO add hover - how?
    gScatterGeoTraces
        .each(function(trace) {
            if(!Scatter.hasLines(trace) || trace.visible !== true) return;
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
                showText = Scatter.hasText(trace);

            if((!showMarkers && !showText) || trace.visible !== true) {
                s.remove();
                return;
            }

           var cdi = plotScatterGeo.calcGeoJSON(trace, topojson);

            if(showMarkers) {
                s.selectAll('path.point')
                    .data(cdi)
                    .enter().append('path')
                        .attr('class', 'point')
                        .on('mouseover', handleMouseOver)
                        .on('mouseout', function() {
                            Plotly.Fx.loneUnhover(geo.hoverContainer);
                        })
            }

            if(showText) {
                s.selectAll('g')
                    .data(cdi)
                    .enter().append('g')
                        .append('text');
            }
        });

    plotScatterGeo.style(geo);
};

plotScatterGeo.style = function(geo) {
    var selection = geo.framework.selectAll('g.trace.scattergeo');

    selection.style('opacity', function(trace) { return trace.opacity; });

    selection.selectAll('g.points')
        .each(function(trace){
            d3.select(this).selectAll('path.point')
                .call(Plotly.Drawing.pointStyle, trace);
            d3.select(this).selectAll('text')
                .call(Plotly.Drawing.textPointStyle, trace);
        });

    // GeoJSON calc data is incompatible with Plotly.Drawing.lineGroupStyle
    selection.selectAll('path.js-line')
        .style('fill', 'none')
        .each(function(d) {
            var trace = d.trace,
                line = trace.line || {};

            d3.select(this)
                .call(Plotly.Color.stroke, line.color)
                .call(Plotly.Drawing.dashLine, line.dash || '', line.width || 0);
        });
};
