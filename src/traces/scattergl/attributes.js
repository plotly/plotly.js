/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterAttrs = require('../scatter/attributes');
var DASHES = require('../../constants/gl2d_dashes');
var MARKERS = require('../../constants/gl_markers');
var extendFlat = require('../../lib/extend').extendFlat;

var scatterLineAttrs = scatterAttrs.line,
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
            values: Object.keys(DASHES),
            dflt: 'solid',
            role: 'style',
            description: 'Sets the style of the lines.'
        }
    },
    marker: {
        color: scatterMarkerAttrs.color,
        symbol: {
            valType: 'enumerated',
            values: Object.keys(MARKERS),
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
    connectgaps: scatterAttrs.connectgaps,
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
