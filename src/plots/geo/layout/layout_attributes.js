/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorAttrs = require('../../../components/color/attributes');
var constants = require('../constants');
var geoAxesAttrs = require('./axis_attributes');


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
                'Sets the horizontal domain of this map',
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
                'Sets the vertical domain of this map',
                '(in plot fraction).'
            ].join(' ')
        }
    },
    resolution: {
        valType: 'enumerated',
        values: [110, 50],
        role: 'info',
        dflt: 110,
        coerceNumber: true,
        description: [
            'Sets the resolution of the base layers.',
            'The values have units of km/mm',
            'e.g. 110 corresponds to a scale ratio of 1:110,000,000.'
        ].join(' ')
    },
    scope: {
        valType: 'enumerated',
        role: 'info',
        values: Object.keys(constants.scopeDefaults),
        dflt: 'world',
        description: 'Set the scope of the map.'
    },
    projection: {
        type: {
            valType: 'enumerated',
            role: 'info',
            values: Object.keys(constants.projNames),
            description: 'Sets the projection type.'
        },
        rotation: {
            lon: {
                valType: 'number',
                role: 'info',
                description: [
                    'Rotates the map along parallels',
                    '(in degrees East).'
                ].join(' ')
            },
            lat: {
                valType: 'number',
                role: 'info',
                description: [
                    'Rotates the map along meridians',
                    '(in degrees North).'
                ].join(' ')
            },
            roll: {
                valType: 'number',
                role: 'info',
                description: [
                    'Roll the map (in degrees)',
                    'For example, a roll of *180* makes the map appear upside down.'
                ].join(' ')
            }
        },
        parallels: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number'},
                {valType: 'number'}
            ],
            description: [
                'For conic projection types only.',
                'Sets the parallels (tangent, secant)',
                'where the cone intersects the sphere.'
            ].join(' ')
        },
        scale: {
            valType: 'number',
            role: 'info',
            min: 0,
            max: 10,
            dflt: 1,
            description: 'Zooms in or out on the map view.'
        }
    },
    showcoastlines: {
        valType: 'boolean',
        role: 'info',
        description: 'Sets whether or not the coastlines are drawn.'
    },
    coastlinecolor: {
        valType: 'color',
        role: 'style',
        dflt: colorAttrs.defaultLine,
        description: 'Sets the coastline color.'
    },
    coastlinewidth: {
        valType: 'number',
        role: 'style',
        min: 0,
        dflt: 1,
        description: 'Sets the coastline stroke width (in px).'
    },
    showland: {
        valType: 'boolean',
        role: 'info',
        dflt: false,
        description: 'Sets whether or not land masses are filled in color.'
    },
    landcolor: {
        valType: 'color',
        role: 'style',
        dflt: constants.landColor,
        description: 'Sets the land mass color.'
    },
    showocean: {
        valType: 'boolean',
        role: 'info',
        dflt: false,
        description: 'Sets whether or not oceans are filled in color.'
    },
    oceancolor: {
        valType: 'color',
        role: 'style',
        dflt: constants.waterColor,
        description: 'Sets the ocean color'
    },
    showlakes: {
        valType: 'boolean',
        role: 'info',
        dflt: false,
        description: 'Sets whether or not lakes are drawn.'
    },
    lakecolor: {
        valType: 'color',
        role: 'style',
        dflt: constants.waterColor,
        description: 'Sets the color of the lakes.'
    },
    showrivers: {
        valType: 'boolean',
        role: 'info',
        dflt: false,
        description: 'Sets whether or not rivers are drawn.'
    },
    rivercolor: {
        valType: 'color',
        role: 'style',
        dflt: constants.waterColor,
        description: 'Sets color of the rivers.'
    },
    riverwidth: {
        valType: 'number',
        role: 'style',
        min: 0,
        dflt: 1,
        description: 'Sets the stroke width (in px) of the rivers.'
    },
    showcountries: {
        valType: 'boolean',
        role: 'info',
        description: 'Sets whether or not country boundaries are drawn.'
    },
    countrycolor: {
        valType: 'color',
        role: 'style',
        dflt: colorAttrs.defaultLine,
        description: 'Sets line color of the country boundaries.'
    },
    countrywidth: {
        valType: 'number',
        role: 'style',
        min: 0,
        dflt: 1,
        description: 'Sets line width (in px) of the country boundaries.'
    },
    showsubunits: {
        valType: 'boolean',
        role: 'info',
        description: [
            'Sets whether or not boundaries of subunits within countries',
            '(e.g. states, provinces) are drawn.'
        ].join(' ')
    },
    subunitcolor: {
        valType: 'color',
        role: 'style',
        dflt: colorAttrs.defaultLine,
        description: 'Sets the color of the subunits boundaries.'
    },
    subunitwidth: {
        valType: 'number',
        role: 'style',
        min: 0,
        dflt: 1,
        description: 'Sets the stroke width (in px) of the subunits boundaries.'
    },
    showframe: {
        valType: 'boolean',
        role: 'info',
        description: 'Sets whether or not a frame is drawn around the map.'
    },
    framecolor: {
        valType: 'color',
        role: 'style',
        dflt: colorAttrs.defaultLine,
        description: 'Sets the color the frame.'
    },
    framewidth: {
        valType: 'number',
        role: 'style',
        min: 0,
        dflt: 1,
        description: 'Sets the stroke width (in px) of the frame.'
    },
    bgcolor: {
        valType: 'color',
        role: 'style',
        dflt: colorAttrs.background,
        description: 'Set the background color of the map'
    },
    lonaxis: geoAxesAttrs,
    lataxis: geoAxesAttrs
};
