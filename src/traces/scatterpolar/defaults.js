'use strict';

var Lib = require('../../lib');

var subTypes = require('../scatter/subtypes');
var handleMarkerDefaults = require('../scatter/marker_defaults');
var handleLineDefaults = require('../scatter/line_defaults');
var handleLineShapeDefaults = require('../scatter/line_shape_defaults');
var handleTextDefaults = require('../scatter/text_defaults');
var handleFillColorDefaults = require('../scatter/fillcolor_defaults');
var PTS_LINESONLY = require('../scatter/constants').PTS_LINESONLY;

var attributes = require('./attributes');

function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleRThetaDefaults(traceIn, traceOut, layout, coerce);
    if (!len) {
        traceOut.visible = false;
        return;
    }

    coerce('thetaunit');
    coerce('mode', len < PTS_LINESONLY ? 'lines+markers' : 'lines');
    coerce('text');
    coerce('hovertext');
    if (traceOut.hoveron !== 'fills') {
        coerce('hovertemplate');
        coerce('hovertemplatefallback');
    }

    if (subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce, { gradient: true });
    }

    if (subTypes.hasLines(traceOut)) {
        handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce, { backoff: true });
        handleLineShapeDefaults(traceIn, traceOut, coerce);
        coerce('connectgaps');
    }

    if (subTypes.hasText(traceOut)) {
        coerce('texttemplate');
        coerce('texttemplatefallback');
        handleTextDefaults(traceIn, traceOut, layout, coerce);
    }

    var dfltHoverOn = [];

    if (subTypes.hasMarkers(traceOut) || subTypes.hasText(traceOut)) {
        coerce('cliponaxis');
        coerce('marker.maxdisplayed');
        dfltHoverOn.push('points');
    }

    coerce('fill');

    if (traceOut.fill !== 'none') {
        handleFillColorDefaults(traceIn, traceOut, defaultColor, coerce);
        if (!subTypes.hasLines(traceOut)) handleLineShapeDefaults(traceIn, traceOut, coerce);
    }

    if (traceOut.fill === 'tonext' || traceOut.fill === 'toself') {
        dfltHoverOn.push('fills');
    }
    coerce('hoveron', dfltHoverOn.join('+') || 'points');

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
}

function handleRThetaDefaults(traceIn, traceOut, layout, coerce) {
    var r = coerce('r');
    var theta = coerce('theta');

    // TODO: handle this case outside supply defaults step
    if (Lib.isTypedArray(r)) {
        traceOut.r = r = Array.from(r);
    }
    if (Lib.isTypedArray(theta)) {
        traceOut.theta = theta = Array.from(theta);
    }

    var len;

    if (r) {
        if (theta) {
            len = Math.min(r.length, theta.length);
        } else {
            len = r.length;
            coerce('theta0');
            coerce('dtheta');
        }
    } else {
        if (!theta) return 0;
        len = traceOut.theta.length;
        coerce('r0');
        coerce('dr');
    }

    traceOut._length = len;
    return len;
}

module.exports = {
    handleRThetaDefaults: handleRThetaDefaults,
    supplyDefaults: supplyDefaults
};
