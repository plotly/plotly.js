/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var subtypes = require('../scatter/subtypes');
var BADNUM = require('../../constants/numerical').BADNUM;
var arrayRange = require('array-range');

exports.getPointsIn = function(searchInfo, polygon) {
    var pointsIn = [];
    var cd = searchInfo.cd;
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var trace = cd[0].trace;
    var i;

    if(!subtypes.hasMarkers(trace)) return [];

    for(i = 0; i < cd.length; i++) {
        var di = cd[i];
        var lonlat = di.lonlat;

        if(lonlat[0] !== BADNUM) {
            var lonlat2 = [Lib.wrap180(lonlat[0]), lonlat[1]];
            var xy = [xa.c2p(lonlat2), ya.c2p(lonlat2)];

            if(polygon.contains(xy)) {
                pointsIn.push(i);
            }
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
