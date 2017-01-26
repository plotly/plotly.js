/**
* Copyright 2012-2017, Plotly, Inc.
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

    var len;
    if(locations) len = locations.length;

    if(!locations || !len) {
        traceOut.visible = false;
        return;
    }

    var z = coerce('z');
    if(!Array.isArray(z)) {
        traceOut.visible = false;
        return;
    }

    if(z.length > len) traceOut.z = z.slice(0, len);

    coerce('locationmode');

    coerce('text');

    coerce('marker.line.color');
    coerce('marker.line.width');

    colorscaleDefaults(
        traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'z'}
    );

    coerce('hoverinfo', (layout._dataLength === 1) ? 'location+z+text' : undefined);
};
