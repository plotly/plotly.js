'use strict';

var Color = require('../../components/color');
var isArrayOrTypedArray = require('../../lib').isArrayOrTypedArray;

module.exports = function fillColorDefaults(traceIn, traceOut, defaultColor, coerce) {
    var inheritColorFromMarker = false;

    if(traceOut.marker) {
        // don't try to inherit a color array
        var markerColor = traceOut.marker.color;
        var markerLineColor = (traceOut.marker.line || {}).color;

        if(markerColor && !isArrayOrTypedArray(markerColor)) {
            inheritColorFromMarker = markerColor;
        } else if(markerLineColor && !isArrayOrTypedArray(markerLineColor)) {
            inheritColorFromMarker = markerLineColor;
        }
    }

    coerce('fillcolor', Color.addOpacity(
        (traceOut.line || {}).color ||
        inheritColorFromMarker ||
        defaultColor, 0.5
    ));
};
