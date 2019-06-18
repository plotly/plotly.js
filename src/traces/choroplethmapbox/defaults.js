/**
* Copyright 2012-2019, Plotly, Inc.
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

    // TODO locations should now allow numbers !!
    // update that for `choropleth` too !!

    var locations = coerce('locations');
    var z = coerce('z');
    var geojson = coerce('geojson');

    if(!locations || !locations.length ||
        !Lib.isArrayOrTypedArray(z) || !z.length ||
        !((typeof geojson === 'string' && geojson !== '') || Lib.isPlainObject(geojson))
    ) {
        traceOut.visible = false;
        return;
    }

    traceOut._length = Math.min(locations.length, z.length);

    // TODO
    // coerce('below');

    coerce('text');
    coerce('hovertext');
    coerce('hovertemplate');

    coerce('marker.line.color');
    coerce('marker.line.width');
    coerce('marker.opacity');

    colorscaleDefaults(traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'z'});

    Lib.coerceSelectionMarkerOpacity(traceOut, coerce);
};
