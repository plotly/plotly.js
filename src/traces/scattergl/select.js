/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var subtypes = require('../scatter/subtypes');

module.exports = function selectPoints(searchInfo, polygon) {
    var cd = searchInfo.cd,
        xa = searchInfo.xaxis,
        ya = searchInfo.yaxis,
        selection = [],
        trace = cd[0].trace,
        i,
        di,
        x,
        y;

    var glTrace = cd[0]._glTrace;
    var scene = glTrace.scene;

    var hasOnlyLines = (!subtypes.hasMarkers(trace) && !subtypes.hasText(trace));
    if(trace.visible !== true || hasOnlyLines) return [];

    // filter out points by visible scatter ones
    if(polygon === false) {
        // clear selection
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

    // highlight selected points here
    trace.selection = selection;

    glTrace.update(trace, cd);
    scene.glplot.setDirty();

    return selection;
};
