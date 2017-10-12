/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var subtypes = require('../scatter/subtypes');
var DESELECTDIM = require('../../constants/interactions').DESELECTDIM;

module.exports = function selectPoints(searchInfo, polygon) {
    var cd = searchInfo.cd;
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var selection = [];
    var trace = cd[0].trace;
    var node3 = cd[0].node3;

    var di, lonlat, x, y, i;

    var hasOnlyLines = (!subtypes.hasMarkers(trace) && !subtypes.hasText(trace));
    if(trace.visible !== true || hasOnlyLines) return [];

    var marker = trace.marker;
    var opacity = Array.isArray(marker.opacity) ? 1 : marker.opacity;

    if(polygon === false) {
        for(i = 0; i < cd.length; i++) {
            cd[i].dim = 0;
        }
    } else {
        for(i = 0; i < cd.length; i++) {
            di = cd[i];
            lonlat = di.lonlat;
            x = xa.c2p(lonlat);
            y = ya.c2p(lonlat);

            if(polygon.contains([x, y])) {
                selection.push({
                    pointNumber: i,
                    lon: lonlat[0],
                    lat: lonlat[1]
                });
                di.dim = 0;
            } else {
                di.dim = 1;
            }
        }
    }

    node3.selectAll('path.point').style('opacity', function(d) {
        return ((d.mo + 1 || opacity + 1) - 1) * (d.dim ? DESELECTDIM : 1);
    });

    node3.selectAll('text').style('opacity', function(d) {
        return d.dim ? DESELECTDIM : 1;
    });

    return selection;
};
