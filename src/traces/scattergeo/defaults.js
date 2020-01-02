/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');

var subTypes = require('../scatter/subtypes');
var handleMarkerDefaults = require('../scatter/marker_defaults');
var handleLineDefaults = require('../scatter/line_defaults');
var handleTextDefaults = require('../scatter/text_defaults');
var handleFillColorDefaults = require('../scatter/fillcolor_defaults');

var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var locations = coerce('locations');
    var len;

    if(locations && locations.length) {
        var geojson = coerce('geojson');
        var locationmodeDflt;
        if((typeof geojson === 'string' && geojson !== '') || Lib.isPlainObject(geojson)) {
            locationmodeDflt = 'geojson-id';
        }

        var locationMode = coerce('locationmode', locationmodeDflt);

        if(locationMode === 'geojson-id') {
            coerce('featureidkey');
        }

        len = locations.length;
    } else {
        var lon = coerce('lon') || [];
        var lat = coerce('lat') || [];
        len = Math.min(lon.length, lat.length);
    }

    if(!len) {
        traceOut.visible = false;
        return;
    }

    traceOut._length = len;

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');
    coerce('mode');

    if(subTypes.hasLines(traceOut)) {
        handleLineDefaults(traceIn, traceOut, defaultColor, layout, coerce);
        coerce('connectgaps');
    }

    if(subTypes.hasMarkers(traceOut)) {
        handleMarkerDefaults(traceIn, traceOut, defaultColor, layout, coerce, {gradient: true});
    }

    if(subTypes.hasText(traceOut)) {
        coerce('texttemplate');
        handleTextDefaults(traceIn, traceOut, layout, coerce);
    }

    coerce('fill');
    if(traceOut.fill !== 'none') {
        handleFillColorDefaults(traceIn, traceOut, defaultColor, coerce);
    }

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
};
