/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Axes = require('../../plots/cartesian/axes');
var attributes = require('./attributes');
var fillText = require('../../lib').fillText;

module.exports = function hoverPoints(pointData, xval, yval) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var geo = pointData.subplot;

    var pt, i, j, isInside;

    var xy = [xval, yval];
    var altXy = [xval + 360, yval];

    for(i = 0; i < cd.length; i++) {
        pt = cd[i];
        isInside = false;

        if(pt._polygons) {
            for(j = 0; j < pt._polygons.length; j++) {
                if(pt._polygons[j].contains(xy)) {
                    isInside = !isInside;
                }
                // for polygons that cross antimeridian as xval is in [-180, 180]
                if(pt._polygons[j].contains(altXy)) {
                    isInside = !isInside;
                }
            }

            if(isInside) break;
        }
    }

    if(!isInside || !pt) return;

    pointData.x0 = pointData.x1 = pointData.xa.c2p(pt.ct);
    pointData.y0 = pointData.y1 = pointData.ya.c2p(pt.ct);

    pointData.index = pt.index;
    pointData.location = pt.loc;
    pointData.z = pt.z;
    pointData.zLabel = Axes.tickText(geo.mockAxis, geo.mockAxis.c2l(pt.z), 'hover').text;
    pointData.hovertemplate = pt.hovertemplate;

    makeHoverInfo(pointData, trace, pt);

    return [pointData];
};

function makeHoverInfo(pointData, trace, pt) {
    if(trace.hovertemplate) return;

    var hoverinfo = pt.hi || trace.hoverinfo;
    var loc = String(pt.loc);

    var parts = (hoverinfo === 'all') ?
        attributes.hoverinfo.flags :
        hoverinfo.split('+');

    var hasName = (parts.indexOf('name') !== -1);
    var hasLocation = (parts.indexOf('location') !== -1);
    var hasZ = (parts.indexOf('z') !== -1);
    var hasText = (parts.indexOf('text') !== -1);
    var hasIdAsNameLabel = !hasName && hasLocation;

    var text = [];

    if(hasIdAsNameLabel) {
        pointData.nameOverride = loc;
    } else {
        if(hasName) pointData.nameOverride = trace.name;
        if(hasLocation) text.push(loc);
    }

    if(hasZ) {
        text.push(pointData.zLabel);
    }
    if(hasText) {
        fillText(pt, trace, text);
    }

    pointData.extraText = text.join('<br>');
}
