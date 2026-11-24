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

    // A falsy result (another fitbounds mode, or a Sphere/malformed/empty geojson)
    // falls back to per-feature bounds, similar to `fitbounds === 'locations'`.
    const bboxGeojson = geoUtils.fitGeojsonBbox(trace, geoLayout);

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

/**
 * Append the coordinates this trace contributes to a subplot-wide `fitbounds`
 * bounding box. Keeping it all together allows for proper auto-fitting of
 * geometry that crosses the antimeridian.
 *
 * @param {Array} calcTrace - calcdata for this trace
 * @param {object} geoLayout - The subplot's `fullLayout` entry
 * @return {Array} `[lon, lat]` pairs
 */
function fitCoords(calcTrace, geoLayout) {
    const geojsonCoords = geoUtils.fitGeojsonCoords(calcTrace[0].trace, geoLayout);
    if (geojsonCoords.length) return geojsonCoords;

    const parts = [];
    for (const calcPt of calcTrace) {
        if (calcPt.geojson) parts.push(geoUtils.coordsOf(calcPt.geojson));
    }

    return parts.flat();
}

module.exports = {
    calcGeoJSON,
    fitCoords,
    plot
};
