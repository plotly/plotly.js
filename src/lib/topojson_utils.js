'use strict';

var topojsonUtils = module.exports = {};

var locationmodeToLayer = require('../plots/geo/constants').locationmodeToLayer;
var topojsonFeature = require('topojson-client').feature;

topojsonUtils.getTopojsonName = function(geoLayout) {
    return [
        geoLayout.scope.replace(/ /g, '-'), '_',
        geoLayout.resolution.toString(), 'm'
    ].join('');
};

topojsonUtils.getTopojsonPath = function(topojsonURL, topojsonName) {
    var path = topojsonURL;

    if(topojsonName.startsWith('un_')) {
        path += 'un';
    } else {
        path += topojsonName;
    }

    return path + '.json';
};

topojsonUtils.getTopojsonFeatures = function(trace, topojson) {
    var layer = locationmodeToLayer[trace.locationmode];
    var obj = topojson.objects[layer];

    return topojsonFeature(topojson, obj).features;
};
