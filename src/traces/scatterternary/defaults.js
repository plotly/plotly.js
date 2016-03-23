/**
* Copyright 2012-2016, Plotly, Inc.
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

    var a = coerce('a') || [],
        b = coerce('b') || [],
        c = coerce('c') || [],
        len;

    // allow any one array to be missing, len is the minimum
    // of any that have data
    if(a.length) {
        len = a.length;
        if(b.length) {
            len = Math.min(len, b.length);
            if(c.length) len = Math.min(len, c.length);
        }
        else len = Math.min(len, c.length);
    }
    else len = Math.min(b.length, c.length);

    if(!len) {
        traceOut.visible = false;
        return;
    }

    // cut all data arrays down to same length
    if(len < a.length) traceOut.a = a.slice(0, len);
    if(len < b.length) traceOut.b = b.slice(0, len);
    if(len < c.length) traceOut.c = c.slice(0, len);

    coerce('sum');

    coerce('text');

    var defaultMode = len < constants.PTS_LINESONLY ? 'lines+markers' : 'lines';
    coerce('mode', defaultMode);

    if(subTypes.hasLines(traceOut)) {
        handleLineDefaults(traceIn, traceOut, defaultColor, coerce);
        handleLineShapeDefaults(traceIn, traceOut, coerce);
        coerce('connectgaps');
    }

    if(subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce);
    }

    if(subTypes.hasText(traceOut)) {
        handleTextDefaults(traceIn, traceOut, layout, coerce);
    }

    if(subTypes.hasMarkers(traceOut) || subTypes.hasText(traceOut)) {
        coerce('marker.maxdisplayed');
    }

    coerce('fill');
    if(traceOut.fill !== 'none') {
        handleFillColorDefaults(traceIn, traceOut, defaultColor, coerce);
        if(!subTypes.hasLines(traceOut)) handleLineShapeDefaults(traceIn, traceOut, coerce);
    }
};
