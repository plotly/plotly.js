/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Axes = require('../../plots/cartesian/axes');
var Fx = require('../../plots/cartesian/graph_interact');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var Colorscale = require('../../components/colorscale');

var getTopojsonFeatures = require('../../lib/topojson_utils').getTopojsonFeatures;
var locationToFeature = require('../../lib/geo_location_utils').locationToFeature;
var arrayToCalcItem = require('../../lib/array_to_calc_item');

var constants = require('../../plots/geo/constants');
var attributes = require('./attributes');

var plotChoropleth = module.exports = {};


plotChoropleth.calcGeoJSON = function(trace, topojson) {
    var cdi = [],
        locations = trace.locations,
        len = locations.length,
        features = getTopojsonFeatures(trace, topojson),
        markerLine = (trace.marker || {}).line || {};

    var feature;

    for(var i = 0; i < len; i++) {
        feature = locationToFeature(trace.locationmode, locations[i], features);

        if(!feature) continue;  // filter the blank features here

        // 'data_array' attributes
        feature.z = trace.z[i];
        if(trace.text !== undefined) feature.tx = trace.text[i];

        // 'arrayOk' attributes
        arrayToCalcItem(markerLine.color, feature, 'mlc', i);
        arrayToCalcItem(markerLine.width, feature, 'mlw', i);

        cdi.push(feature);
    }

    if(cdi.length > 0) cdi[0].trace = trace;

    return cdi;
};

plotChoropleth.plot = function(geo, calcData, geoLayout) {

    function keyFunc(d) { return d[0].trace.uid; }

    var framework = geo.framework,
        gChoropleth = framework.select('g.choroplethlayer'),
        gBaseLayer = framework.select('g.baselayer'),
        gBaseLayerOverChoropleth = framework.select('g.baselayeroverchoropleth'),
        baseLayersOverChoropleth = constants.baseLayersOverChoropleth,
        layerName;

    var gChoroplethTraces = gChoropleth
        .selectAll('g.trace.choropleth')
        .data(calcData, keyFunc);

    gChoroplethTraces.enter().append('g')
        .attr('class', 'trace choropleth');

    gChoroplethTraces.exit().remove();

    gChoroplethTraces.each(function(calcTrace) {
        var trace = calcTrace[0].trace,
            cdi = plotChoropleth.calcGeoJSON(trace, geo.topojson),
            cleanHoverLabelsFunc = makeCleanHoverLabelsFunc(geo, trace),
            eventDataFunc = makeEventDataFunc(trace);

        // keep ref to event data in this scope for plotly_unhover
        var eventData = null;

        function handleMouseOver(pt, ptIndex) {
            if(!geo.showHover) return;

            var xy = geo.projection(pt.properties.ct);
            cleanHoverLabelsFunc(pt);

            Fx.loneHover({
                x: xy[0],
                y: xy[1],
                name: pt.nameLabel,
                text: pt.textLabel
            }, {
                container: geo.hoverContainer.node()
            });

            eventData = eventDataFunc(pt, ptIndex);

            geo.graphDiv.emit('plotly_hover', eventData);
        }

        function handleClick(pt, ptIndex) {
            geo.graphDiv.emit('plotly_click', eventDataFunc(pt, ptIndex));
        }

        var paths = d3.select(this).selectAll('path.choroplethlocation')
                .data(cdi);

        paths.enter().append('path')
            .classed('choroplethlocation', true)
            .on('mouseover', handleMouseOver)
            .on('click', handleClick)
            .on('mouseout', function() {
                Fx.loneUnhover(geo.hoverContainer);

                geo.graphDiv.emit('plotly_unhover', eventData);
            })
            .on('mousedown', function() {
                // to simulate the 'zoomon' event
                Fx.loneUnhover(geo.hoverContainer);
            })
            .on('mouseup', handleMouseOver);  // ~ 'zoomend'

        paths.exit().remove();
    });

    // some baselayers are drawn over choropleth
    gBaseLayerOverChoropleth.selectAll('*').remove();

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
        .each(function(calcTrace) {
            var trace = calcTrace[0].trace,
                s = d3.select(this),
                marker = trace.marker || {},
                markerLine = marker.line || {};

            var sclFunc = Colorscale.makeColorScaleFunc(
                Colorscale.extractScale(
                    trace.colorscale,
                    trace.zmin,
                    trace.zmax
                )
            );

            s.selectAll('path.choroplethlocation')
                .each(function(pt) {
                    d3.select(this)
                        .attr('fill', function(pt) { return sclFunc(pt.z); })
                        .call(Color.stroke, pt.mlc || markerLine.color)
                        .call(Drawing.dashLine, '', pt.mlw || markerLine.width);
                });
        });
};

function makeCleanHoverLabelsFunc(geo, trace) {
    var hoverinfo = trace.hoverinfo;

    if(hoverinfo === 'none' || hoverinfo === 'skip') {
        return function cleanHoverLabelsFunc(pt) {
            delete pt.nameLabel;
            delete pt.textLabel;
        };
    }

    var hoverinfoParts = (hoverinfo === 'all') ?
            attributes.hoverinfo.flags :
            hoverinfo.split('+');

    var hasName = (hoverinfoParts.indexOf('name') !== -1),
        hasLocation = (hoverinfoParts.indexOf('location') !== -1),
        hasZ = (hoverinfoParts.indexOf('z') !== -1),
        hasText = (hoverinfoParts.indexOf('text') !== -1),
        hasIdAsNameLabel = !hasName && hasLocation;

    function formatter(val) {
        var axis = geo.mockAxis;
        return Axes.tickText(axis, axis.c2l(val), 'hover').text;
    }

    return function cleanHoverLabelsFunc(pt) {
        // put location id in name label container
        // if name isn't part of hoverinfo
        var thisText = [];

        if(hasIdAsNameLabel) pt.nameLabel = pt.id;
        else {
            if(hasName) pt.nameLabel = trace.name;
            if(hasLocation) thisText.push(pt.id);
        }

        if(hasZ) thisText.push(formatter(pt.z));
        if(hasText) thisText.push(pt.tx);

        pt.textLabel = thisText.join('<br>');
    };
}

function makeEventDataFunc(trace) {
    return function(pt, ptIndex) {
        return {points: [{
            data: trace._input,
            fullData: trace,
            curveNumber: trace.index,
            pointNumber: ptIndex,
            location: pt.id,
            z: pt.z
        }]};
    };
}
