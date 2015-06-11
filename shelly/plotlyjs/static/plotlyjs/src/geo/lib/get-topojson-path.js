'use strict';

/* global ENV:false */


function getTopojsonPath(geoLayout) {
    return [
        'static/plotlyjs/src/geo/topojson/',
//         '../shelly/plotlyjs/static/plotlyjs/src/geo/topojson/',
        geoLayout.scope.replace(/ /g, '-'), '_',
        geoLayout.resolution.toString(), 'm',
        '.json'
    ].join('');
}

module.exports = getTopojsonPath;
