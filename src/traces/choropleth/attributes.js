/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var scatterGeoAttrs = require('../scattergeo/attributes');
var colorscaleAttrs = require('../../components/colorscale/attributes');
var colorbarAttrs = require('../../components/colorbar/attributes');
var plotAttrs = require('../../plots/attributes');

var extendFlat = require('../../lib/extend').extendFlat;

var scatterGeoMarkerLineAttrs = scatterGeoAttrs.marker.line;

module.exports = extendFlat({
    locations: {
        valType: 'data_array',
        editType: 'calc',
        description: [
            'Sets the coordinates via location IDs or names.',
            'See `locationmode` for more info.'
        ].join(' ')
    },
    locationmode: scatterGeoAttrs.locationmode,
    z: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the color values.'
    },
    text: extendFlat({}, scatterGeoAttrs.text, {
        description: 'Sets the text elements associated with each location.'
    }),
    marker: {
        line: {
            color: scatterGeoMarkerLineAttrs.color,
            width: extendFlat({}, scatterGeoMarkerLineAttrs.width, {dflt: 1}),
            editType: 'calc'
        },
        opacity: {
            valType: 'number',
            arrayOk: true,
            min: 0,
            max: 1,
            dflt: 1,
            role: 'style',
            editType: 'style',
            description: 'Sets the opacity of the locations.'
        },
        editType: 'calc'
    },

    selected: {
        marker: {
            opacity: scatterGeoAttrs.selected.marker.opacity,
            editType: 'plot'
        },
        editType: 'plot'
    },
    unselected: {
        marker: {
            opacity: scatterGeoAttrs.unselected.marker.opacity,
            editType: 'plot'
        },
        editType: 'plot'
    },

    hoverinfo: extendFlat({}, plotAttrs.hoverinfo, {
        editType: 'calc',
        flags: ['location', 'z', 'text', 'name']
    })
},

    colorscaleAttrs('', {
        cLetter: 'z',
        editTypeOverride: 'calc'
    }),
    {colorbar: colorbarAttrs}
);
