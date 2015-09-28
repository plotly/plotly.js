'use strict';

var Plotly = require('../../plotly');

var scatterAttrs = Plotly.Scatter.attributes,
    scatterLineAttrs = scatterAttrs.line,
    scatterMarkerAttrs = scatterAttrs.marker,
    scatterMarkerLineAttrs = scatterMarkerAttrs.line,
    extendFlat = Plotly.Lib.extendFlat;

module.exports = {
    x: {
        type: 'data_array',
        description: 'Sets the x coordinates.'
    },
    y: {
        type: 'data_array',
        description: 'Sets the y coordinates.'
    },
    text: {
        type: 'data_array',
        description: 'Sets text elements associated with each (x,y,z) triplet.'
    },
    mode: extendFlat(scatterAttrs.mode,
        {dflt: 'lines+markers'}),
    line: {
        color: scatterLineAttrs.color,
        width: scatterLineAttrs.width,
        dash: scatterLineAttrs.dash
    },
    marker: {
        color: scatterMarkerAttrs.color,
        symbol: {
            type: 'enumerated',
            values: [ 'circle' ],
            dflt: 'circle',
            arrayOk: true,
            description: 'Sets the marker symbol type.'
        },
        size: extendFlat(scatterMarkerAttrs.size, {dflt: 8}),
        sizeref: scatterMarkerAttrs.sizeref,
        sizemin: scatterMarkerAttrs.sizemin,
        sizemode: scatterMarkerAttrs.sizemode,
        opacity: scatterMarkerAttrs.opacity,
        colorscale: scatterMarkerAttrs.colorscale,
        cauto: scatterMarkerAttrs.cauto,
        cmax: scatterMarkerAttrs.cmax,
        cmin: scatterMarkerAttrs.cmin,
        autocolorscale: scatterMarkerAttrs.autocolorscale,
        reversescale: scatterMarkerAttrs.reversescale,
        showscale: scatterMarkerAttrs.showscale,
        line: {
            color: scatterMarkerLineAttrs.color,
            width: extendFlat(scatterMarkerLineAttrs.width, {arrayOk: false}),
            colorscale: scatterMarkerLineAttrs.colorscale,
            cauto: scatterMarkerLineAttrs.cauto,
            cmax: scatterMarkerLineAttrs.cmax,
            cmin: scatterMarkerLineAttrs.cmin,
            autocolorscale: scatterMarkerLineAttrs.autocolorscale,
            reversescale: scatterMarkerLineAttrs.reversescale
        }
    },
    textposition: extendFlat(scatterAttrs.textposition, {dflt: 'top center'}),
    textfont: scatterAttrs.textfont,
    _nestedModules: {
        'error_x': 'ErrorBars',
        'error_y': 'ErrorBars',
        'marker.colorbar': 'Colorbar'
    }
};
