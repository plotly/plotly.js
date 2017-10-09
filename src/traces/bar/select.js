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
    var selection = [];
    var trace = cd[0].trace;
    var node3 = cd[0].node3;
    var i;

    if(trace.visible !== true) return;

    if(polygon === false) {
        // clear selection
        for(i = 0; i < cd.length; i++) {
            cd[i].dim = 0;
        }
    } else {
        for(i = 0; i < cd.length; i++) {
            var di = cd[i];

            if(polygon.contains(di.ct)) {
                selection.push({
                    pointNumber: i,
                    x: di.x,
                    y: di.y
                });
                di.dim = 0;
            } else {
                di.dim = 1;
            }
        }
    }

    node3.selectAll('.point').style('opacity', function(d) {
        return d.dim ? DESELECTDIM : 1;
    });
    node3.selectAll('text').style('opacity', function(d) {
        return d.dim ? DESELECTDIM : 1;
    });

    return selection;
};
