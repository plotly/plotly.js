/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

function getDelay(fullLayout) {
    return (fullLayout._hasGL3D || fullLayout._hasGL2D) ? 500 : 0;
}

function getRedrawFunc(gd) {
    return function() {
        var fullLayout = gd._fullLayout;

        // doesn't work presently (and not needed) for polar or gl
        if(fullLayout._hasGL3D || fullLayout._hasGL2D ||
            (gd.data && gd.data[0] && gd.data[0].r)
        ) return;

        (gd.calcdata || []).forEach(function(d) {
            if(d[0] && d[0].t && d[0].t.cb) d[0].t.cb();
        });
    };
}

var Snapshot = {
    getDelay: getDelay,
    getRedrawFunc: getRedrawFunc,
    clone: require('./cloneplot'),
    toSVG: require('./tosvg'),
    svgToImg: require('./svgtoimg'),
    toImage: require('./toimage')
};

module.exports = Snapshot;
