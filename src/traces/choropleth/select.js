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
    var selection = [];
    var node3 = cd[0].node3;

    var i, di, ct, x, y;

    if(polygon === false) {
        for(i = 0; i < cd.length; i++) {
            cd[i].dim = 0;
        }
    } else {
        for(i = 0; i < cd.length; i++) {
            di = cd[i];
            ct = di.ct;

            if(!ct) continue;

            x = xa.c2p(ct);
            y = ya.c2p(ct);

            if(polygon.contains([x, y])) {
                selection.push({
                    pointNumber: i,
                    lon: ct[0],
                    lat: ct[1]
                });
                di.dim = 0;
            } else {
                di.dim = 1;
            }
        }
    }

    node3.selectAll('path').style('opacity', function(d) {
        return d.dim ? DESELECTDIM : 1;
    });

    return selection;
};
