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
var extendDeepAll = extend.extendDeepAll;

var ScatterGeoMarkerLineAttrs = ScatterGeoAttrs.marker.line;

module.exports = extendFlat({
    locations: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the coordinates via location IDs or names.',
            'See `locationmode` for more info.'
        ].join(' ')
    },
    locationmode: ScatterGeoAttrs.locationmode,
    z: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the color values.'
    },
    text: extendFlat({}, ScatterGeoAttrs.text, {
        description: 'Sets the text elements associated with each location.'
    }),
    marker: {
        line: {
            color: ScatterGeoMarkerLineAttrs.color,
            width: extendFlat({}, ScatterGeoMarkerLineAttrs.width, {dflt: 1}),
            editType: 'calc'
        },
        editType: 'calc'
    },
    hoverinfo: extendFlat({}, plotAttrs.hoverinfo, {
        editType: 'calc',
        flags: ['location', 'z', 'text', 'name']
    }),
},
    extendDeepAll({}, colorscaleAttrs, {
        zmax: {editType: 'calc'},
        zmin: {editType: 'calc'}
    }),
    { colorbar: colorbarAttrs }
);
