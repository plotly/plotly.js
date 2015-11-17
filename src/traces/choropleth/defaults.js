/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var Choropleth = require('./');

module.exports = function supplyDefaults(traceIn, traceOut, defaultColor, layout) {
    var locations, len, z;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, Choropleth.attributes, attr, dflt);
    }

    locations = coerce('locations');
    if(locations) len = locations.length;
    if(!locations || !len) {
        traceOut.visible = false;
        return;
    }

    z = coerce('z');
    if(!Array.isArray(z)) {
        traceOut.visible = false;
        return;
    }

    if(z.length > len) traceOut.z = z.slice(0, len);

    coerce('locationmode');

    coerce('text');

    coerce('marker.line.color');
    coerce('marker.line.width');

    Plotly.Colorscale.handleDefaults(
        traceIn, traceOut, layout, coerce, {prefix: '', cLetter: 'z'}
    );

    coerce('hoverinfo', (layout._dataLength === 1) ? 'location+z+text' : undefined);
};
