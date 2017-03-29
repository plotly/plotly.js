/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var Colorscale = require('../../components/colorscale');

var getTopojsonFeatures = require('../../lib/topojson_utils').getTopojsonFeatures;
var locationToFeature = require('../../lib/geo_location_utils').locationToFeature;
var arrayToCalcItem = require('../../lib/array_to_calc_item');

var constants = require('../../plots/geo/constants');

module.exports = function plot(geo, calcData, geoLayout) {

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
            cdi = calcGeoJSON(trace, geo.topojson);

        var paths = d3.select(this)
            .selectAll('path.choroplethlocation')
            .data(cdi);

        paths.enter().append('path')
            .classed('choroplethlocation', true)
            .on('mouseover', function(pt) {
                geo.choroplethHoverPt = pt;
            })
            .on('mouseout', function() {
                geo.choroplethHoverPt = null;
            });

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

    style(geo);
};

function calcGeoJSON(trace, topojson) {
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

        // for event data
        feature.index = i;

        cdi.push(feature);
    }

    if(cdi.length > 0) cdi[0].trace = trace;

    return cdi;
}

function style(geo) {
    geo.framework.selectAll('g.trace.choropleth').each(function(calcTrace) {
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

        s.selectAll('path.choroplethlocation').each(function(pt) {
            d3.select(this)
                .attr('fill', function(pt) { return sclFunc(pt.z); })
                .call(Color.stroke, pt.mlc || markerLine.color)
                .call(Drawing.dashLine, '', pt.mlw || markerLine.width || 0);
        });
    });
}
