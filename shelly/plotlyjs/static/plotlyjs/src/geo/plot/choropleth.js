'use strict';

/* global d3:false */

var Plotly = require('../../plotly'),
    params = require('../lib/params'),
    extractTopojson = require('../lib/topojson-utils').extractTopojson,
    locationToId = require('../lib/location-utils').locationToId;

var plotChoropleth = module.exports = {};


plotChoropleth.calcGeoJSON = function(trace, topojson) {
    var cdi = [],
        locations = trace.locations,
        N = locations.length,
        fromTopojson = extractTopojson(trace, topojson),
        features = fromTopojson.features,
        ids = fromTopojson.ids,
        markerLine = (trace.marker || {}).line || {};

    var indexOfId, feature;

    for(var i = 0; i < N; i++) {
        indexOfId = ids.indexOf(locationToId(trace.locationmode, locations[i]));
        if(indexOfId === -1) continue;

        feature = features[indexOfId];

        // 'data_array' attributes
        feature.z = trace.z[i];
        if(trace.text!==undefined) feature.tx = trace.text[i];

        // 'arrayOK' attributes
        mergeArray(markerLine.color, feature, 'mlc', i);
        mergeArray(markerLine.width, feature, 'mlw', i);

        cdi.push(feature);
    }

    if(cdi.length > 0) cdi[0].trace = trace;

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

    // TODO move to more d3-idiomatic pattern (that's work on replot)
    // N.B. html('') does not work in IE11
    gChoropleth.selectAll('*').remove();
    gBaseLayerOverChoropleth.selectAll('*').remove();

    var gChoroplethTraces = gChoropleth
        .selectAll('g.trace.scatter')
        .data(choroplethData);

    gChoroplethTraces.enter().append('g')
            .attr('class', 'trace choropleth');

    gChoroplethTraces
        .each(function(trace) {
            if(trace.visible !== true) return;

            var cdi = plotChoropleth.calcGeoJSON(trace, topojson),
                cleanHoverLabelsFunc = makeCleanHoverLabelsFunc(geo, trace);

            function handleMouseOver(d) {
                if(!geo.showHover) return;

                var xy = geo.projection(d.properties.centroid);
                cleanHoverLabelsFunc(d);

                Plotly.Fx.loneHover({
                    x: xy[0],
                    y: xy[1],
                    name: d.nameLabel,
                    text: d.textLabel
                }, {
                    container: geo.hoverContainer.node()
                });
            }

            d3.select(this)
                .selectAll('path.choroplethlocation')
                    .data(cdi)
                .enter().append('path')
                    .attr('class', 'choroplethlocation')
                    .on('mouseover', handleMouseOver)
                    .on('mouseout', function() {
                        Plotly.Fx.loneUnhover(geo.hoverContainer);
                    })
                    .on('mousedown', function() {
                        // to simulate the 'zoomon' event
                        Plotly.Fx.loneUnhover(geo.hoverContainer);
                    })
                    .on('mouseup', handleMouseOver);  // ~ 'zoomend'
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

// similar to Lib.mergeArray, but using inside a loop
function mergeArray(traceAttr, feature, featureAttr, i) {
    if(Array.isArray(traceAttr)) feature[featureAttr] = traceAttr[i];
}

function makeCleanHoverLabelsFunc(geo, trace) {
    var hoverinfo = trace.hoverinfo;

    if(hoverinfo === 'none') {
        return function cleanHoverLabelsFunc(d) {
            delete d.nameLabel;
            delete d.textLabel;
        };
    }

    var hoverinfoParts = (hoverinfo === 'all') ?
            Plotly.Choropleth.attributes.hoverinfo.flags :
            hoverinfo.split('+');

    var hasName = (hoverinfoParts.indexOf('name') !== -1),
        hasLocation = (hoverinfoParts.indexOf('location') !== -1),
        hasZ = (hoverinfoParts.indexOf('z') !== -1),
        hasText = (hoverinfoParts.indexOf('text') !== -1),
        hasIdAsNameLabel = !hasName && hasLocation;

    function formatter(val) {
        return Plotly.Axes.tickText(geo.mockAxis, val, 'hover').text;
    }

    return function cleanHoverLabelsFunc(d) {
        // put location id in name label container
        // if name isn't part of hoverinfo
        var thisText = [];

        if(hasIdAsNameLabel) d.nameLabel = d.id;
        else {
            if(hasName) d.nameLabel = trace.name;
            if(hasLocation) thisText.push(d.id);
        }

        if(hasZ) thisText.push(formatter(d.z));
        if(hasText) thisText.push(d.tx);

        d.textLabel = thisText.join('<br>');
    };
}
