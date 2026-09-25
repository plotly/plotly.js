'use strict';

const Lib = require('../../lib');

const subTypes = require('../scatter/subtypes');
const handleMarkerDefaults = require('../scatter/marker_defaults');
const handleLineDefaults = require('../scatter/line_defaults');
const handleTextDefaults = require('../scatter/text_defaults');
const handleFillColorDefaults = require('../scatter/fillcolor_defaults');
const helpers = require('../scattergl/helpers');
const PTS_LINESONLY = require('../scatter/constants').PTS_LINESONLY;


const attributes = require('./attributes').default;

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var isOpen = traceIn.marker ? helpers.isOpenSymbol(traceIn.marker.symbol) : false;
    const isBubble = subTypes.isBubble(traceIn);

    const a = coerce('a');
    const b = coerce('b');
    const c = coerce('c');

    const componentCount = Number(!!a) + Number(!!b) + Number(!!c);

    // allow any one array to be missing
    const len = componentCount < 2
        ? 0
        : Math.min(
            a?.length ?? Infinity,
            b?.length ?? Infinity,
            c?.length ?? Infinity
        );

    if (!len) {
        traceOut.visible = false;
        return;
    }

    traceOut._length = len;

    coerce('sum');

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('hovertemplatefallback');

    coerce('mode', len < PTS_LINESONLY ? 'lines+markers' : 'lines');

    if (subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce, {
            noAngleRef: true,
            noLineDash: true,
            noStandOff: true
        });
        coerce('marker.line.width', isOpen || isBubble ? 1 : 0);
    }

    if (subTypes.hasLines(traceOut)) {
        handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce);
        coerce('connectgaps');
    }

    if (subTypes.hasText(traceOut)) {
        coerce('texttemplate');
        coerce('texttemplatefallback');
        handleTextDefaults(traceIn, traceOut, layout, coerce, {
            noFontShadow: true,
            noFontLineposition: true,
            noFontTextcase: true
        });
    }

    // no cliponaxis

    coerce('fill');
    if (traceOut.fill !== 'none') {
        handleFillColorDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    // no hoveron

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
};
