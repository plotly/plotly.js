'use strict';

function getTopojsonPath(geoLayout) {
    return [
        '../topojson/',
        geoLayout.scope, '_', geoLayout.resolution.toString(),
        '.json'
    ].join('');
}

module.exports = getTopojsonPath;
