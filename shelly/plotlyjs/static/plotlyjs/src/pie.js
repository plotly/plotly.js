'use strict';

// ---external global dependencies
/* global d3:false */

var pie = module.exports = {},
    Plotly = require('./plotly'),
    Legend = require('./legend'),
    isNumeric = require('./isnumeric'),
    legendAttrs = Legend.layoutAttributes,
    extendFlat = Plotly.Lib.extendFlat;

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

    scalewith: {
        /**
         * if there are multiple pies that should be sized according to
         * their totals, link them by providing a trace number here
         * see eg:
         * https://www.e-education.psu.edu/natureofgeoinfo/sites/www.e-education.psu.edu.natureofgeoinfo/files/image/hisp_pies.gif
         * (this example involves a map too - may someday be a whole trace type
         * of its own. but the point is the size of the whole pie is important.)
         */
        type: 'enumerated',
        dflt: false
    },

    // labels & legend
    inside: {
        // text to show in the slices
        info: {
            type: 'enumerated',
            values: ['label', 'percent', 'value', 'none'],
            dflt: 'percent'
        },
        font: {type: 'font'}
    },
    outside: {
        // text to show around the outside of the slices
        info: {
            type: 'enumerated',
            values: ['label', 'percent', 'value', 'none'],
            dflt: 'none'
        },
        font: {type: 'font'}
    },
    legend: {
        // text to show in a legend
        info: {
            type: 'enumerated',
            values: ['label', 'percent', 'value', 'none'],
            dflt: 'value'
        },
        font: {type: 'font'},
        bgcolor: legendAttrs.bgcolor,
        bordercolor: legendAttrs.bordercolor,
        borderwidth: legendAttrs.borderwidth,
        x: legendAttrs.x,
        xanchor: legendAttrs.xanchor,
        y: extendFlat(legendAttrs.y, {dflt: 0.5}),
        yanchor: legendAttrs.yanchor
    },

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

    // ordering and orientation
    sort: {
        // reorder slices from largest to smallest?
        type: 'boolean',
        dflt: true
    },
    orientation: {
        /**
         * there are two common conventions, both of which place the first
         * (largest, if sorted) slice with its left edge at 12 o'clock but
         * succeeding slices follow either cw or ccw from there.
         *
         * see http://visage.co/data-visualization-101-pie-charts/
         */
        type: 'enumerated',
        values: ['cw', 'ccw'],
        dflt: 'ccw'
    },
    rotation: {
        // instead of the first slice starting at 12 o'clock, rotate to some other angle
        type: 'number',
        min: -360,
        max: 360,
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
