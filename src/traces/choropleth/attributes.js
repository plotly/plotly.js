var ScatterGeoAttrs = require('../scattergeo/attributes');
var traceColorbarAttrs = require('../../components/colorbar/trace_attributes');
var plotAttrs = require('../../plots/plots/attributes');
var extendFlat = require('../../lib/extend').extendFlat;

var ScatterGeoMarkerLineAttrs = ScatterGeoAttrs.marker.line;

module.exports = {
    locations: {
        valType: 'data_array',
        description: [
            'Sets the coordinates via location IDs or names.',
            'See `locationmode` for more info.'
        ].join(' ')
    },
    locationmode: ScatterGeoAttrs.locationmode,
    z: {
        valType: 'data_array',
        description: 'Sets the color values.'
    },
    text: {
        valType: 'data_array',
        description: 'Sets the text elements associated with each location.'
    },
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
    autocolorscale: traceColorbarAttrs.autocolorscale,
    reversescale: traceColorbarAttrs.reversescale,
    showscale: traceColorbarAttrs.showscale,
    hoverinfo: extendFlat({}, plotAttrs.hoverinfo, {
        flags: ['location', 'z', 'text', 'name']
    }),
    _nestedModules: {
        'colorbar': 'Colorbar'
    }
};
