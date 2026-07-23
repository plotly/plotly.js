'use strict';

var d3 = require('@plotly/d3');

var Lib = require('../../lib');
var geoUtils = require('../../lib/geo_location_utils');
var getTopojsonFeatures = require('../../lib/topojson_utils').getTopojsonFeatures;
var findExtremes = require('../../plots/cartesian/autorange').findExtremes;

var style = require('./style').style;

function plot(gd, geo, calcData) {
    var choroplethLayer = geo.layers.backplot.select('.choroplethlayer');

    Lib.makeTraceGroups(choroplethLayer, calcData, 'trace choropleth').each(function (calcTrace) {
        var sel = d3.select(this);

        var paths = sel.selectAll('path.choroplethlocation').data(Lib.identity);

        paths.enter().append('path').classed('choroplethlocation', true);

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

    var features =
        locationmode === 'geojson-id'
            ? geoUtils.extractTraceFeature(calcTrace)
            : getTopojsonFeatures(trace, geo.topojson);

    // A falsy result (Sphere feature or malformed/empty geojson) here
    // falls back to per-feature bounds — effectively the same as
    // fitbounds === 'locations' behavior.
    const bboxGeojson =
        geoLayout.fitbounds === 'geojson' && locationmode === 'geojson-id'
            ? geoUtils.computeBbox(geoUtils.getTraceGeojson(trace))
            : null;

    var lonArray = [];
    var latArray = [];

    for (var i = 0; i < len; i++) {
        var calcPt = calcTrace[i];
        var feature =
            locationmode === 'geojson-id'
                ? calcPt.fOut
                : geoUtils.locationToFeature(locationmode, calcPt.loc, features);

        if (feature) {
            calcPt.geojson = feature;
            calcPt.ct = feature.properties.ct;
            calcPt._polygons = geoUtils.feature2polygons(feature);

            if (!bboxGeojson) {
                const bboxFeature = geoUtils.computeBbox(feature);
                if (bboxFeature) {
                    const [west, south, east, north] = bboxFeature;
                    lonArray.push(west, east);
                    latArray.push(south, north);
                }
            }
        } else {
            calcPt.geojson = null;
        }
    }

    if (bboxGeojson) {
        const [west, south, east, north] = bboxGeojson;
        lonArray = [west, east];
        latArray = [south, north];
    }

    var opts = { padded: true };
    trace._extremes.lon = findExtremes(geoLayout.lonaxis._ax, lonArray, opts);
    trace._extremes.lat = findExtremes(geoLayout.lataxis._ax, latArray, opts);
}

module.exports = {
    calcGeoJSON,
    plot
};
