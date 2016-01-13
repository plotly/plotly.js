/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Fx = require('../cartesian/graph_interact');

function createGeoZoomReset(geo, geoLayout) {
    var projection = geo.projection,
        zoom = geo.zoom;

    var zoomReset = function() {
        geo.makeProjection(geoLayout);
        geo.makePath();

        zoom.scale(projection.scale());
        zoom.translate(projection.translate());

        Fx.loneUnhover(geo.hoverContainer);

        geo.render();
    };

    return zoomReset;
}

module.exports = createGeoZoomReset;
