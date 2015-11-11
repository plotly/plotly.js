'use strict';

var Plotly = require('../../plotly');
var Choropleth = require('./choropleth');

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
