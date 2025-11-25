'use strict';

var barAttrs = require('../bar/attributes');
var lineAttrs = require('../scatter/attributes').line;
var baseAttrs = require('../../plots/attributes');
var axisHoverFormat = require('../../plots/cartesian/axis_format_attributes').axisHoverFormat;
const { hovertemplateAttrs, texttemplateAttrs, templatefallbackAttrs } = require('../../plots/template_attributes');
var constants = require('./constants');
var extendFlat = require('../../lib/extend').extendFlat;
var Color = require('../../components/color');

function directionAttrs(dirTxt) {
    return {
        marker: {
            color: extendFlat({}, barAttrs.marker.color, {
                arrayOk: false,
                editType: 'style',
                description: 'Sets the marker color of all ' + dirTxt + ' values.'
            }),
            line: {
                color: extendFlat({}, barAttrs.marker.line.color, {
                    arrayOk: false,
                    editType: 'style',
                    description: 'Sets the line color of all ' + dirTxt + ' values.'
                }),
                width: extendFlat({}, barAttrs.marker.line.width, {
                    arrayOk: false,
                    editType: 'style',
                    description: 'Sets the line width of all ' + dirTxt + ' values.'
                }),
                editType: 'style'
            },
            editType: 'style'
        },
        editType: 'style'
    };
}

module.exports = {
    measure: {
        valType: 'data_array',
        dflt: [],
        editType: 'calc',
        description: [
            'An array containing types of values.',
            "By default the values are considered as 'relative'.",
            "However; it is possible to use 'total' to compute the sums.",
            "Also 'absolute' could be applied to reset the computed total",
            'or to declare an initial value where needed.'
        ].join(' ')
    },

    base: {
        valType: 'number',
        dflt: null,
        arrayOk: false,
        editType: 'calc',
        description: ['Sets where the bar base is drawn (in position axis units).'].join(' ')
    },

    x: barAttrs.x,
    x0: barAttrs.x0,
    dx: barAttrs.dx,
    y: barAttrs.y,
    y0: barAttrs.y0,
    dy: barAttrs.dy,

    xperiod: barAttrs.xperiod,
    yperiod: barAttrs.yperiod,
    xperiod0: barAttrs.xperiod0,
    yperiod0: barAttrs.yperiod0,
    xperiodalignment: barAttrs.xperiodalignment,
    yperiodalignment: barAttrs.yperiodalignment,
    xhoverformat: axisHoverFormat('x'),
    yhoverformat: axisHoverFormat('y'),

    hovertext: barAttrs.hovertext,
    hovertemplate: hovertemplateAttrs({}, { keys: constants.eventDataKeys }),
    hovertemplatefallback: templatefallbackAttrs(),

    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        flags: ['name', 'x', 'y', 'text', 'initial', 'delta', 'final']
    }),

    textinfo: {
        valType: 'flaglist',
        flags: ['label', 'text', 'initial', 'delta', 'final'],
        extras: ['none'],
        editType: 'plot',
        arrayOk: false,
        description: [
            'Determines which trace information appear on the graph.',
            'In the case of having multiple waterfalls, totals',
            'are computed separately (per trace).'
        ].join(' ')
    },
    // TODO: incorporate `label` and `value` in the eventData
    texttemplate: texttemplateAttrs({ editType: 'plot' }, { keys: constants.eventDataKeys.concat(['label']) }),
    texttemplatefallback: templatefallbackAttrs({ editType: 'plot' }),
    text: barAttrs.text,
    textposition: barAttrs.textposition,
    insidetextanchor: barAttrs.insidetextanchor,
    textangle: barAttrs.textangle,
    textfont: barAttrs.textfont,
    insidetextfont: barAttrs.insidetextfont,
    outsidetextfont: barAttrs.outsidetextfont,
    constraintext: barAttrs.constraintext,

    cliponaxis: barAttrs.cliponaxis,
    orientation: barAttrs.orientation,

    offset: barAttrs.offset,
    width: barAttrs.width,

    increasing: directionAttrs('increasing'),
    decreasing: directionAttrs('decreasing'),
    totals: directionAttrs('intermediate sums and total'),

    connector: {
        line: {
            color: extendFlat({}, lineAttrs.color, { dflt: Color.defaultLine }),
            width: extendFlat({}, lineAttrs.width, {
                editType: 'plot' // i.e. to adjust bars is mode: 'between'. See https://github.com/plotly/plotly.js/issues/3787
            }),
            dash: lineAttrs.dash,
            editType: 'plot'
        },
        mode: {
            valType: 'enumerated',
            values: ['spanning', 'between'],
            dflt: 'between',
            editType: 'plot',
            description: ['Sets the shape of connector lines.'].join(' ')
        },
        visible: {
            valType: 'boolean',
            dflt: true,
            editType: 'plot',
            description: ['Determines if connector lines are drawn. '].join(' ')
        },
        editType: 'plot'
    },

    offsetgroup: barAttrs.offsetgroup,
    alignmentgroup: barAttrs.alignmentgroup,
    zorder: barAttrs.zorder
};
