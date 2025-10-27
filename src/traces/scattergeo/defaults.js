'use strict';

var Lib = require('../../lib');

var subTypes = require('../scatter/subtypes');
var handleMarkerDefaults = require('../scatter/marker_defaults');
var handleLineDefaults = require('../scatter/line_defaults');
var handleTextDefaults = require('../scatter/text_defaults');
var handleFillColorDefaults = require('../scatter/fillcolor_defaults');

var attributes = require('./attributes');

const locationmodeBreakingChangeWarning = [
    'The library used by the *country names* `locationmode` option is changing in the next major version.',
    'Some country names in existing plots may not work in the new version.',
    'To ensure consistent behavior, consider setting `locationmode` to *ISO-3*.'
].join(' ');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var locations = coerce('locations');
    var len;

    if (locations && locations.length) {
        var geojson = coerce('geojson');
        var locationmodeDflt;
        if ((typeof geojson === 'string' && geojson !== '') || Lib.isPlainObject(geojson)) {
            locationmodeDflt = 'geojson-id';
        }

        var locationMode = coerce('locationmode', locationmodeDflt);

        if (locationMode === 'country names') {
            Lib.warn(locationmodeBreakingChangeWarning);
        }

        if (locationMode === 'geojson-id') {
            coerce('featureidkey');
        }

        len = locations.length;
    } else {
        var lon = coerce('lon') || [];
        var lat = coerce('lat') || [];
        len = Math.min(lon.length, lat.length);
    }

    if (!len) {
        traceOut.visible = false;
        return;
    }

    traceOut._length = len;

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('hovertemplatefallback');
    coerce('mode');

    if (subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce, { gradient: true });
    }

    if (subTypes.hasLines(traceOut)) {
        handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce);
        coerce('connectgaps');
    }

    if (subTypes.hasText(traceOut)) {
        coerce('texttemplate');
        coerce('texttemplatefallback');
        handleTextDefaults(traceIn, traceOut, layout, coerce);
    }

    coerce('fill');
    if (traceOut.fill !== 'none') {
        handleFillColorDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
};
