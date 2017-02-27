/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Axes = require('../../plots/cartesian/axes');
var attributes = require('./attributes');

module.exports = function hoverPoints(pointData) {
    var cd = pointData.cd;
    var trace = cd[0].trace;
    var geo = pointData.subplot;

    // set on choropleth paths 'mouseover'
    var pt = geo.choroplethHoverPt;

    if(!pt) return;

    var centroid = geo.projection(pt.properties.ct);

    pointData.x0 = pointData.x1 = centroid[0];
    pointData.y0 = pointData.y1 = centroid[1];

    pointData.index = pt.index;
    pointData.location = pt.id;
    pointData.z = pt.z;

    makeHoverInfo(pointData, trace, pt, geo.mockAxis);

    return [pointData];
};

function makeHoverInfo(pointData, trace, pt, axis) {
    var hoverinfo = trace.hoverinfo;

    var parts = (hoverinfo === 'all') ?
        attributes.hoverinfo.flags :
        hoverinfo.split('+');

    var hasName = (parts.indexOf('name') !== -1),
        hasLocation = (parts.indexOf('location') !== -1),
        hasZ = (parts.indexOf('z') !== -1),
        hasText = (parts.indexOf('text') !== -1),
        hasIdAsNameLabel = !hasName && hasLocation;

    var text = [];

    function formatter(val) {
        return Axes.tickText(axis, axis.c2l(val), 'hover').text;
    }

    if(hasIdAsNameLabel) pointData.nameOverride = pt.id;
    else {
        if(hasName) pointData.nameOverride = trace.name;
        if(hasLocation) text.push(pt.id);
    }

    if(hasZ) text.push(formatter(pt.z));
    if(hasText) text.push(pt.tx);

    pointData.extraText = text.join('<br>');
}
