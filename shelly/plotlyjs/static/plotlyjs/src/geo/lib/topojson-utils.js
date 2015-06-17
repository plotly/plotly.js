'use strict';

/* global ENV:false */

var topojsonUtils = module.exports = {};

var locationmodeToLayer = require('./params').locationmodeToLayer,
    topojsonFeature = require('topojson').feature;


topojsonUtils.getTopojsonName = function(geoLayout) {
    return [
        geoLayout.scope.replace(/ /g, '-'), '_',
        geoLayout.resolution.toString(), 'm'
    ].join('');
};

topojsonUtils.getTopojsonPath = function(topojsonName) {
    var pathMiddle = 'plotlyjs/src/geo/topojson/',
        pathStart;

    try {
        // for prod
        pathStart = ENV.STATIC_URL;
    }
    catch(error) {
        // for test-dashboard
        pathStart = '../shelly/plotlyjs/static/';
    }

    return pathStart + pathMiddle + topojsonName + '.json';
};

topojsonUtils.extractTopojson = function(trace, topojson) {
    var layer = locationmodeToLayer[trace.locationmode],
        obj = topojson.objects[layer];

    return {
        features: topojsonFeature(topojson, obj).features,
        ids: obj.properties.ids
    };
};
