'use strict';

var clearHover = require('./clear-hover');


function createGeoZoomReset(geo, geoLayout) {
    var projection = geo.projection,
        zoom = geo.zoom;
    
    var zoomReset = function() {
        geo.makeProjection(geoLayout);
        geo.makePath();

        zoom.scale(projection.scale());
        zoom.translate(projection.translate());
        clearHover(geo.framework);

        geo.render();
    };

    return zoomReset;
}

module.exports = createGeoZoomReset;
