'use strict';

/* global d3:false */

var Plotly = require('../../plotly'),
    params = require('../lib/params'),
    getFromTopojson = require('../lib/get-from-topojson'),
    clearHover = require('../lib/clear-hover');

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

    if(cdi.length > 0) {
        cdi[0].trace = trace;
        Plotly.Lib.mergeArray(trace.text, cdi, 'tx');
        Plotly.Lib.mergeArray(markerLine.color, cdi, 'mlc');
        Plotly.Lib.mergeArray(markerLine.width, cdi, 'mlw');
    }

    return cdi;
};

plotChoropleth.plot = function(geo, choroplethData, geoLayout) {
    var framework = geo.framework,
        topojson = geo.topojson,
        gChoropleth = framework.select('g.choroplethlayer'),
        gBaseLayer = framework.select('g.baselayer'),
        gBaseLayerOverChoropleth = framework.select('g.baselayeroverchoropleth'),
        baseLayersOverChoropleth = params.baseLayersOverChoropleth,
        layerName;

    // For Plotly.plot into an existing map. Better solution?
    gChoropleth.selectAll('*').remove();
    gBaseLayerOverChoropleth.selectAll('*').remove();

    // TODO incorporate 'hoverinfo'
    function handleMouseOver(d) {
        if(!geo.showHover) return;

        var xy = geo.projection(d.properties.centroid);
        Plotly.Fx.loneHover(
            {
                x: xy[0],
                y: xy[1],
                name: d.id,
                zLabel: d.z,
                text: d.tx
            }, 
            {container: geo.framework.node()}
        );
    }

    function handleZoom(d) {
        clearHover(geo.framework);
        handleMouseOver(d);
    }

    gChoropleth.append('g')
        .data(choroplethData)
        .attr('class', 'trace choropleth')
        .each(function(trace) {
            var cdi = plotChoropleth.calcGeoJSON(trace, topojson);

            d3.select(this)
                .selectAll('path.choroplethlocation')
                    .data(cdi)
                .enter().append('path')
                    .attr('class', 'choroplethlocation')
                    .on('mouseover', handleMouseOver)
                    .on('mouseout', clearHover(geo.framework))
                    .on('mousewheel.zoom', handleZoom);
        });
        
    // some baselayers are drawn over choropleth
    for(var i = 0; i < baseLayersOverChoropleth.length; i++) {
        layerName = baseLayersOverChoropleth[i];
        gBaseLayer.select('g.' + layerName).remove();
        geo.drawTopo(gBaseLayerOverChoropleth, layerName, geoLayout);
        geo.styleLayer(gBaseLayerOverChoropleth, layerName, geoLayout);
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
                sclFunc = Plotly.Colorscale.makeScaleFunction(scl, zmin, zmax);

            s.selectAll('path.choroplethlocation')
                .each(function(d) {
                    d3.select(this)
                        .attr('fill', function(d) { return sclFunc(d.z); })
                        .call(Plotly.Color.stroke, d.mlc || markerLine.color)
                        .call(Plotly.Drawing.dashLine, '', d.mlw || markerLine.width);
                });
        });
};
