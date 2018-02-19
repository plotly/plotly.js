/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

exports.getDelay = function(fullLayout) {
    if(!fullLayout._has) return 0;

    return (
        fullLayout._has('gl3d') ||
        fullLayout._has('gl2d') ||
        fullLayout._has('mapbox')
    ) ? 500 : 0;
};

exports.getRedrawFunc = function(gd) {
    var fullLayout = gd._fullLayout || {};
    var hasPolar = fullLayout._has && fullLayout._has('polar');
    var hasLegacyPolar = !hasPolar && gd.data && gd.data[0] && gd.data[0].r;

    // do not work for legacy polar
    if(hasLegacyPolar) return;

    return function() {
        (gd.calcdata || []).forEach(function(d) {
            if(d[0] && d[0].t && d[0].t.cb) d[0].t.cb();
        });
    };
};
