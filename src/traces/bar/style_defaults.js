'use strict';

var Color = require('../../components/color');
var hasColorscale = require('../../components/colorscale/helpers').hasColorscale;
var colorscaleDefaults = require('../../components/colorscale/defaults');
var coercePattern = require('../../lib').coercePattern;

module.exports = function handleStyleDefaults(traceIn, traceOut, coerce, defaultColor, layout) {
    coerce('marker.color', defaultColor);

    if(hasColorscale(traceIn, 'marker')) {
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
    coercePattern(coerce, 'marker.pattern');

    coerce('selected.marker.color');
    coerce('unselected.marker.color');
};
