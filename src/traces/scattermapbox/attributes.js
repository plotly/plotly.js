/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterGeoAttrs = require('../scattergeo/attributes');
var scatterAttrs = require('../scatter/attributes');
var mapboxAttrs = require('../../plots/mapbox/layout_attributes');
var plotAttrs = require('../../plots/attributes');
var extendFlat = require('../../lib/extend').extendFlat;

var lineAttrs = scatterGeoAttrs.line;
var markerAttrs = scatterGeoAttrs.marker;


module.exports = {
    lon: scatterGeoAttrs.lon,
    lat: scatterGeoAttrs.lat,

    // locations
    // locationmode

    mode: {
        valType: 'flaglist',
        flags: ['lines', 'markers', 'text'],
        dflt: 'markers',
        extras: ['none'],
        role: 'info',
        description: [
            'Determines the drawing mode for this scatter trace.',
            'If the provided `mode` includes *text* then the `text` elements',
            'appear at the coordinates. Otherwise, the `text` elements',
            'appear on hover.'
        ].join(' ')
    },

    text: extendFlat({}, scatterAttrs.text, {
        description: [
            'Sets text elements associated with each (lon,lat) pair',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to the',
            'this trace\'s (lon,lat) coordinates.'
        ].join(' ')
    }),

    line: {
        color: lineAttrs.color,
        width: lineAttrs.width,

        // TODO
        dash: lineAttrs.dash
    },

    connectgaps: scatterAttrs.connectgaps,

    marker: {
        symbol: {
            valType: 'string',
            dflt: 'circle',
            role: 'style',
            arrayOk: true,
            description: [
                'Sets the marker symbol.',
                'Full list: https://www.mapbox.com/maki-icons/',
                'Note that the array `marker.color` and `marker.size`',
                'are only available for *circle* symbols.'
            ].join(' ')
        },
        opacity: extendFlat({}, markerAttrs.opacity, {
            arrayOk: false
        }),
        size: markerAttrs.size,
        sizeref: markerAttrs.sizeref,
        sizemin: markerAttrs.sizemin,
        sizemode: markerAttrs.sizemode,
        color: markerAttrs.color,
        colorscale: markerAttrs.colorscale,
        cauto: markerAttrs.cauto,
        cmax: markerAttrs.cmax,
        cmin: markerAttrs.cmin,
        autocolorscale: markerAttrs.autocolorscale,
        reversescale: markerAttrs.reversescale,
        showscale: markerAttrs.showscale

        // line
    },

    fill: {
        valType: 'enumerated',
        values: ['none', 'toself'],
        dflt: 'none',
        role: 'style',
        description: [
            'Sets the area to fill with a solid color.',
            'Use with `fillcolor` if not *none*.',
            '*toself* connects the endpoints of the trace (or each segment',
            'of the trace if it has gaps) into a closed shape.'
        ].join(' ')
    },
    fillcolor: scatterAttrs.fillcolor,

    textfont: mapboxAttrs.layers.symbol.textfont,
    textposition: mapboxAttrs.layers.symbol.textposition,

    hoverinfo: extendFlat({}, plotAttrs.hoverinfo, {
        flags: ['lon', 'lat', 'text', 'name']
    }),

    _nestedModules: {
        'marker.colorbar': 'Colorbar'
    }
};
