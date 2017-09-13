/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var ScatterGeoAttrs = require('../scattergeo/attributes');
var colorscaleAttrs = require('../../components/colorscale/attributes');
var colorbarAttrs = require('../../components/colorbar/attributes');
var plotAttrs = require('../../plots/attributes');

var extend = require('../../lib/extend');
var extendFlat = extend.extendFlat;
var extendDeep = extend.extendDeep;

var ScatterGeoMarkerLineAttrs = ScatterGeoAttrs.marker.line;

module.exports = extendFlat({
    locations: {
        valType: 'data_array',
        editType: 'docalc',
        description: [
            'Sets the coordinates via location IDs or names.',
            'See `locationmode` for more info.'
        ].join(' ')
    },
    locationmode: ScatterGeoAttrs.locationmode,
    z: {
        valType: 'data_array',
        editType: 'docalc',
        description: 'Sets the color values.'
    },
    text: {
        valType: 'data_array',
        editType: 'docalc',
        description: 'Sets the text elements associated with each location.'
    },
    marker: {
        line: {
            color: ScatterGeoMarkerLineAttrs.color,
            width: extendFlat({}, ScatterGeoMarkerLineAttrs.width, {dflt: 1}),
            editType: 'docalc'
        },
        editType: 'docalc'
    },
    hoverinfo: extendFlat({}, plotAttrs.hoverinfo, {
        editType: 'docalc',
        flags: ['location', 'z', 'text', 'name']
    }),
},
    extendDeep({}, colorscaleAttrs, {
        zmax: {editType: 'docalc'},
        zmin: {editType: 'docalc'}
    }),
    { colorbar: colorbarAttrs }
);
