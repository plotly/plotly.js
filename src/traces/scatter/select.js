/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var subtypes = require('./subtypes');
var DESELECTDIM = require('../../constants/interactions').DESELECTDIM;

module.exports = function selectPoints(searchInfo, polygon) {
    var cd = searchInfo.cd,
        xa = searchInfo.xaxis,
        ya = searchInfo.yaxis,
        selection = [],
        trace = cd[0].trace,
        marker = trace.marker,
        i,
        di,
        x,
        y;

    // TODO: include lines? that would require per-segment line properties
    var hasOnlyLines = (!subtypes.hasMarkers(trace) && !subtypes.hasText(trace));
    if(trace.visible !== true || hasOnlyLines) return [];

    var opacity = Array.isArray(marker.opacity) ? 1 : marker.opacity;

    if(polygon === false) { // clear selection
        for(i = 0; i < cd.length; i++) cd[i].dim = 0;
    }
    else {
        for(i = 0; i < cd.length; i++) {
            di = cd[i];
            x = xa.c2p(di.x);
            y = ya.c2p(di.y);

            if(polygon.contains([x, y])) {
                selection.push({
                    pointNumber: i,
                    x: di.x,
                    y: di.y
                });
                di.dim = 0;
            }
            else di.dim = 1;
        }
    }

    // do the dimming here, as well as returning the selection
    // The logic here duplicates Drawing.pointStyle, but I don't want
    // d.dim in pointStyle in case something goes wrong with selection.
    cd[0].node3.selectAll('path.point')
        .style('opacity', function(d) {
            return ((d.mo + 1 || opacity + 1) - 1) * (d.dim ? DESELECTDIM : 1);
        });
    cd[0].node3.selectAll('text')
        .style('opacity', function(d) {
            return d.dim ? DESELECTDIM : 1;
        });

    return selection;
};
