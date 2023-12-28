'use strict';

var Lib = require('../../lib');
var Registry = require('../../registry');

var attributes = require('./attributes');
var constants = require('./constants');
var subTypes = require('./subtypes');
var handleXYDefaults = require('./xy_defaults');
var handlePeriodDefaults = require('./period_defaults');
var handleStackDefaults = require('./stack_defaults');
var handleMarkerDefaults = require('./marker_defaults');
var handleLineDefaults = require('./line_defaults');
var handleLineShapeDefaults = require('./line_shape_defaults');
var handleTextDefaults = require('./text_defaults');
var handleFillColorDefaults = require('./fillcolor_defaults');
var coercePattern = require('../../lib').coercePattern;

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleXYDefaults(traceIn, traceOut, layout, coerce);
    if(!len) traceOut.visible = false;

    if(!traceOut.visible) return;

    handlePeriodDefaults(traceIn, traceOut, layout, coerce);
    coerce('xhoverformat');
    coerce('yhoverformat');

    var stackGroupOpts = handleStackDefaults(traceIn, traceOut, layout, coerce);
    if(
        layout.scattermode === 'group' &&
        traceOut.orientation === undefined
    ) {
        coerce('orientation', 'v');
    }

    var defaultMode = !stackGroupOpts && (len < constants.PTS_LINESONLY) ?
        'lines+markers' : 'lines';
    coerce('text');
    coerce('hovertext');
    coerce('mode', defaultMode);

    if(subTypes.hasLines(traceOut)) {
        handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce, {backoff: true});
        handleLineShapeDefaults(traceIn, traceOut, coerce);
        coerce('connectgaps');
        coerce('line.simplify');
    }

    if(subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce, {gradient: true});
    }

    if(subTypes.hasText(traceOut)) {
        coerce('texttemplate');
        handleTextDefaults(traceIn, traceOut, layout, coerce);
    }

    var dfltHoverOn = [];

    if(subTypes.hasMarkers(traceOut) || subTypes.hasText(traceOut)) {
        coerce('cliponaxis');
        coerce('marker.maxdisplayed');
        dfltHoverOn.push('points');
    }

    // It's possible for this default to be changed by a later trace.
    // We handle that case in some hacky code inside handleStackDefaults.
    coerce('fill', stackGroupOpts ? stackGroupOpts.fillDflt : 'none');
    if(traceOut.fill !== 'none') {
        handleFillColorDefaults(traceIn, traceOut, defaultColor, coerce);
        if(!subTypes.hasLines(traceOut)) handleLineShapeDefaults(traceIn, traceOut, coerce);
        coercePattern(coerce, 'fillpattern', traceOut.fillcolor, false);
    }

    var lineColor = (traceOut.line || {}).color;
    var markerColor = (traceOut.marker || {}).color;

    if(traceOut.fill === 'tonext' || traceOut.fill === 'toself') {
        dfltHoverOn.push('fills');
    }
    coerce('hoveron', dfltHoverOn.join('+') || 'points');
    if(traceOut.hoveron !== 'fills') coerce('hovertemplate');
    var errorBarsSupplyDefaults = Registry.getComponentMethod('errorbars', 'supplyDefaults');
    errorBarsSupplyDefaults(traceIn, traceOut, lineColor || markerColor || defaultColor, {axis: 'y'});
    errorBarsSupplyDefaults(traceIn, traceOut, lineColor || markerColor || defaultColor, {axis: 'x', inherit: 'y'});

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
};
