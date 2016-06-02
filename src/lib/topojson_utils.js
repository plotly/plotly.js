/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var topojsonUtils = module.exports = {};

var locationmodeToLayer = require('../plots/geo/constants').locationmodeToLayer,
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
