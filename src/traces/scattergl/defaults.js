'use strict';

var Lib = require('../../lib');
var Registry = require('../../registry');

var helpers = require('./helpers');
var attributes = require('./attributes');
var constants = require('../scatter/constants');
var subTypes = require('../scatter/subtypes');
var handleXYDefaults = require('../scatter/xy_defaults');
var handlePeriodDefaults = require('../scatter/period_defaults');
var handleMarkerDefaults = require('../scatter/marker_defaults');
var handleLineDefaults = require('../scatter/line_defaults');
var handleFillColorDefaults = require('../scatter/fillcolor_defaults');
var handleTextDefaults = require('../scatter/text_defaults');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var isOpen = traceIn.marker ? helpers.isOpenSymbol(traceIn.marker.symbol) : false;
    var isBubble = subTypes.isBubble(traceIn);

    var len = handleXYDefaults(traceIn, traceOut, layout, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    handlePeriodDefaults(traceIn, traceOut, layout, coerce);
    coerce('xhoverformat');
    coerce('yhoverformat');

    var defaultMode = len < constants.PTS_LINESONLY ? 'lines+markers' : 'lines';

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('mode', defaultMode);

    if(subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce, {noAngleRef: true, noStandOff: true});
        coerce('marker.line.width', isOpen || isBubble ? 1 : 0);
    }

    if(subTypes.hasLines(traceOut)) {
        coerce('connectgaps');
        handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce);
        coerce('line.shape');
    }

    if(subTypes.hasText(traceOut)) {
        coerce('texttemplate');
        handleTextDefaults(traceIn, traceOut, layout, coerce, {
            noFontShadow: true,
            noFontLineposition: true,
            noFontTextcase: true,
        });
    }

    var lineColor = (traceOut.line || {}).color;
    var markerColor = (traceOut.marker || {}).color;

    coerce('fill');
    if(traceOut.fill !== 'none') {
        handleFillColorDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    var errorBarsSupplyDefaults = Registry.getComponentMethod('errorbars', 'supplyDefaults');
    errorBarsSupplyDefaults(traceIn, traceOut, lineColor || markerColor || defaultColor, {axis: 'y'});
    errorBarsSupplyDefaults(traceIn, traceOut, lineColor || markerColor || defaultColor, {axis: 'x', inherit: 'y'});

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
};
