'use strict';

var Fx = require('../../components/fx');
var BADNUM = require('../../constants/numerical').BADNUM;

var getTraceColor = require('../scatter/get_trace_color');
var fillText = require('../../lib').fillText;
var attributes = require('./attributes');

module.exports = function hoverPoints(pointData, xval, yval) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var xa = pointData.xa;
    var ya = pointData.ya;
    var geo = pointData.subplot;

    var isLonLatOverEdges = geo.projection.isLonLatOverEdges;
    var project = geo.project;

    function distFn(d) {
        var lonlat = d.lonlat;

        if(lonlat[0] === BADNUM) return Infinity;
        if(isLonLatOverEdges(lonlat)) return Infinity;

        var pt = project(lonlat);
        var px = project([xval, yval]);
        var dx = Math.abs(pt[0] - px[0]);
        var dy = Math.abs(pt[1] - px[1]);
        var rad = Math.max(3, d.mrc || 0);

        // N.B. d.mrc is the calculated marker radius
        // which is only set for trace with 'markers' mode.

        return Math.max(Math.sqrt(dx * dx + dy * dy) - rad, 1 - 3 / rad);
    }

    Fx.getClosest(cd, distFn, pointData);

    // skip the rest (for this trace) if we didn't find a close point
    if(pointData.index === false) return;

    var di = cd[pointData.index];
    var lonlat = di.lonlat;
    var pos = [xa.c2p(lonlat), ya.c2p(lonlat)];
    var rad = di.mrc || 1;

    pointData.x0 = pos[0] - rad;
    pointData.x1 = pos[0] + rad;
    pointData.y0 = pos[1] - rad;
    pointData.y1 = pos[1] + rad;

    pointData.loc = di.loc;
    pointData.lon = lonlat[0];
    pointData.lat = lonlat[1];

    var fullLayout = {};
    fullLayout[trace.geo] = {_subplot: geo};
    var labels = trace._module.formatLabels(di, trace, fullLayout);
    pointData.lonLabel = labels.lonLabel;
    pointData.latLabel = labels.latLabel;

    pointData.color = getTraceColor(trace, di);
    pointData.extraText = getExtraText(trace, di, pointData, cd[0].t.labels);
    pointData.hovertemplate = trace.hovertemplate;

    return [pointData];
};

function getExtraText(trace, pt, pointData, labels) {
    if(trace.hovertemplate) return;

    var hoverinfo = pt.hi || trace.hoverinfo;

    var parts = hoverinfo === 'all' ?
        attributes.hoverinfo.flags :
        hoverinfo.split('+');

    var hasLocation = parts.indexOf('location') !== -1 && Array.isArray(trace.locations);
    var hasLon = (parts.indexOf('lon') !== -1);
    var hasLat = (parts.indexOf('lat') !== -1);
    var hasText = (parts.indexOf('text') !== -1);
    var text = [];

    function format(val) { return val + '\u00B0'; }

    if(hasLocation) {
        text.push(pt.loc);
    } else if(hasLon && hasLat) {
        text.push('(' + format(pointData.latLabel) + ', ' + format(pointData.lonLabel) + ')');
    } else if(hasLon) {
        text.push(labels.lon + format(pointData.lonLabel));
    } else if(hasLat) {
        text.push(labels.lat + format(pointData.latLabel));
    }

    if(hasText) {
        fillText(pt, trace, text);
    }

    return text.join('<br>');
}
