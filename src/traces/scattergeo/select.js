/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var subtypes = require('../scatter/subtypes');
var arrayRange = require('array-range');

exports.getPointsIn = function(searchInfo, polygon) {
    var pointsIn = [];
    var cd = searchInfo.cd;
    var trace = cd[0].trace;
    var hasOnlyLines = (!subtypes.hasMarkers(trace) && !subtypes.hasText(trace));
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var di;
    var lonlat;
    var x;
    var y;
    var i;

    if(hasOnlyLines) return [];

    for(i = 0; i < cd.length; i++) {
        di = cd[i];
        lonlat = di.lonlat;
        x = xa.c2p(lonlat);
        y = ya.c2p(lonlat);

        if(polygon.contains([x, y])) {
            pointsIn.push(i);
        }
    }

    return pointsIn;
};

exports.toggleSelected = function(searchInfo, selected, pointIds) {
    var selection = [];
    var cd = searchInfo.cd;
    var modifyAll = !Array.isArray(pointIds);
    var di;
    var pointId;
    var lonlat;
    var i;

    if(modifyAll) {
        pointIds = arrayRange(cd.length);
    }

    // Mutate state
    for(i = 0; i < pointIds.length; i++) {
        pointId = pointIds[i];
        cd[pointId].selected = selected ? 1 : 0;
    }

    // Compute selection array from internal state
    for(i = 0; i < cd.length; i++) {
        di = cd[i];
        if(di.selected === 1) {
            lonlat = di.lonlat;
            selection.push({
                pointNumber: i,
                lon: lonlat[0],
                lat: lonlat[1]
            });
        }
    }

    return selection;
};
