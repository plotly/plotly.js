/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

module.exports = function createGeoZoomReset(geo, geoLayout) {
    var projection = geo.projection,
        zoom = geo.zoom;

    var zoomReset = function() {
        geo.makeProjection(geoLayout);
        geo.makePath();

        zoom.scale(projection.scale());
        zoom.translate(projection.translate());

        geo.render();
    };

    return zoomReset;
};
