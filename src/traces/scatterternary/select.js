/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var scatterSelect = require('../scatter/select');


module.exports = function selectPoints(searchInfo, polygon) {
    var selection = scatterSelect(searchInfo, polygon);
    if(!selection) return;

    var cd = searchInfo.cd,
        pt, cdi, i;

    for(i = 0; i < selection.length; i++) {
        pt = selection[i];
        cdi = cd[pt.pointNumber];
        pt.a = cdi.a;
        pt.b = cdi.b;
        pt.c = cdi.c;
        delete pt.x;
        delete pt.y;
    }

    return selection;
};
