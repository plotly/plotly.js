'use strict';

var locationmodeToLayer = require('./params').locationmodeToLayer,
    topojsonFeature = require('topojson').feature;

function getFromTopojson(trace, topojson) {
    var layer = locationmodeToLayer[trace.locationmode],
        obj = topojson.objects[layer];

    return {
        features: topojsonFeature(topojson, obj).features,
        ids: obj.properties.ids
    };
}

module.exports = getFromTopojson;
