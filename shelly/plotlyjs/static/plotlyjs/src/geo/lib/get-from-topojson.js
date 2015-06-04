'use strict';

var locationmodeToLayer = require('./params').locationmodeToLayer,
    topojsonPackage = require('topojson');

function getFromTopojson(trace, topojson) {
    var layer = locationmodeToLayer[trace.locmode],
        obj = topojson.objects[layer];
    return {
        features: topojsonPackage.feature(topojson, obj).features,
        ids: obj.properties.ids
    };
}

module.exports = getFromTopojson;
