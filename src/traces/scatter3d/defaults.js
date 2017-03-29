/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Registry = require('../../registry');
var Lib = require('../../lib');

var subTypes = require('../scatter/subtypes');
var handleMarkerDefaults = require('../scatter/marker_defaults');
var handleLineDefaults = require('../scatter/line_defaults');
var handleTextDefaults = require('../scatter/text_defaults');
var errorBarsSupplyDefaults = require('../../components/errorbars/defaults');

var attributes = require('./attributes');


module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {

    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleXYZDefaults(traceIn, traceOut, coerce, layout);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('text');
    coerce('hovertext');
    coerce('mode');

    if(subTypes.hasLines(traceOut)) {
        coerce('connectgaps');
        handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce);
    }

    if(subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce);
    }

    if(subTypes.hasText(traceOut)) {
        handleTextDefaults(traceIn, traceOut, layout, coerce);
    }

    var lineColor = (traceOut.line || {}).color,
        markerColor = (traceOut.marker || {}).color;
    if(coerce('surfaceaxis') >= 0) coerce('surfacecolor', lineColor || markerColor);

    var dims = ['x', 'y', 'z'];
    for(var i = 0; i < 3; ++i) {
        var projection = 'projection.' + dims[i];
        if(coerce(projection + '.show')) {
            coerce(projection + '.opacity');
            coerce(projection + '.scale');
        }
    }

    errorBarsSupplyDefaults(traceIn, traceOut, defaultColor, {axis: 'z'});
    errorBarsSupplyDefaults(traceIn, traceOut, defaultColor, {axis: 'y', inherit: 'z'});
    errorBarsSupplyDefaults(traceIn, traceOut, defaultColor, {axis: 'x', inherit: 'z'});
};

function handleXYZDefaults(traceIn, traceOut, coerce, layout) {
    var len = 0,
        x = coerce('x'),
        y = coerce('y'),
        z = coerce('z');

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x', 'y', 'z'], layout);

    if(x && y && z) {
        len = Math.min(x.length, y.length, z.length);
        if(len < x.length) traceOut.x = x.slice(0, len);
        if(len < y.length) traceOut.y = y.slice(0, len);
        if(len < z.length) traceOut.z = z.slice(0, len);
    }

    return len;
}
