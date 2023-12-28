'use strict';

var Registry = require('../../registry');
var Lib = require('../../lib');

var subTypes = require('../scatter/subtypes');
var handleMarkerDefaults = require('../scatter/marker_defaults');
var handleLineDefaults = require('../scatter/line_defaults');
var handleTextDefaults = require('../scatter/text_defaults');

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
    coerce('hovertemplate');
    coerce('xhoverformat');
    coerce('yhoverformat');
    coerce('zhoverformat');

    coerce('mode');

    if(subTypes.hasLines(traceOut)) {
        coerce('connectgaps');
        handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce);
    }

    if(subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce, {noSelect: true, noAngle: true});
    }

    if(subTypes.hasText(traceOut)) {
        coerce('texttemplate');
        handleTextDefaults(traceIn, traceOut, layout, coerce, {noSelect: true});
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
    errorBarsSupplyDefaults(traceIn, traceOut, lineColor || markerColor || defaultColor, {axis: 'z'});
    errorBarsSupplyDefaults(traceIn, traceOut, lineColor || markerColor || defaultColor, {axis: 'y', inherit: 'z'});
    errorBarsSupplyDefaults(traceIn, traceOut, lineColor || markerColor || defaultColor, {axis: 'x', inherit: 'z'});
};

function handleXYZDefaults(traceIn, traceOut, coerce, layout) {
    var len = 0;
    var x = coerce('x');
    var y = coerce('y');
    var z = coerce('z');

    var handleCalendarDefaults = Registry.getComponentMethod('calendars', 'handleTraceDefaults');
    handleCalendarDefaults(traceIn, traceOut, ['x', 'y', 'z'], layout);

    if(x && y && z) {
        // TODO: what happens if one is missing?
        len = Math.min(x.length, y.length, z.length);
        traceOut._length = traceOut._xlength = traceOut._ylength = traceOut._zlength = len;
    }

    return len;
}
