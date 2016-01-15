/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';


// common to 'scatter', 'scatter3d', 'scattergeo' and 'scattergl'
module.exports = function lineDefaults(traceIn, traceOut, defaultColor, coerce) {
    var markerColor = (traceIn.marker || {}).color;

    // don't try to inherit a color array
    coerce('line.color', (Array.isArray(markerColor) ? false : markerColor) ||
                         defaultColor);
    coerce('line.width');
    coerce('line.dash');
};
