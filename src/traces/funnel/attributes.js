/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var barAttrs = require('../bar/attributes');
var lineAttrs = require('../scatter/attributes').line;
var baseAttrs = require('../../plots/attributes');
var hovertemplateAttrs = require('../../plots/template_attributes').hovertemplateAttrs;
var texttemplateAttrs = require('../../plots/template_attributes').texttemplateAttrs;
var constants = require('./constants');
var extendFlat = require('../../lib/extend').extendFlat;
var Color = require('../../components/color');

module.exports = {
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

    hovertext: barAttrs.hovertext,
    hovertemplate: hovertemplateAttrs({}, {
        keys: constants.eventDataKeys
    }),

    hoverinfo: extendFlat({}, baseAttrs.hoverinfo, {
        flags: ['name', 'x', 'y', 'text', 'percent initial', 'percent previous', 'percent total']
    }),

    textinfo: {
        valType: 'flaglist',
        flags: ['label', 'text', 'percent initial', 'percent previous', 'percent total', 'value'],
        extras: ['none'],
        role: 'info',
        editType: 'plot',
        arrayOk: false,
        description: [
            'Determines which trace information appear on the graph.',
            'In the case of having multiple funnels, percentages & totals',
            'are computed separately (per trace).'
        ].join(' ')
    },
    // TODO: incorporate `label` and `value` in the eventData
    texttemplate: texttemplateAttrs({editType: 'plot'}, {
        keys: constants.eventDataKeys.concat(['label', 'value'])
    }),

    text: barAttrs.text,
    textposition: extendFlat({}, barAttrs.textposition, {dflt: 'auto'}),
    insidetextanchor: extendFlat({}, barAttrs.insidetextanchor, {dflt: 'middle'}),
    textangle: extendFlat({}, barAttrs.textangle, {dflt: 0}),
    textfont: barAttrs.textfont,
    insidetextfont: barAttrs.insidetextfont,
    outsidetextfont: barAttrs.outsidetextfont,
    constraintext: barAttrs.constraintext,
    cliponaxis: barAttrs.cliponaxis,

    orientation: extendFlat({}, barAttrs.orientation, {
        description: [
            'Sets the orientation of the funnels.',
            'With *v* (*h*), the value of the each bar spans',
            'along the vertical (horizontal).',
            'By default funnels are tend to be oriented horizontally;',
            'unless only *y* array is presented or orientation is set to *v*.',
            'Also regarding graphs including only \'horizontal\' funnels,',
            '*autorange* on the *y-axis* are set to *reversed*.'
        ].join(' ')
    }),

    offset: extendFlat({}, barAttrs.offset, {arrayOk: false}),
    width: extendFlat({}, barAttrs.width, {arrayOk: false}),

    marker: barAttrs.marker,

    connector: {
        fillcolor: {
            valType: 'color',
            role: 'style',
            editType: 'style',
            description: [
                'Sets the fill color.'
            ].join(' ')
        },
        line: {
            color: extendFlat({}, lineAttrs.color, {dflt: Color.defaultLine}),
            width: extendFlat({}, lineAttrs.width, {
                dflt: 0,
                editType: 'plot',
            }),
            dash: lineAttrs.dash,
            editType: 'style'
        },
        visible: {
            valType: 'boolean',
            dflt: true,
            role: 'info',
            editType: 'plot',
            description: [
                'Determines if connector regions and lines are drawn.'
            ].join(' ')
        },
        editType: 'plot'
    },

    offsetgroup: barAttrs.offsetgroup,
    alignmentgroup: barAttrs.alignmentgroup
};
