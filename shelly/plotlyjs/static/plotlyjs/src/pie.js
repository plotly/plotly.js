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

    // center/size is different from how we do axis domains...
    // should we just copy that instead?
    // domainx: [left,right] and domainy: [bottom, top] ?
    center: [
        {type: 'number', min: 0, max: 1, dflt: 0.5},
        {type: 'number', min: 0, max: 1, dflt: 0.5}
    ],
    size: [
        {type: 'number', min: 0, max: 1, dflt: 1},
        {type: 'number', min: 0, max: 1, dflt: 1}
    ],
    aspect: {
        // the ratio of r_y to r_y... then we make the biggest
        // pie that fits in sizex, sizey (also accounting for
        // depth, below)
        type: 'number',
        min: 0.1,
        max: 10,
        dflt: 1
    },
    hole: {
        // fraction of the radius to cut out and make a donut
        type: 'number',
        min: 0,
        max: 1,
        dflt: 0
    },
    depth: {
        // "3D" size, in the direction of the smaller radius,
        // as a fraction of the larger radius
        type: 'number',
        min: 0,
        max: 10,
        dflt: 0
    },

    // style
    line: {
        color: {
            type: 'color'
        },
        width: {
            type: 'number',
            min: 0,
            dflt: 0
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
