'use strict';

var topojsonUtils = module.exports = {};

var locationmodeToLayer = require('../constants/geo_constants').locationmodeToLayer,
    topojsonFeature = require('topojson').feature;


topojsonUtils.getTopojsonName = function(geoLayout) {
    return [
        geoLayout.scope.replace(/ /g, '-'), '_',
        geoLayout.resolution.toString(), 'm'
    ].join('');
};

topojsonUtils.getTopojsonPath = function(topojsonURL, topojsonName) {
    return topojsonURL + topojsonName + '.json';
};

topojsonUtils.getTopojsonFeatures = function(trace, topojson) {
    var layer = locationmodeToLayer[trace.locationmode],
        obj = topojson.objects[layer];

    return topojsonFeature(topojson, obj).features;
};
