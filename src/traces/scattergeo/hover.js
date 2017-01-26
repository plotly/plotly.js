/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Fx = require('../../plots/cartesian/graph_interact');
var Axes = require('../../plots/cartesian/axes');

var getTraceColor = require('../scatter/get_trace_color');
var attributes = require('./attributes');


module.exports = function hoverPoints(pointData) {
    var cd = pointData.cd,
        trace = cd[0].trace,
        xa = pointData.xa,
        ya = pointData.ya,
        geo = pointData.subplot;

    if(cd[0].placeholder) return;

    function c2p(lonlat) {
        return geo.projection(lonlat);
    }

    function distFn(d) {
        var lonlat = d.lonlat;

        // this handles the not-found location feature case
        if(lonlat[0] === null || lonlat[1] === null) return Infinity;

        if(geo.isLonLatOverEdges(lonlat)) return Infinity;

        var pos = c2p(lonlat);

        var xPx = xa.c2p(),
            yPx = ya.c2p();

        var dx = Math.abs(xPx - pos[0]),
            dy = Math.abs(yPx - pos[1]),
            rad = Math.max(3, d.mrc || 0);

        // N.B. d.mrc is the calculated marker radius
        // which is only set for trace with 'markers' mode.

        return Math.max(Math.sqrt(dx * dx + dy * dy) - rad, 1 - 3 / rad);
    }

    Fx.getClosest(cd, distFn, pointData);

    // skip the rest (for this trace) if we didn't find a close point
    if(pointData.index === false) return;

    var di = cd[pointData.index],
        lonlat = di.lonlat,
        pos = c2p(lonlat),
        rad = di.mrc || 1;

    pointData.x0 = pos[0] - rad;
    pointData.x1 = pos[0] + rad;
    pointData.y0 = pos[1] - rad;
    pointData.y1 = pos[1] + rad;

    pointData.loc = di.loc;
    pointData.lat = lonlat[0];
    pointData.lon = lonlat[1];

    pointData.color = getTraceColor(trace, di);
    pointData.extraText = getExtraText(trace, di, geo.mockAxis);

    return [pointData];
};

function getExtraText(trace, pt, axis) {
    var hoverinfo = trace.hoverinfo;

    var parts = (hoverinfo === 'all') ?
        attributes.hoverinfo.flags :
        hoverinfo.split('+');

    var hasLocation = parts.indexOf('location') !== -1 && Array.isArray(trace.locations),
        hasLon = (parts.indexOf('lon') !== -1),
        hasLat = (parts.indexOf('lat') !== -1),
        hasText = (parts.indexOf('text') !== -1);

    var text = [];

    function format(val) {
        return Axes.tickText(axis, axis.c2l(val), 'hover').text + '\u00B0';
    }

    if(hasLocation) text.push(pt.loc);
    else if(hasLon && hasLat) {
        text.push('(' + format(pt.lonlat[0]) + ', ' + format(pt.lonlat[1]) + ')');
    }
    else if(hasLon) text.push('lon: ' + format(pt.lonlat[0]));
    else if(hasLat) text.push('lat: ' + format(pt.lonlat[1]));

    if(hasText) {
        var tx = pt.tx || trace.text;
        if(!Array.isArray(tx)) text.push(tx);
    }

    return text.join('<br>');
}
