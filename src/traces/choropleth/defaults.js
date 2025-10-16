'use strict';

var Lib = require('../../lib');
var colorscaleDefaults = require('../../components/colorscale/defaults');
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
    var z = coerce('z');

    if (!(locations && locations.length && Lib.isArrayOrTypedArray(z) && z.length)) {
        traceOut.visible = false;
        return;
    }

    traceOut._length = Math.min(locations.length, z.length);

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

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('hovertemplatefallback');

    var mlw = coerce('marker.line.width');
    if (mlw) coerce('marker.line.color');
    coerce('marker.opacity');

    colorscaleDefaults(traceIn, traceOut, layout, coerce, { prefix: '', cLetter: 'z' });

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
};
