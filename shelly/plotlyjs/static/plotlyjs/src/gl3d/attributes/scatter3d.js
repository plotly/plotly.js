'use strict';

var Plotly = require('../../plotly');
var MARKER_SYMBOLS = require('../lib/markers.json');

var scatterAttrs = Plotly.Scatter.attributes,
    scatterLineAttrs = scatterAttrs.line,
    scatterMarkerAttrs = scatterAttrs.marker,
    scatterMarkerLineAttrs = scatterMarkerAttrs.line,
    extendFlat = Plotly.Lib.extendFlat;

function makeProjectionAttr(axLetter) {
    return {
        show: {
            type: 'boolean',
            dflt: false,
            description: [
                'Sets whether or not projections are shown along the',
                axLetter, 'axis.'
            ].join(' ')
        },
        opacity: {
            type: 'number',
            min: 0,
            max: 1,
            dflt: 1,
            description: 'Sets the projection color.'
        },
        scale: {
            type: 'number',
            min: 0,
            max: 10,
            dflt: 2/3,
            description: [
                'Sets the scale factor determining the size of the',
                'projection marker points.'
            ].join(' ')
        }
    };
}

module.exports = {
    x: {
        type: 'data_array',
        description: 'Sets the x coordinates.'
    },
    y: {
        type: 'data_array',
        description: 'Sets the y coordinates.'
    },
    z: {
        type: 'data_array',
        description: 'Sets the z coordinates.'
    },
    text: {
        type: 'data_array',
        description: 'Sets text elements associated with each (x,y,z) triplet.'
    },
    mode: extendFlat(scatterAttrs.mode,  // shouldn't this be on-par with 2D?
        {dflt: 'lines+markers'}),
    surfaceaxis: {
        type: 'enumerated',
        values: [-1, 0, 1, 2],
        dflt: -1,
        description: [
            'If 0, the '
        ].join(' ')
    },
    surfacecolor: {
        type: 'color'
    },
    projection: {
        x: makeProjectionAttr('x'),
        y: makeProjectionAttr('y'),
        z: makeProjectionAttr('z')
    },
    line: {
        color: scatterLineAttrs.color,
        width: scatterLineAttrs.width,
        dash: scatterLineAttrs.dash
    },
    marker: {  // Parity with scatter.js?
        color: scatterMarkerAttrs.color,
        symbol: {
            type: 'enumerated',
            values: Object.keys(MARKER_SYMBOLS),
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
        'error_z': 'ErrorBars',
        'marker.colorbar': 'Colorbar'
    }
};
