/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterAttrs = require('../scatter/attributes');
var plotAttrs = require('../../plots/attributes');
var colorAttributes = require('../../components/colorscale/color_attributes');

var extendFlat = require('../../lib/extend').extendFlat;

var scatterMarkerAttrs = scatterAttrs.marker,
    scatterLineAttrs = scatterAttrs.line,
    scatterMarkerLineAttrs = scatterMarkerAttrs.line;

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
        role: 'info',
        dflt: 'ISO-3',
        description: [
            'Determines the set of locations used to match entries in `locations`',
            'to regions on the map.'
        ].join(' ')
    },
    mode: extendFlat({}, scatterAttrs.mode, {dflt: 'markers'}),
    text: extendFlat({}, scatterAttrs.text, {
        description: [
            'Sets text elements associated with each (lon,lat) pair',
            'or item in `locations`.',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to the',
            'this trace\'s (lon,lat) or `locations` coordinates.'
        ].join(' ')
    }),
    line: {
        color: scatterLineAttrs.color,
        width: scatterLineAttrs.width,
        dash: scatterLineAttrs.dash
    },
    marker: extendFlat({}, {
        symbol: scatterMarkerAttrs.symbol,
        opacity: scatterMarkerAttrs.opacity,
        size: scatterMarkerAttrs.size,
        sizeref: scatterMarkerAttrs.sizeref,
        sizemin: scatterMarkerAttrs.sizemin,
        sizemode: scatterMarkerAttrs.sizemode,
        showscale: scatterMarkerAttrs.showscale,
        line: extendFlat({},
            {width: scatterMarkerLineAttrs.width},
            colorAttributes('marker.line')
        )
    },
        colorAttributes('marker')
    ),
    textfont: scatterAttrs.textfont,
    textposition: scatterAttrs.textposition,
    hoverinfo: extendFlat({}, plotAttrs.hoverinfo, {
        flags: ['lon', 'lat', 'location', 'text', 'name']
    }),
    _nestedModules: {
        'marker.colorbar': 'Colorbar'
    }
};
