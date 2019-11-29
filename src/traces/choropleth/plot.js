/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var d3 = require('d3');

var Lib = require('../../lib');
var geoUtils = require('../../lib/geo_location_utils');
var getTopojsonFeatures = require('../../lib/topojson_utils').getTopojsonFeatures;
var style = require('./style').style;

function plot(gd, geo, calcData) {
    for(var i = 0; i < calcData.length; i++) {
        calcGeoJSON(calcData[i], geo.topojson);
    }

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

function calcGeoJSON(calcTrace, topojson) {
    var trace = calcTrace[0].trace;
    var locationmode = trace.locationmode;
    var len = trace._length;

    var features = locationmode === 'geojson-id' ?
        geoUtils.extractTraceFeature(calcTrace) :
        getTopojsonFeatures(trace, topojson);

    for(var i = 0; i < len; i++) {
        var calcPt = calcTrace[i];
        var feature = locationmode === 'geojson-id' ?
            calcPt.fOut :
            geoUtils.locationToFeature(locationmode, calcPt.loc, features);

        if(feature) {
            calcPt.geojson = feature;
            calcPt.ct = feature.properties.ct;
            calcPt._polygons = geoUtils.feature2polygons(feature);
        } else {
            calcPt.geojson = null;
        }
    }
}

module.exports = {
    plot: plot
};
