/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Lib = require('../../lib');

var constants = require('../scatter/constants');
var subTypes = require('../scatter/subtypes');
var handleMarkerDefaults = require('../scatter/marker_defaults');
var handleLineDefaults = require('../scatter/line_defaults');
var handleLineShapeDefaults = require('../scatter/line_shape_defaults');
var handleTextDefaults = require('../scatter/text_defaults');
var handleFillColorDefaults = require('../scatter/fillcolor_defaults');

var attributes = require('./attributes');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    coerce('carpet');

    // XXX: Don't hard code this
    traceOut.xaxis = 'x';
    traceOut.yaxis = 'y';

    var a = coerce('a'),
        b = coerce('b'),
        len;

    len = Math.min(a.length, b.length);

    if(!len) {
        traceOut.visible = false;
        return;
    }

    // cut all data arrays down to same length
    if(a && len < a.length) traceOut.a = a.slice(0, len);
    if(b && len < b.length) traceOut.b = b.slice(0, len);

    coerce('sum');

    coerce('text');

    var defaultMode = len < constants.PTS_LINESONLY ? 'lines+markers' : 'lines';
    coerce('mode', defaultMode);

    if(subTypes.hasLines(traceOut)) {
        handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce);
        handleLineShapeDefaults(traceIn, traceOut, coerce);
        coerce('connectgaps');
    }

    if(subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce);
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

    coerce('hoverinfo', (layout._dataLength === 1) ? 'a+b+text' : undefined);

    if(traceOut.fill === 'tonext' || traceOut.fill === 'toself') {
        dfltHoverOn.push('fills');
    }
    coerce('hoveron', dfltHoverOn.join('+') || 'points');
};
