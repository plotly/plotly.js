'use strict';

var d3 = require('@plotly/d3');

var Lib = require('../../lib');
var geoUtils = require('../../lib/geo_location_utils');
var getTopojsonFeatures = require('../../lib/topojson_utils').getTopojsonFeatures;
var findExtremes = require('../../plots/cartesian/autorange').findExtremes;

var style = require('./style').style;

function plot(gd, geo, calcData) {
    var choroplethLayer = geo.layers.backplot.select('.choroplethlayer');

    Lib.makeTraceGroups(choroplethLayer, calcData, 'trace choropleth').each(function(calcTrace) {
        var sel = d3.select(this);

        var paths = sel.selectAll('path.choroplethlocation')
            .data(Lib.identity);

        paths.enter().append('path')
            .classed('choroplethlocation', true);

        paths.exit().remove();

        // call style here within topojson request callback
        style(gd, calcTrace);
    });
}

function calcGeoJSON(calcTrace, fullLayout) {
    var trace = calcTrace[0].trace;
    var geoLayout = fullLayout[trace.geo];
    var geo = geoLayout._subplot;
    var locationmode = trace.locationmode;
    var len = trace._length;

    var features = locationmode === 'geojson-id' ?
        geoUtils.extractTraceFeature(calcTrace) :
        getTopojsonFeatures(trace, geo.topojson);

    var lonArray = [];
    var latArray = [];

    for(var i = 0; i < len; i++) {
        var calcPt = calcTrace[i];
        var feature = locationmode === 'geojson-id' ?
            calcPt.fOut :
            geoUtils.locationToFeature(locationmode, calcPt.loc, features);

        if(feature) {
            calcPt.geojson = feature;
            calcPt.ct = feature.properties.ct;
            calcPt._polygons = geoUtils.feature2polygons(feature);

            var bboxFeature = geoUtils.computeBbox(feature);
            lonArray.push(bboxFeature[0], bboxFeature[2]);
            latArray.push(bboxFeature[1], bboxFeature[3]);
        } else {
            calcPt.geojson = null;
        }
    }

    if(geoLayout.fitbounds === 'geojson' && locationmode === 'geojson-id') {
        var bboxGeojson = geoUtils.computeBbox(geoUtils.getTraceGeojson(trace));
        lonArray = [bboxGeojson[0], bboxGeojson[2]];
        latArray = [bboxGeojson[1], bboxGeojson[3]];
    }

    var opts = {padded: true};
    trace._extremes.lon = findExtremes(geoLayout.lonaxis._ax, lonArray, opts);
    trace._extremes.lat = findExtremes(geoLayout.lataxis._ax, latArray, opts);
}

module.exports = {
    calcGeoJSON: calcGeoJSON,
    plot: plot
};
