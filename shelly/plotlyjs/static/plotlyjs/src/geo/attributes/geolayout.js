var Plotly = require('../../plotly'),
    params = require('../lib/params');

module.exports = {
    domain:  {
        x: [
            {valType: 'number', min: 0, max: 1, dflt: 0},
            {valType: 'number', min: 0, max: 1, dflt: 1}
        ],
        y: [
            {valType: 'number', min: 0, max: 1},
            {valType: 'number', min: 0, max: 1}
        ]
    },
    resolution: {
        valType: 'enumerated',
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
        valType: 'enumerated',
        values: Object.keys(params.scopeDefaults),
        dflt: 'world',
        description: 'Set the scope of the map.'
    },
    projection: {
        type: {
            valType: 'enumerated',
            values: Object.keys(params.projNames),
            description: 'Sets the projection type.'
        },
        rotation: {
            lon: {
                valType: 'number',
                description: [
                    'Rotates the map along parallels',
                    '(in degrees East).'
                ].join(' ')
            },
            lat: {
                valType: 'number',
                description: [
                    'Rotates the map along meridians',
                    '(in degrees North).'
                ].join(' ')
            },
            roll: {
                valType: 'number',
                description: [
                    'Roll the map (in degrees)',
                    'For example, a roll of *180* makes the map appear upside down.'
                ].join(' ')
            }
        },
        parallels: [
            {valType: 'number'},
            {valType: 'number'}
        ],
        scale: {
            valType: 'number',
            min: 0,
            max: 10,
            dflt: 1,
            description: 'Zooms in or out on the map view.'
        }
    },
    showcoastlines: {
        valType: 'boolean',
        description: 'Sets whether or not the coastlines are drawn.'
    },
    coastlinecolor: {
        valType: 'color',
        dflt: Plotly.Color.defaultLine,
        description: 'Sets the coastline color.'
    },
    coastlinewidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        description: 'Sets the coastline stroke width (in px).'
    },
    showland: {
        valType: 'boolean',
        dflt: false,
        description: 'Sets whether or not land masses are filled in color.'
    },
    landcolor: {
        valType: 'color',
        dflt: params.landColor,
        description: 'Sets the land mass color.'
    },
    showocean: {
        valType: 'boolean',
        dflt: false,
        description: 'Sets whether or not oceans are filled in color.'
    },
    oceancolor: {
        valType: 'color',
        dflt: params.waterColor,
        description: 'Sets the ocean color'
    },
    showlakes: {
        valType: 'boolean',
        dflt: false,
        description: 'Sets whether or not lakes are drawn.'
    },
    lakecolor: {
        valType: 'color',
        dflt: params.waterColor,
        description: 'Sets the color of the lakes.'
    },
    showrivers: {
        valType: 'boolean',
        dflt: false,
        description: 'Sets whether or not rivers are drawn.'
    },
    rivercolor: {
        valType: 'color',
        dflt: params.waterColor,
        description: 'Sets color of the rivers.'
    },
    riverwidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        description: 'Sets the stroke width (in px) of the rivers.'
    },
    showcountries: {
        valType: 'boolean',
        description: 'Sets whether or not country boundaries are drawn.'
    },
    countrycolor: {
        valType: 'color',
        dflt: Plotly.Color.defaultLine,
        description: 'Sets line color of the country boundaries.'
    },
    countrywidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        description: 'Sets line width (in px) of the country boundaries.'
    },
    showsubunits: {
        valType: 'boolean',
        description: [
            'Sets whether or not boundaries of subunits within countries',
            '(e.g. states, provinces) are drawn.'
        ].join(' ')
    },
    subunitcolor: {
        valType: 'color',
        dflt: Plotly.Color.defaultLine,
        description: 'Sets the color of the subunits boundaries.'
    },
    subunitwidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        description: 'Sets the stroke width (in px) of the subunits boundaries.'
    },
    showframe: {
        valType: 'boolean',
        description: 'Sets whether or not a frame is drawn around the map.'
    },
    framecolor: {
        valType: 'color',
        dflt: Plotly.Color.defaultLine,
        description: 'Sets the color the frame.'
    },
    framewidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        description: 'Sets the stroke width (in px) of the frame.'
    },
    bgcolor: {
        valType: 'color',
        dflt: Plotly.Color.background,
        description: 'Set the background color of the map'
    },
    _nestedModules: {
        'lonaxis': 'GeoAxes',
        'lataxis': 'GeoAxes'
    }
};
