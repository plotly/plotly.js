'use strict';

var loneUnhover = require('../../plotly').Fx.loneUnhover;


function createGeoZoomReset(geo, geoLayout) {
    var projection = geo.projection,
        zoom = geo.zoom;
    
    var zoomReset = function() {
        geo.makeProjection(geoLayout);
        geo.makePath();

        zoom.scale(projection.scale());
        zoom.translate(projection.translate());

        loneUnhover(geo.hoverContainer);

        geo.render();
    };

    return zoomReset;
}

module.exports = createGeoZoomReset;
