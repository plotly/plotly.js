/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var attributes = require('./attributes');
var constants = require('./constants');
var subTypes = require('./subtypes');
var handleXYDefaults = require('./xy_defaults');
var handleMarkerDefaults = require('./marker_defaults');
var handleLineDefaults = require('./line_defaults');
var handleLineShapeDefaults = require('./line_shape_defaults');
var handleTextDefaults = require('./text_defaults');
var handleFillColorDefaults = require('./fillcolor_defaults');
var errorBarsSupplyDefaults = require('../../components/errorbars/defaults');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleXYDefaults(traceIn, traceOut, layout, coerce),
        // TODO: default mode by orphan points...
        defaultMode = len < constants.PTS_LINESONLY ? 'lines+markers' : 'lines';
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('customdata');
    coerce('text');
    coerce('hovertext');
    coerce('mode', defaultMode);
    coerce('ids');

    if(subTypes.hasLines(traceOut)) {
        handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce);
        handleLineShapeDefaults(traceIn, traceOut, coerce);
        coerce('connectgaps');
        coerce('line.simplify');
    }

    if(subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce, {gradient: true});
    }

    if(subTypes.hasText(traceOut)) {
        handleTextDefaults(traceIn, traceOut, layout, coerce);
    }

    var dfltHoverOn = [];

    if(subTypes.hasMarkers(traceOut) || subTypes.hasText(traceOut)) {
        coerce('marker.maxdisplayed');
        dfltHoverOn.push('points');
    }

    coerce('fill');
    if(traceOut.fill !== 'none') {
        handleFillColorDefaults(traceIn, traceOut, defaultColor, coerce);
        if(!subTypes.hasLines(traceOut)) handleLineShapeDefaults(traceIn, traceOut, coerce);
    }

    if(traceOut.fill === 'tonext' || traceOut.fill === 'toself') {
        dfltHoverOn.push('fills');
    }
    coerce('hoveron', dfltHoverOn.join('+') || 'points');

    errorBarsSupplyDefaults(traceIn, traceOut, defaultColor, {axis: 'y'});
    errorBarsSupplyDefaults(traceIn, traceOut, defaultColor, {axis: 'x', inherit: 'y'});
};
