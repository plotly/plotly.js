var Plotly = require('../../plotly');

module.exports = {
    range: {
        valType: 'info_array',
        items: [
            {valType: 'number'},
            {valType: 'number'}
        ],
        description: 'Sets the range of this axis (in degrees).'
    },
    showgrid: {
        valType: 'boolean',
        dflt: false,
        description: 'Sets whether or not graticule are shown on the map.'
    },
    tick0: {
        valType: 'number',
        description: [
            'Sets the graticule\'s starting tick longitude/latitude.'
        ].join(' ')
    },
    dtick: {
        valType: 'number',
        description: [
            'Sets the graticule\'s longitude/latitude tick step.'
        ].join(' ')
    },
    gridcolor: {
        valType: 'color',
        dflt: Plotly.Color.lightLine,
        description: [
            'Sets the graticule\'s stroke color.'
        ].join(' ')
    },
    gridwidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        description: [
            'Sets the graticule\'s stroke width (in px).'
        ].join(' ')
    }
};
