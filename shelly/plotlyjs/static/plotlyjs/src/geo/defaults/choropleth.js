'use strict';

var Plotly = require('../../plotly');

var Choropleth = module.exports = {};

Plotly.Plots.register(Choropleth, 'choropleth', ['geo', 'noOpacity']);

var ScatterGeoAttrs = Plotly.ScatterGeo.attributes,
    ScatterGeoMarkerLineAttrs = ScatterGeoAttrs.marker.line,
    traceColorbarAttrs = Plotly.Colorbar.traceColorbarAttributes;

Choropleth.attributes = {
    locations: {type: 'data_array'},
    locationmode: ScatterGeoAttrs.locationmode,
    z: {type: 'data_array'},
    text: {type: 'data_array'},
    marker: {
        line: {
            color: ScatterGeoMarkerLineAttrs.color,
            width: ScatterGeoMarkerLineAttrs.width
        }
    },
    zauto: traceColorbarAttrs.zauto,
    zmin: traceColorbarAttrs.zmin,
    zmax: traceColorbarAttrs.zmax,
    colorscale: traceColorbarAttrs.colorscale,
    autocolorscale: {
        type: 'boolean',
        dflt: true
    },
    reversescale: traceColorbarAttrs.reversescale,
    showscale: traceColorbarAttrs.showscale,
    _nestedModules: {
        'colorbar': 'Colorbar'
    }
};

Choropleth.supplyDefaults = function(traceIn, traceOut, defaultColor, layout) {
    var locations, len, z;

    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut,
                                 Choropleth.attributes, attr, dflt);
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
};

Choropleth.colorbar = Plotly.Colorbar.traceColorbar;

Choropleth.calc = function(gd, trace) {

    Plotly.Colorscale.calc(trace, trace.z, '', 'z');

};
