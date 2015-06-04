'use strict';

/* global d3:false */

var Plotly = require('../../plotly'),
    params = require('../lib/params'),
    getFromTopojson = require('../lib/get-from-topojson');

var plotChoropleth = module.exports = {};

plotChoropleth.calcGeoJSON = function(trace) {
    var cdi = [],
        N = trace.loc.length,
        fromTopojson = getFromTopojson(trace),
        features = fromTopojson.features,
        ids = fromTopojson.ids,
        markerLine = trace.marker.line;
         
    var indexOfId, feature;

    for (var i = 0; i < N; i++) {
        indexOfId = ids.indexOf(trace.loc[i]);
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
        gChoropleth = framework.select('g.choroplethlayer'),
        gBaseLayer = framework.select('g.baselayer'),
        gBaseLayerOverChoropleth = framework.select('g.baselayeroverchoropleth'),
        baselayersOverChoropleth = params.baselayersOverChoropleth,
        layer;

    gChoropleth.append('g')
        .data(choroplethData)
        .attr('class', 'trace choropleth')
        .each(function(trace) {
            var cdi = plotChoropleth.calcGeoJSON(trace);

            d3.select(this)
                .selectAll('path.choroplethlocation')
                    .data(cdi)
                .enter().append('path')
                    .attr('class', 'choroplethlocation');
        });
        
    // some baselayers are drawn over choropleth
    for(var i = 0; i < baselayersOverChoropleth.length; i++) {
        layer = baselayersOverChoropleth[i];
        gBaseLayer.select('g.' + layer).remove();
        geo.drawBaseLayer(gBaseLayerOverChoropleth, layer, geoLayout);
    }
    
    plotChoropleth.style(geo);
};

plotChoropleth.style = function(geo) {
    geo.framework.selectAll('g.trace.choropleth')
        .each(function(d) {
            var s = d3.select(this),
                trace = d[0].trace,
                marker = trace.marker,
                zmin = trace.zmin,
                zmax = trace.zmax,
                scl = Plotly.Colorscale.getScale(trace.colorscale),
                colormap = d3.scale.linear()
                    .domain(scl.map(function(v) {
                        return zmin + v[0] * (zmax - zmin);
                    }))
                    .range(scl.map(function(v) { return v[1]; }));

            s.selectAll('path.choroplethloc')
                .each(function(d) {
                    d3.select(this)
                        .attr('fill', function(d) { return colormap(d.z); })
                        .attr('stroke', d.mlc || marker.line.color)
                        .attr('stroke-width', d.mlw || marker.line.width);
                });
        });
};
