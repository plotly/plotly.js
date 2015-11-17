/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var ScatterGeo = require('./');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    var Scatter = Plotly.Scatter;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, ScatterGeo.attributes, attr, dflt);
    }

    var len = handleLonLatLocDefaults(traceIn, traceOut, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('text');
    coerce('mode');

    if(Scatter.hasLines(traceOut)) {
        Scatter.lineDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    if(Scatter.hasMarkers(traceOut)) {
        Scatter.markerDefaults(traceIn, traceOut, defaultColor, layout, coerce);
    }

    if(Scatter.hasText(traceOut)) {
        Scatter.textDefaults(traceIn, traceOut, layout, coerce);
    }

    coerce('hoverinfo', (layout._dataLength === 1) ? 'lon+lat+location+text' : undefined);
};

function handleLonLatLocDefaults(traceIn, traceOut, coerce) {
    var len = 0,
        locations = coerce('locations');

    var lon, lat;

    if(locations) {
        coerce('locationmode');
        len = locations.length;
        return len;
    }

    lon = coerce('lon') || [];
    lat = coerce('lat') || [];
    len = Math.min(lon.length, lat.length);

    if(len < lon.length) traceOut.lon = lon.slice(0, len);
    if(len < lat.length) traceOut.lat = lat.slice(0, len);

    return len;
}
