var Plotly = require('../../plotly');

var ScatterGeoAttrs = Plotly.ScatterGeo.attributes,
    ScatterGeoMarkerLineAttrs = ScatterGeoAttrs.marker.line,
    traceColorbarAttrs = Plotly.Colorbar.traceColorbarAttributes;

var extendFlat = Plotly.Lib.extendFlat;

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
    _nestedModules: {
        'colorbar': 'Colorbar'
    }
};
