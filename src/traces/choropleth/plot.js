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
    var i, j, k, m;

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

        // Russia and Fiji have landmasses that cross the antimeridian,
        // we need to add +360 to their longitude coordinates, so that
        // polygon 'contains' doesn't get confused when crossing the antimeridian.
        //
        // Note that other countries have polygons on either side of the antimeridian
        // (e.g. some Aleutian island for the USA), but those don't confuse
        // the 'contains' method; these are skipped here.
        if(calcPt.loc === 'RUS' || calcPt.loc === 'FJI') {
            for(j = 0; j < coords.length; j++) {
                for(k = 0; k < coords[j].length; k++) {
                    for(m = 0; m < coords[j][k].length; m++) {
                        if(coords[j][k][m][0] < 0) {
                            coords[j][k][m][0] += 360;
                        }
                    }
                }
            }
        }

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
    var gTraces = geo.layers.backplot.selectAll('.trace.choropleth');

    gTraces.each(function(calcTrace) {
        var trace = calcTrace[0].trace;
        var marker = trace.marker || {};
        var markerLine = marker.line || {};

        var sclFunc = Colorscale.makeColorScaleFunc(
            Colorscale.extractScale(
                trace.colorscale,
                trace.zmin,
                trace.zmax
            )
        );

        d3.select(this).selectAll('.choroplethlocation').each(function(d) {
            d3.select(this)
                .attr('fill', sclFunc(d.z))
                .call(Color.stroke, d.mlc || markerLine.color)
                .call(Drawing.dashLine, '', d.mlw || markerLine.width || 0);
        });
    });
}
