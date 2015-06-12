'use strict';

/* global ENV:false */


function getTopojsonPath(geoLayout) {
    var pathParts = [];

    try {
        pathParts[0] = ENV.STATIC_URL;
    }
    catch(err) {
        pathParts[0] = '../shelly/plotlyjs/static/';
    }

    return pathParts.concat([
        'plotlyjs/src/geo/topojson/',
        geoLayout.scope.replace(/ /g, '-'), '_',
        geoLayout.resolution.toString(), 'm',
        '.json'
    ]).join('');
}

module.exports = getTopojsonPath;
