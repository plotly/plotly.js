'use strict';

/* global d3:false */

var Plotly = require('../../plotly'),
    params = require('../lib/params'),
    getFromTopojson = require('../lib/get-from-topojson');

var plotChoropleth = module.exports = {};

plotChoropleth.calcGeoJSON = function(trace, topojson) {
    var cdi = [],
        locations = trace.locations,
        N = locations.length,
        fromTopojson = getFromTopojson(trace, topojson),
        features = fromTopojson.features,
        ids = fromTopojson.ids,
        markerLine = (trace.marker || {}).line || {};
         
    var indexOfId, feature;

    for (var i = 0; i < N; i++) {
        indexOfId = ids.indexOf(locations[i]);
        if(indexOfId === -1) continue;

        feature = features[indexOfId];
        feature.z = trace.z[i];
        cdi.push(feature);
    }

    Plotly.Lib.mergeArray(markerLine.color, cdi, 'mlc');
    Plotly.Lib.mergeArray(markerLine.width, cdi, 'mlw');

    cdi[0].trace = trace;
    return cdi;
};

plotChoropleth.plot = function(geo, choroplethData, geoLayout) {
    var framework = geo.framework,
        topojson = geo.topojson,
        gChoropleth = framework.select('g.choroplethlayer'),
        gBaseLayer = framework.select('g.baselayer'),
        gBaseLayerOverChoropleth = framework.select('g.baselayeroverchoropleth'),
        baseLayersOverChoropleth = params.baseLayersOverChoropleth,
        layer;

    gChoropleth.append('g')
        .data(choroplethData)
        .attr('class', 'trace choropleth')
        .each(function(trace) {
            var cdi = plotChoropleth.calcGeoJSON(trace, topojson);

            d3.select(this)
                .selectAll('path.choroplethlocation')
                    .data(cdi)
                .enter().append('path')
                    .attr('class', 'choroplethlocation');
        });
        
    // some baselayers are drawn over choropleth
    for(var i = 0; i < baseLayersOverChoropleth.length; i++) {
        layer = baseLayersOverChoropleth[i];
        gBaseLayer.select('g.' + layer).remove();
        geo.drawBaseLayer(gBaseLayerOverChoropleth, layer, geoLayout);
    }
    
    plotChoropleth.style(geo);
};

plotChoropleth.style = function(geo) {
    geo.framework.selectAll('g.trace.choropleth')
        .each(function(trace) {
            var s = d3.select(this),
                marker = trace.marker || {},
                markerLine = marker.line || {},
                zmin = trace.zmin,
                zmax = trace.zmax,
                scl = Plotly.Colorscale.getScale(trace.colorscale),
                colormap = d3.scale.linear()
                    .domain(scl.map(function(v) {
                        return zmin + v[0] * (zmax - zmin);
                    }))
                    .range(scl.map(function(v) { return v[1]; }));

            s.selectAll('path.choroplethlocation')
                .each(function(d) {
                    d3.select(this)
                        .attr('fill', function(d) { return colormap(d.z); })
                        .attr('stroke', d.mlc || markerLine.color)
                        .attr('stroke-width', d.mlw || markerLine.width);
                });
        });
};
