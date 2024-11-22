'use strict';

var isArrayOrTypedArray = require('../../lib').isArrayOrTypedArray;
var hasColorscale = require('../../components/colorscale/helpers').hasColorscale;
var colorscaleDefaults = require('../../components/colorscale/defaults');

module.exports = function lineDefaults(traceIn, traceOut, defaultColor, layout, coerce, opts) {
    if(!opts) opts = {};

    var markerColor = (traceIn.marker || {}).color;
    if(markerColor && markerColor._inputArray) markerColor = markerColor._inputArray;

    coerce('line.color', defaultColor);

    if(hasColorscale(traceIn, 'line')) {
        colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: 'line.', cLetter: 'c'});
    } else {
        var lineColorDflt = (isArrayOrTypedArray(markerColor) ? false : markerColor) || defaultColor;
        coerce('line.color', lineColorDflt);
    }

    coerce('line.width');

    if(!opts.noDash) coerce('line.dash');
    if(opts.backoff) coerce('line.backoff');
};
