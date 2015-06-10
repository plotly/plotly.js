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

    scalegroup: {
        /**
         * if there are multiple pies that should be sized according to
         * their totals, link them by providing a non-false group id here
         * shared by every trace in the same group
         * see eg:
         * https://www.e-education.psu.edu/natureofgeoinfo/sites/www.e-education.psu.edu.natureofgeoinfo/files/image/hisp_pies.gif
         * (this example involves a map too - may someday be a whole trace type
         * of its own. but the point is the size of the whole pie is important.)
         */
        type: 'any',
        dflt: false
    },

    // labels (legend is handled by plots.attributes.showlegend and layout.legend.hiddenslices)
    insideinfo: {
        // text to show in the slices
        mode: {
            type: 'enumerated',
            values: ['label', 'percent', 'value', 'none'],
            dflt: 'percent'
        },
        font: {type: 'font'}
    },
    outsideinfo: {
        // text to show around the outside of the slices
        mode: {
            type: 'enumerated',
            values: ['label', 'percent', 'value', 'none'],
            dflt: 'none'
        },
        font: {type: 'font'}
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

pie.supplyDefaults = function(traceIn, traceOut) {
    function coerce(attr, dflt) {
        return Plotly.Lib.coerce(traceIn, traceOut, pie.attributes, attr, dflt);
    }

    var vals = coerce('value');
    if(!Array.isArray(vals) || !vals.length) {
        traceOut.visible = false;
        return;
    }

    var labels = coerce('label');
    if(!Array.isArray(labels)) { // TODO: what if labels is shorter than vals?
        coerce('label0');
        coerce('dlabel');
    }

    var colors = coerce('color');
    if(!Array.isArray(colors)) traceOut.color = []; // later this will get padded with default colors

    coerce('scalegroup');
    // TODO: tilt, depth, and hole all need to be coerced to the same values within a sharegroup
    // and if colors aren't specified we should match these up - potentially even if separate pies
    // are NOT in the same sharegroup

    var insideMode = coerce('insideinfo.mode');
    if(insideMode !== 'none') coerce('insideinfo.font');

    var outsideMode = coerce('outsideinfo.mode');
    if(outsideMode !== 'none') coerce('outsideinfo.font');

    coerce('domain.x[0]');
    coerce('domain.x[1]');
    coerce('domain.y[0]');
    coerce('domain.y[1]');

    var tilt = coerce('tilt');
    if(tilt) {
        coerce('tiltaxis');
        coerce('depth');
        coerce('shade');
    }

    coerce('hole');

    coerce('sort');
    coerce('orientation');
    coerce('rotation');

    var lineWidth = coerce('line.width');
    if(lineWidth) coerce('line.color');

    coerce('pull');
};