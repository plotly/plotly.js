'use strict';

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
    var topojsonUrl = (window.PLOTLYENV &&
                       window.PLOTLYENV.TOPOJSON_URL) || './topojson/';

    return topojsonUrl + topojsonName + '.json';
};

topojsonUtils.extractTopojson = function(trace, topojson) {
    var layer = locationmodeToLayer[trace.locationmode],
        obj = topojson.objects[layer];

    return {
        features: topojsonFeature(topojson, obj).features,
        ids: obj.properties.ids
    };
};
