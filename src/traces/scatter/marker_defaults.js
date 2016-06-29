/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var markerBasicDefaults = require('./marker_basic_defaults');
var Color = require('../../components/color');
var hasColorscale = require('../../components/colorscale/has_colorscale');
var colorscaleDefaults = require('../../components/colorscale/defaults');

var subTypes = require('./subtypes');

// common to 'scatter', 'scatter3d', 'scattergeo' and 'scattergl'
module.exports = function markerDefaults(traceIn, traceOut, defaultColor, layout, coerce) {

    var defaultMLC;

    var isBubble = subTypes.isBubble(traceIn)
    var lineColor = markerBasicDefaults(traceIn, traceOut, defaultColor, layout, coerce);

    coerce('marker.symbol');

    // if there's a line with a different color than the marker, use
    // that line color as the default marker line color
    // mostly this is for transparent markers to behave nicely
    if(lineColor && (traceOut.marker.color !== lineColor)) {
        defaultMLC = lineColor;
    }
    else if(isBubble) defaultMLC = Color.background;
    else defaultMLC = Color.defaultLine;

    coerce('marker.line.color', defaultMLC);

    if(hasColorscale(traceIn, 'marker.line')) {
        colorscaleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: 'marker.line.', cLetter: 'c'}
        );
    }

    coerce('marker.line.width', isBubble ? 1 : 0);


};
