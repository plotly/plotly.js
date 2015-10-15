'use strict';

var Plotly = require('../../plotly'),
    extendFlat = Plotly.Lib.extendFlat;

var scatterAttrs = Plotly.Scatter.attributes,
    scatterLineAttrs = scatterAttrs.line,
    scatterMarkerAttrs = scatterAttrs.marker,
    scatterMarkerLineAttrs = scatterMarkerAttrs.line;

module.exports = {
    x: scatterAttrs.x,
    x0: scatterAttrs.x0,
    dx: scatterAttrs.dx,
    y: scatterAttrs.y,
    y0: scatterAttrs.y0,
    dy: scatterAttrs.dy,
    text: extendFlat({}, scatterAttrs.text, {
        description: [
            'Sets text elements associated with each (x,y) pair to appear on hover.',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to the',
            'this trace\'s (x,y) coordinates.'
        ].join(' ')
    }),
    mode: {
        valType: 'flaglist',
        flags: ['lines', 'markers'],
        extras: ['none'],
        role: 'info',
        description: [
            'Determines the drawing mode for this scatter trace.'
        ].join(' ')
    },
    line: {
        color: scatterLineAttrs.color,
        width: scatterLineAttrs.width,
        dash: {
            valType: 'enumerated',
            values: Object.keys(require('../lib/dashes.json')),
            dftl: 'solid',
            role: 'style',
            description: 'Sets the style of the lines.'
        }
    },
    marker: {
        color: scatterMarkerAttrs.color,
        symbol: {
            valType: 'enumerated',
            values: Object.keys(require('../../gl3d/lib/markers.json')),
            dflt: 'circle',
            arrayOk: true,
            role: 'style',
            description: 'Sets the marker symbol type.'
        },
        size: scatterMarkerAttrs.size,
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
            width: scatterMarkerLineAttrs.width,
            colorscale: scatterMarkerLineAttrs.colorscale,
            cauto: scatterMarkerLineAttrs.cauto,
            cmax: scatterMarkerLineAttrs.cmax,
            cmin: scatterMarkerLineAttrs.cmin,
            autocolorscale: scatterMarkerLineAttrs.autocolorscale,
            reversescale: scatterMarkerLineAttrs.reversescale
        }
    },
    fill: extendFlat({}, scatterAttrs.fill, {
        values: ['none', 'tozeroy', 'tozerox']
    }),
    fillcolor: scatterAttrs.fillcolor,
    _nestedModules: {
        'error_x': 'ErrorBars',
        'error_y': 'ErrorBars',
        'marker.colorbar': 'Colorbar'
    }
};
