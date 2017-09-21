/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var d3 = require('d3');

var Lib = require('../../lib');
var Color = require('../../components/color');
var Drawing = require('../../components/drawing');
var Colorscale = require('../../components/colorscale');
var polygon = require('../../lib/polygon');

var getTopojsonFeatures = require('../../lib/topojson_utils').getTopojsonFeatures;
var locationToFeature = require('../../lib/geo_location_utils').locationToFeature;

module.exports = function plot(geo, calcData) {
    for(var i = 0; i < calcData.length; i++) {
        calcGeoJSON(calcData[i], geo.topojson);
    }

    function keyFunc(d) { return d[0].trace.uid; }

    var gTraces = geo.layers.backplot.select('.choroplethlayer')
        .selectAll('g.trace.choropleth')
        .data(calcData, keyFunc);

    gTraces.enter().append('g')
        .attr('class', 'trace choropleth');

    gTraces.exit().remove();

    gTraces.each(function(calcTrace) {
        var sel = calcTrace[0].node3 = d3.select(this);

        var paths = sel.selectAll('path.choroplethlocation')
            .data(Lib.identity);

        paths.enter().append('path')
            .classed('choroplethlocation', true);

        paths.exit().remove();
    });

    style(geo);
};

function calcGeoJSON(calcTrace, topojson) {
    var trace = calcTrace[0].trace;
    var len = calcTrace.length;
    var features = getTopojsonFeatures(trace, topojson);
    var i, j, k;

    for(i = 0; i < len; i++) {
        var calcPt = calcTrace[i];
        var feature = locationToFeature(trace.locationmode, calcPt.loc, features);

        if(!feature) {
            calcPt.geojson = null;
            continue;
        }

        calcPt.geojson = feature;
        calcPt.ct = feature.properties.ct;
        calcPt.index = i;

        var geometry = feature.geometry;
        var coords = geometry.coordinates;
        calcPt._polygons = [];

        switch(geometry.type) {
            case 'MultiPolygon':
                for(j = 0; j < coords.length; j++) {
                    for(k = 0; k < coords[j].length; k++) {
                        calcPt._polygons.push(polygon.tester(coords[j][k]));
                    }
                }
                break;
            case 'Polygon':
                for(j = 0; j < coords.length; j++) {
                    calcPt._polygons.push(polygon.tester(coords[j]));
                }
                break;
        }
    }
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

        s.selectAll('path.choroplethlocation').each(function(_, i) {
            var pt = calcTrace[i];

            d3.select(this)
                .attr('fill', sclFunc(pt.z))
                .call(Color.stroke, pt.mlc || markerLine.color)
                .call(Drawing.dashLine, '', pt.mlw || markerLine.width || 0);
        });
    });
}
