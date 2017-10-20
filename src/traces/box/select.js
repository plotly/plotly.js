/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var DESELECTDIM = require('../../constants/interactions').DESELECTDIM;

module.exports = function selectPoints(searchInfo, polygon) {
    var cd = searchInfo.cd;
    var xa = searchInfo.xaxis;
    var ya = searchInfo.yaxis;
    var trace = cd[0].trace;
    var node3 = cd[0].node3;
    var selection = [];
    var i, j;

    if(trace.visible !== true) return [];

    if(polygon === false) {
        for(i = 0; i < cd.length; i++) {
            for(j = 0; j < (cd[i].pts || []).length; j++) {
                // clear selection
                cd[i].pts[j].dim = 0;
            }
        }
    } else {
        for(i = 0; i < cd.length; i++) {
            for(j = 0; j < (cd[i].pts || []).length; j++) {
                var pt = cd[i].pts[j];
                var x = xa.c2p(pt.x);
                var y = ya.c2p(pt.y);

                if(polygon.contains([x, y])) {
                    selection.push({
                        pointNumber: pt.i,
                        x: xa.c2d(pt.x),
                        y: ya.c2d(pt.y)
                    });
                    pt.dim = 0;
                } else {
                    pt.dim = 1;
                }
            }
        }
    }

    node3.selectAll('.point').style('opacity', function(d) {
        return d.dim ? DESELECTDIM : 1;
    });

    return selection;
};
