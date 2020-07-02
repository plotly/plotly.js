/**
* Copyright 2012-2020, Plotly, Inc.
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

var attributes = require('./attributes');

module.exports = function supplyDefaults(gd, traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleXYZDefaults(gd, traceIn, traceOut, coerce, layout);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('mode');

    if(subTypes.hasLines(traceOut)) {
        coerce('connectgaps');
        handleLineDefaults(gd, traceIn, traceOut, defaultColor, layout, coerce);
    }

    if(subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(gd, traceIn, traceOut, defaultColor, layout, coerce, {noSelect: true});
    }

    if(subTypes.hasText(traceOut)) {
        coerce('texttemplate');
        handleTextDefaults(gd, traceIn, traceOut, layout, coerce, {noSelect: true});
    }

    var lineColor = (traceOut.line || {}).color;
    var markerColor = (traceOut.marker || {}).color;
    if(coerce('surfaceaxis') >= 0) coerce('surfacecolor', lineColor || markerColor);

    var dims = ['x', 'y', 'z'];
    for(var i = 0; i < 3; ++i) {
        var projection = 'projection.' + dims[i];
        if(coerce(projection + '.show')) {
            coerce(projection + '.opacity');
            coerce(projection + '.scale');
        }
    }

    var errorBarsSupplyDefaults = Registry.getComponentMethod('errorbars', 'supplyDefaults');
    errorBarsSupplyDefaults(gd, traceIn, traceOut, lineColor || markerColor || defaultColor, {axis: 'z'});
    errorBarsSupplyDefaults(gd, traceIn, traceOut, lineColor || markerColor || defaultColor, {axis: 'y', inherit: 'z'});
    errorBarsSupplyDefaults(gd, traceIn, traceOut, lineColor || markerColor || defaultColor, {axis: 'x', inherit: 'z'});
};

function handleXYZDefaults(gd, traceIn, traceOut, coerce, layout) {
    var len = 0;
    var x = coerce('x');
    var y = coerce('y');
    var z = coerce('z');

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(gd, traceIn, traceOut, ['x', 'y', 'z'], layout);

    if(x && y && z) {
        // TODO: what happens if one is missing?
        len = Math.min(x.length, y.length, z.length);
        traceOut._length = traceOut._xlength = traceOut._ylength = traceOut._zlength = len;
    }

    return len;
}
