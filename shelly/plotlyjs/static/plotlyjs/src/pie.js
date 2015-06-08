'use strict';

// ---external global dependencies
/* global d3:false */

var pie = module.exports = {},
    Plotly = require('./plotly'),
    isNumeric = require('./isnumeric');

Plotly.Plots.register(pie, 'pie', ['pie']);

pie.attributes = {
    // data
    label: {type: 'data_array'},
    // equivalent of x0 and dx, if label is missing
    label0: {type: 'any', dflt: 0},
    dlabel: {type: 'number', dflt: 1},

    value: {type: 'data_array'},
    // if color is missing, use default trace color set
    color: {type: 'data_array'},

    // position and shape
    domain: {
        x: [
            {type: 'number', min: 0, max: 1, dflt: 0},
            {type: 'number', min: 0, max: 1, dflt: 1}
        ],
        y: [
            {type: 'number', min: 0, max: 1, dflt: 0},
            {type: 'number', min: 0, max: 1, dflt: 1}
        ]
    },
    tilt: {
        // degrees to tilt the pie back from straight on
        type: 'number',
        min: 0,
        max: 90,
        dflt: 0
    },
    tiltaxis: {
        // degrees away from straight up to tilt the pie
        // only has an effect if tilt is nonzero
        type: 'number',
        min: -360,
        max: 360,
        dflt: 0
    },
    depth: {
        // "3D" size, as a fraction of radius
        // only has an effect if tilt is nonzero
        type: 'number',
        min: 0,
        max: 10,
        dflt: 0.5
    },
    hole: {
        // fraction of the radius to cut out and make a donut
        type: 'number',
        min: 0,
        max: 1,
        dflt: 0
    },

    // style
    line: {
        color: {
            type: 'color',
            arrayOk: true
        },
        width: {
            type: 'number',
            min: 0,
            dflt: 0,
            arrayOk: true
        }
    },
    shade: {
        // how much darker to make the sides than the top,
        // with a 3D effect. We could of course get all
        // fancy with lighting effects, but maybe this is
        // sufficient.
        type: 'number',
        min: 0,
        max: 1,
        dflt: 0.2
    },
    pull: {
        // fraction of larger radius to pull the slices
        // out from the center. This can be a constant
        // to pull all slices apart from each other equally
        // or an array to highlight one or more slices
        type: 'number',
        min: 0,
        max: 1,
        dflt: 0,
        arrayOk: true
    }
};
