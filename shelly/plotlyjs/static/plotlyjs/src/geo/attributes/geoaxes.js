var Plotly = require('../../plotly');

module.exports = {
    range: [
        {type: 'number'},
        {type: 'number'}
    ],
    showgrid: {
        type: 'boolean',
        dflt: false,
        description: 'Sets whether or not graticule are shown on the map.'
    },
    tick0: {
        type: 'number',
        description: [
            'Sets the graticule\'s starting tick longitude/latitude'
        ].join(' ')
    },
    dtick: {
        type: 'number',
        description: [
            'Sets the graticule\'s longitude/latitude tick step'
        ].join(' ')
    },
    gridcolor: {
        type: 'color',
        dflt: Plotly.Color.lightLine,
        description: [
            'Sets the graticule\'s stroke color'
        ].join(' ')
    },
    gridwidth: {
        type: 'number',
        min: 0,
        dflt: 1,
        description: [
            'Sets the graticule\'s stroke width'
        ].join(' ')
    }
};
