var Plotly = require('../../plotly'),
    params = require('../lib/params');

module.exports = {
    domain:  {
        x: [
            {type: 'number', min: 0, max: 1, dflt: 0},
            {type: 'number', min: 0, max: 1, dflt: 1}
        ],
        y: [
            {type: 'number', min: 0, max: 1},
            {type: 'number', min: 0, max: 1}
        ]
    },
    resolution: {
        type: 'enumerated',
        values: [110, 50],
        dflt: 110,
        coerceNumber: true,
        description: [
            'Sets the resolution of the base layers.',
            'The values have units of km/mm',
            'e.g. 110 corresponds to a scale ratio of 1:110,000,000.'
        ].join(' ')
    },
    scope: {
        type: 'enumerated',
        values: Object.keys(params.scopeDefaults),
        dflt: 'world',
        description: 'Set the scope of the map.'
    },
    projection: {
        type: {
            type: 'enumerated',
            values: Object.keys(params.projNames),
            description: 'Sets the projection type.'
        },
        rotation: {
            lon: {
                type: 'number',
                description: [
                    'Rotates the map along parallels',
                    '(in degrees East).'
                ].join(' ')
            },
            lat: {
                type: 'number',
                description: [
                    'Rotates the map along meridians',
                    '(in degrees North).'
                ].join(' ')
            },
            roll: {
                type: 'number',
                description: [
                    'Roll the map (in degrees)',
                    'For example, a roll of *180* makes the map appear upside down.'
                ].join(' ')
            }
        },
        parallels: [
            {type: 'number'},
            {type: 'number'}
        ],
        scale: {
            type: 'number',
            min: 0,
            max: 10,
            dflt: 1,
            description: 'Zooms in or out on the map view.'
        }
    },
    showcoastlines: {
        type: 'boolean',
        description: 'Sets whether or not the coastlines are drawn.'
    },
    coastlinecolor: {
        type: 'color',
        dflt: Plotly.Color.defaultLine,
        description: 'Sets the coastline color.'
    },
    coastlinewidth: {
        type: 'number',
        min: 0,
        dflt: 1,
        description: 'Sets the coastline stroke width (in px).'
    },
    showland: {
        type: 'boolean',
        dflt: false,
        description: 'Sets whether or not land masses are filled in color.'
    },
    landcolor: {
        type: 'color',
        dflt: params.landColor,
        description: 'Sets the land mass color.'
    },
    showocean: {
        type: 'boolean',
        dflt: false,
        description: 'Sets whether or not oceans are filled in color.'
    },
    oceancolor: {
        type: 'color',
        dflt: params.waterColor,
        description: 'Sets the ocean color'
    },
    showlakes: {
        type: 'boolean',
        dflt: false,
        description: 'Sets whether or not lakes are drawn.'
    },
    lakecolor: {
        type: 'color',
        dflt: params.waterColor,
        description: 'Sets the color of the lakes.'
    },
    showrivers: {
        type: 'boolean',
        dflt: false,
        description: 'Sets whether or not rivers are drawn.'
    },
    rivercolor: {
        type: 'color',
        dflt: params.waterColor,
        description: 'Sets color of the rivers.'
    },
    riverwidth: {
        type: 'number',
        min: 0,
        dflt: 1,
        description: 'Sets the stroke width (in px) of the rivers.'
    },
    showcountries: {
        type: 'boolean',
        description: 'Sets whether or not country boundaries are drawn.'
    },
    countrycolor: {
        type: 'color',
        dflt: Plotly.Color.defaultLine,
        description: 'Sets line color of the country boundaries.'
    },
    countrywidth: {
        type: 'number',
        min: 0,
        dflt: 1,
        description: 'Sets line width (in px) of the country boundaries.'
    },
    showsubunits: {
        type: 'boolean',
        description: [
            'Sets whether or not boundaries of subunits within countries',
            '(e.g. states, provinces) are drawn.'
        ].join(' ')
    },
    subunitcolor: {
        type: 'color',
        dflt: Plotly.Color.defaultLine,
        description: 'Sets the color of the subunits boundaries.'
    },
    subunitwidth: {
        type: 'number',
        min: 0,
        dflt: 1,
        description: 'Sets the stroke width (in px) of the subunits boundaries.'
    },
    showframe: {
        type: 'boolean',
        description: 'Sets whether or not a frame is drawn around the map.'
    },
    framecolor: {
        type: 'color',
        dflt: Plotly.Color.defaultLine,
        description: 'Sets the color the frame.'
    },
    framewidth: {
        type: 'number',
        min: 0,
        dflt: 1,
        description: 'Sets the stroke width (in px) of the frame.'
    },
    bgcolor: {
        type: 'color',
        dflt: Plotly.Color.background,
        description: 'Set the background color of the map'
    },
    _nestedModules: {
        'lonaxis': 'GeoAxes',
        'lataxis': 'GeoAxes'
    }
};
