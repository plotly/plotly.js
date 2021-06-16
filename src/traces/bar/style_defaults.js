'use strict';

var Color = require('../../components/color');
var hasColorscale = require('../../components/colorscale/helpers').hasColorscale;
var colorscaleDefaults = require('../../components/colorscale/defaults');
var coercePattern = require('../../lib').coercePattern;

module.exports = function handleStyleDefaults(traceIn, traceOut, coerce, defaultColor, layout) {
    var markerColor = coerce('marker.color', defaultColor);
    var hasMarkerColorscale = hasColorscale(traceIn, 'marker');
    if(hasMarkerColorscale) {
        colorscaleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: 'marker.', cLetter: 'c'}
        );
    }

    coerce('marker.line.color', Color.defaultLine);

    if(hasColorscale(traceIn, 'marker.line')) {
        colorscaleDefaults(
            traceIn, traceOut, layout, coerce, {prefix: 'marker.line.', cLetter: 'c'}
        );
    }

    coerce('marker.line.width');
    coerce('marker.opacity');
    coercePattern(coerce, 'marker.pattern', markerColor, hasMarkerColorscale);
    coerce('selected.marker.color');
    coerce('unselected.marker.color');
};
