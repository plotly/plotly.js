/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var scatterMapboxAttrs = require('../../traces/scattermapbox/attributes');
var defaultLine = require('../../components/color').defaultLine;
var extendFlat = require('../../lib').extendFlat;

var lineAttrs = scatterMapboxAttrs.line;


module.exports = {
    domain: {
        x: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number', min: 0, max: 1},
                {valType: 'number', min: 0, max: 1}
            ],
            dflt: [0, 1],
            description: [
                'Sets the horizontal domain of this subplot',
                '(in plot fraction).'
            ].join(' ')
        },
        y: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number', min: 0, max: 1},
                {valType: 'number', min: 0, max: 1}
            ],
            dflt: [0, 1],
            description: [
                'Sets the vertical domain of this subplot',
                '(in plot fraction).'
            ].join(' ')
        }
    },

    style: {
        valType: 'string',
        values: ['basic', 'streets', 'outdoors', 'light', 'dark', 'satellite', 'satellite-streets'],
        dflt: 'basic',
        role: 'style',
        description: [
            'Sets the Mapbox map style.',
            'Either input the defaults Mapbox names or the URL to a custom style.'
        ].join(' ')
    },
    center: {
        lon: {
            valType: 'number',
            dflt: 0,
            role: 'info',
            description: 'Sets the longitude of the center of the map (in degrees East).'
        },
        lat: {
            valType: 'number',
            dflt: 0,
            role: 'info',
            description: 'Sets the latitude of the center of the map (in degrees North).'
        }
    },
    zoom: {
        valType: 'number',
        dflt: 1,
        role: 'info',
        description: 'Sets the zoom level of the map.'
    },
    bearing: {
        valType: 'number',
        dflt: 0,
        role: 'info',
        description: 'Sets the bearing angle of the map (in degrees counter-clockwise from North).'
    },
    pitch: {
        valType: 'number',
        dflt: 0,
        role: 'info',
        description: [
            'Sets the pitch angle of the map',
            '(in degrees, where *0* means perpendicular to the surface of the map).'
        ].join(' ')
    },

    layers: {
        _isLinkedToArray: true,

        sourcetype: {
            valType: 'enumerated',
            values: ['geojson', 'vector'],
            dflt: 'geojson',
            role: 'info',
            description: [
                'Sets the source type for this layer.',
                'Support for *raster*, *image* and *video* source types is coming soon.'
            ].join(' ')
        },

        source: {
            valType: 'any',
            role: 'info',
            description: [
                'Sets the source data for this layer.',
                'Source can be either a URL,',
                'a geojson object (with `sourcetype` set to *geojson*)',
                'or an array of tile URLS (with `sourcetype` set to *vector*).'
            ].join(' ')
        },

        sourcelayer: {
            valType: 'string',
            dflt: '',
            role: 'info',
            description: [
                'Specifies the layer to use from a vector tile source.',
                'Required for *vector* source type that supports multiple layers.'
            ].join(' ')
        },

        type: {
            valType: 'enumerated',
            values: ['line', 'fill'],
            dflt: 'line',
            role: 'info',
            description: [
                'Sets the layer type.',
                'Support for *raster*, *background* types is coming soon.'
            ].join(' ')
        },

        below: {
            valType: 'string',
            dflt: '',
            role: 'info',
            description: [
                'Determines if the layer will be inserted',
                'before the layer with the specified ID.',
                'If omitted or set to \'\',',
                'the layer will be inserted above every existing layer.'
            ].join(' ')
        },

        line: {
            color: extendFlat({}, lineAttrs.color, {
                dflt: defaultLine
            }),
            width: lineAttrs.width
        },

        fillcolor: scatterMapboxAttrs.fillcolor,

        opacity: {
            valType: 'number',
            min: 0,
            max: 1,
            dflt: 1,
            role: 'info',
            description: 'Sets the opacity of the layer.'
        }
    }

};
