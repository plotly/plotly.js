/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../../lib');
var colorscaleDefaults = require('../../components/colorscale/defaults');
var attributes = require('./attributes');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    function coerce(attr, dflt) {
        return Lib.coerce(traceIn, traceOut, attributes, attr, dflt);
    }

    var locations = coerce('locations');
    var z = coerce('z');

    if(!(locations && locations.length && Lib.isArrayOrTypedArray(z) && z.length)) {
        traceOut.visible = false;
        return;
    }

    traceOut._length = Math.min(locations.length, z.length);

    var geojson = coerce('geojson');

    var locationmodeDflt;
    if((typeof geojson === 'string' && geojson !== '') || Lib.isPlainObject(geojson)) {
        locationmodeDflt = 'geojson-id';
    }

    var locationMode = coerce('locationmode', locationmodeDflt);

    if(locationMode === 'geojson-id') {
        coerce('featureidkey');
    }

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');

    var mlw = coerce('marker.line.width');
    if(mlw) coerce('marker.line.color');
    coerce('marker.opacity');

    colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'z'});

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
};
