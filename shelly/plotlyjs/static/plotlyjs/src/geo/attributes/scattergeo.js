var Plotly = require('../../plotly');

var scatterAttrs = Plotly.Scatter.attributes,
    scatterMarkerAttrs = scatterAttrs.marker,
    scatterLineAttrs = scatterAttrs.line,
    scatterMarkerLineAttrs = scatterMarkerAttrs.line;

var extendFlat = Plotly.Lib.extendFlat;

module.exports = {
    lon: {
        valType: 'data_array',
        description: 'Sets the longitude coordinates (in degrees East).'
    },
    lat: {
        valType: 'data_array',
        description: 'Sets the latitude coordinates (in degrees North).'
    },
    locations: {
        valType: 'data_array',
        description: [
            'Sets the coordinates via location IDs or names.',
            'Coordinates correspond to the centroid of each location given.',
            'See `locationmode` for more info.'
        ].join(' ')
    },
    locationmode: {
        valType: 'enumerated',
        values: ['ISO-3', 'USA-states', 'country names'],
        dflt: 'ISO-3',
        description: [
            'Determines the set of locations used to match entries in `locations`',
            'to regions on the map.'
        ].join(' ')
    },
    mode: extendFlat(scatterAttrs.mode, {dflt: 'markers'}),
    text: scatterAttrs.text,
    line: {
        color: scatterLineAttrs.color,
        width: scatterLineAttrs.width,
        dash: scatterLineAttrs.dash
    },
    marker: {
        symbol: scatterMarkerAttrs.symbol,
        opacity: scatterMarkerAttrs.opacity,
        size: scatterMarkerAttrs.size,
        sizeref: scatterMarkerAttrs.sizeref,
        sizemin: scatterMarkerAttrs.sizemin,
        sizemode: scatterMarkerAttrs.sizemode,
        color: scatterMarkerAttrs.color,
        colorscale: scatterMarkerAttrs.colorscale,
        cauto: scatterMarkerAttrs.cauto,
        cmax: scatterMarkerAttrs.cmax,
        cmin: scatterMarkerAttrs.cmin,
        autocolorscale: scatterMarkerAttrs.autocolorscale,
        reversescale: scatterMarkerAttrs.reversescale,
        showscale: scatterMarkerAttrs.showscale,
        line: {
            color: scatterMarkerLineAttrs.color,
            width: scatterMarkerLineAttrs.width,
            colorscale: scatterMarkerLineAttrs.colorscale,
            cauto: scatterMarkerLineAttrs.cauto,
            cmax: scatterMarkerLineAttrs.cmax,
            cmin: scatterMarkerLineAttrs.cmin,
            autocolorscale: scatterMarkerLineAttrs.autocolorscale,
            reversescale: scatterMarkerLineAttrs.reversescale
        }
    },
    textfont: scatterAttrs.textfont,
    textposition: scatterAttrs.textposition,
    _nestedModules: {
        'marker.colorbar': 'Colorbar'
        // TODO error bars?
    }
};
