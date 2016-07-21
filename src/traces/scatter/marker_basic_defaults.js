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

var subTypes = require('./subtypes');


// common to 'scatter', 'scatter3d', 'scattergeo' and 'scattergl'
module.exports = function markerDefaults(traceIn, traceOut, defaultColor, layout, coerce) {
    var isBubble = subTypes.isBubble(traceIn),
        lineColor = !Array.isArray(traceIn.line) ? (traceIn.line || {}).color : undefined;

    if(lineColor) defaultColor = lineColor;

    coerce('marker.opacity', isBubble ? 0.7 : 1);
    coerce('marker.size');

    coerce('marker.color', defaultColor);
    if(hasColorscale(traceIn, 'marker')) {
        colorscaleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: 'marker.', cLetter: 'c'}
        );
    }

    if(isBubble) {
        coerce('marker.sizeref');
        coerce('marker.sizemin');
        coerce('marker.sizemode');
    }

    return lineColor;
};
