/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var scatterGeoAttrs = require('../scattergeo/attributes');
var colorScaleAttrs = require('../../components/colorscale/attributes');
var baseAttrs = require('../../plots/attributes');
var defaultLine = require('../../components/color/attributes').defaultLine;

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
    geojson: extendFlat({}, scatterGeoAttrs.geojson, {
        description: [
            'Sets optional GeoJSON data associated with this trace.',
            'If not given, the features on the base map are used.',

            'It can be set as a valid GeoJSON object or as a URL string.',
            'Note that we only accept GeoJSONs of type *FeatureCollection* or *Feature*',
            'with geometries of type *Polygon* or *MultiPolygon*.'

            // TODO add topojson support with additional 'topojsonobject' attr?
            // https://github.com/topojson/topojson-specification/blob/master/README.md
        ].join(' ')
    }),
    featureidkey: scatterGeoAttrs.featureidkey,

    text: extendFlat({}, scatterGeoAttrs.text, {
        description: 'Sets the text elements associated with each location.'
    }),
    hovertext: extendFlat({}, scatterGeoAttrs.hovertext, {
        description: 'Same as `text`.'
    }),
    marker: {
        line: {
            color: extendFlat({}, scatterGeoMarkerLineAttrs.color, {dflt: defaultLine}),
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

    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        editType: 'calc',
        flags: ['location', 'z', 'text', 'name']
    }),
    hovertemplate: hovertemplateAttrs(),
    showlegend: extendFlat({}, baseAttrs.showlegend, {dflt: false})
},

    colorScaleAttrs('', {
        cLetter: 'z',
        editTypeOverride: 'calc'
    })
);
