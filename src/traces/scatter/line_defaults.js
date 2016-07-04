/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var hasColorscale = require('../../components/colorscale/has_colorscale');
var colorscaleDefaults = require('../../components/colorscale/defaults');


// common to 'scatter', 'scatter3d', 'scattergeo' and 'scattergl'
module.exports = function lineDefaults(traceIn, traceOut, defaultColor, layout, coerce) {

    var markerColor = (traceIn.marker || {}).color;

    coerce('line.color', defaultColor);
    if(hasColorscale(traceIn, 'line')) {
        colorscaleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: 'line.', cLetter: 'c'}
        );
    } else {
        coerce('line.color', (Array.isArray(markerColor) ? false : markerColor) ||
            defaultColor);
    }


    coerce('line.width');
    coerce('line.dash');
};
