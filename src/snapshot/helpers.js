/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

exports.getDelay = function(fullLayout) {

    // polar clears fullLayout._has for some reason
    if(!fullLayout._has) return 0;

    // maybe we should add a 'gl' (and 'svg') layoutCategory ??
    return (fullLayout._has('gl3d') || fullLayout._has('gl2d')) ? 500 : 0;
};

exports.getRedrawFunc = function(gd) {

    // do not work if polar is present
    if((gd.data && gd.data[0] && gd.data[0].r)) return;

    return function() {
        (gd.calcdata || []).forEach(function(d) {
            if(d[0] && d[0].t && d[0].t.cb) d[0].t.cb();
        });
    };
};
