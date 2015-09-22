var Plotly = require('../../plotly');

var ScatterGeoAttrs = Plotly.ScatterGeo.attributes,
    ScatterGeoMarkerLineAttrs = ScatterGeoAttrs.marker.line,
    traceColorbarAttrs = Plotly.Colorbar.traceColorbarAttributes;

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
    hoverinfo: Plotly.Lib.extendFlat(Plotly.Plots.attributes.hoverinfo, {
        flags: ['location', 'z', 'text', 'name']
    }),
    _nestedModules: {
        'colorbar': 'Colorbar'
    }
};
