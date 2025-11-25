'use strict';

var extendFlat = require('../../lib').extendFlat;
var scatterAttrs = require('../scatter/attributes');
var axisHoverFormat = require('../../plots/cartesian/axis_format_attributes').axisHoverFormat;
const { hovertemplateAttrs, templatefallbackAttrs } = require('../../plots/template_attributes');
var dash = require('../../components/drawing/attributes').dash;
var fxAttrs = require('../../components/fx/attributes');
var delta = require('../../constants/delta.js');

var INCREASING_COLOR = delta.INCREASING.COLOR;
var DECREASING_COLOR = delta.DECREASING.COLOR;

var lineAttrs = scatterAttrs.line;

function directionAttrs(lineColorDefault) {
    return {
        line: {
            color: extendFlat({}, lineAttrs.color, { dflt: lineColorDefault }),
            width: lineAttrs.width,
            dash: dash,
            editType: 'style'
        },
        editType: 'style'
    };
}

module.exports = {
    xperiod: scatterAttrs.xperiod,
    xperiod0: scatterAttrs.xperiod0,
    xperiodalignment: scatterAttrs.xperiodalignment,
    xhoverformat: axisHoverFormat('x'),
    yhoverformat: axisHoverFormat('y'),

    x: {
        valType: 'data_array',
        editType: 'calc+clearAxisTypes',
        description: 'Sets the x coordinates. If absent, linear coordinate will be generated.'
    },

    open: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the open values.'
    },

    high: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the high values.'
    },

    low: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the low values.'
    },

    close: {
        valType: 'data_array',
        editType: 'calc',
        description: 'Sets the close values.'
    },

    line: {
        width: extendFlat({}, lineAttrs.width, {
            description: [
                lineAttrs.width,
                'Note that this style setting can also be set per',
                'direction via `increasing.line.width` and',
                '`decreasing.line.width`.'
            ].join(' ')
        }),
        dash: extendFlat({}, dash, {
            description: [
                dash.description,
                'Note that this style setting can also be set per',
                'direction via `increasing.line.dash` and',
                '`decreasing.line.dash`.'
            ].join(' ')
        }),
        editType: 'style'
    },

    increasing: directionAttrs(INCREASING_COLOR),

    decreasing: directionAttrs(DECREASING_COLOR),

    text: {
        valType: 'string',
        dflt: '',
        arrayOk: true,
        editType: 'calc',
        description: [
            'Sets hover text elements associated with each sample point.',
            'If a single string, the same string appears over',
            'all the data points.',
            'If an array of string, the items are mapped in order to',
            "this trace's sample points."
        ].join(' ')
    },
    hovertext: {
        valType: 'string',
        dflt: '',
        arrayOk: true,
        editType: 'calc',
        description: 'Same as `text`.'
    },
    hovertemplate: hovertemplateAttrs(
        {},
        {
            keys: ['open', 'high', 'low', 'close']
        }
    ),
    hovertemplatefallback: templatefallbackAttrs(),
    tickwidth: {
        valType: 'number',
        min: 0,
        max: 0.5,
        dflt: 0.3,
        editType: 'calc',
        description: 'Sets the width of the open/close tick marks relative to the *x* minimal interval.'
    },

    hoverlabel: extendFlat({}, fxAttrs.hoverlabel, {
        split: {
            valType: 'boolean',
            dflt: false,
            editType: 'style',
            description: [
                'Show hover information (open, close, high, low) in separate labels, rather than a single unified label.',
                'Default: *false*. When set to *true*, `hovertemplate` is ignored.'
            ].join(' ')
        }
    }),

    zorder: scatterAttrs.zorder
};
