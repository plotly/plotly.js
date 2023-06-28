'use strict';

var Lib = require('../../lib');

var subTypes = require('../scatter/subtypes');
var handleMarkerDefaults = require('../scatter/marker_defaults');
var handleLineDefaults = require('../scatter/line_defaults');
var handleTextDefaults = require('../scatter/text_defaults');
var handleFillColorDefaults = require('../scatter/fillcolor_defaults');
var attributes = require('./attributes');

// Must use one of the following fonts as the family, else default to 'Open Sans Regular'
// See https://github.com/openmaptiles/fonts/blob/gh-pages/fontstacks.json
var supportedFonts = [
    'Metropolis Black Italic',
    'Metropolis Black',
    'Metropolis Bold Italic',
    'Metropolis Bold',
    'Metropolis Extra Bold Italic',
    'Metropolis Extra Bold',
    'Metropolis Extra Light Italic',
    'Metropolis Extra Light',
    'Metropolis Light Italic',
    'Metropolis Light',
    'Metropolis Medium Italic',
    'Metropolis Medium',
    'Metropolis Regular Italic',
    'Metropolis Regular',
    'Metropolis Semi Bold Italic',
    'Metropolis Semi Bold',
    'Metropolis Thin Italic',
    'Metropolis Thin',
    'Open Sans Bold Italic',
    'Open Sans Bold',
    'Open Sans Extra Bold Italic',
    'Open Sans Extra Bold',
    'Open Sans Italic',
    'Open Sans Light Italic',
    'Open Sans Light',
    'Open Sans Regular',
    'Open Sans Semibold Italic',
    'Open Sans Semibold',
    'Klokantech Noto Sans Bold',
    'Klokantech Noto Sans CJK Bold',
    'Klokantech Noto Sans CJK Regular',
    'Klokantech Noto Sans Italic',
    'Klokantech Noto Sans Regular'
];

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    function coerce2(attr, dflt) {
        return Lib.coerce2(traceIn, traceOut, attributes, attr, dflt);
    }

    var len = handleLonLatDefaults(traceIn, traceOut, coerce);
    if(!len) {
        traceOut.visible = false;
        return;
    }

    coerce('text');
    coerce('texttemplate');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('mode');
    coerce('below');

    if(subTypes.hasLines(traceOut)) {
        handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce, {noDash: true});
        coerce('connectgaps');
    }

    if(subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce, {noLine: true, noAngle: true});

        coerce('marker.allowoverlap');
        coerce('marker.angle');

        // array marker.size and marker.color are only supported with circles
        var marker = traceOut.marker;
        if(marker.symbol !== 'circle') {
            if(Lib.isArrayOrTypedArray(marker.size)) marker.size = marker.size[0];
            if(Lib.isArrayOrTypedArray(marker.color)) marker.color = marker.color[0];
        }
    }

    var clusterMaxzoom = coerce2('cluster.maxzoom');
    var clusterStep = coerce2('cluster.step');
    var clusterColor = coerce2('cluster.color', (traceOut.marker && traceOut.marker.color) || defaultColor);
    var clusterSize = coerce2('cluster.size');
    var clusterOpacity = coerce2('cluster.opacity');

    var clusterEnabledDflt =
        clusterMaxzoom !== false ||
        clusterStep !== false ||
        clusterColor !== false ||
        clusterSize !== false ||
        clusterOpacity !== false;

    coerce('cluster.enabled', clusterEnabledDflt);

    if(subTypes.hasText(traceOut)) {
        handleTextDefaults(traceIn, traceOut, layout, coerce,
            {noSelect: true,
                font: {
                    family: supportedFonts.indexOf(layout.font.family) !== -1 ? layout.font.family : 'Open Sans Regular',
                    size: layout.font.size,
                    color: layout.font.color
                }
            });
    }

    coerce('fill');
    if(traceOut.fill !== 'none') {
        handleFillColorDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
};

function handleLonLatDefaults(traceIn, traceOut, coerce) {
    var lon = coerce('lon') || [];
    var lat = coerce('lat') || [];
    var len = Math.min(lon.length, lat.length);
    traceOut._length = len;

    return len;
}
