/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var pieAtts = require('../pie/attributes');
var barAttrs = require('../bar/attributes');
var lineAttrs = require('../scatter/attributes').line;
var extendFlat = require('../../lib/extend').extendFlat;
var Color = require('../../components/color');

module.exports = {
    x: barAttrs.x,
    x0: barAttrs.x0,
    dx: barAttrs.dx,
    y: barAttrs.y,
    y0: barAttrs.y0,
    dy: barAttrs.dy,

    hovertext: barAttrs.hovertext,
    hovertemplate: barAttrs.hovertemplate,

    textinfo: extendFlat({}, pieAtts.textinfo, {
        editType: 'plot',
        flags: ['label', 'text', 'percent initial', 'percent previous', 'percent total', 'value'],
        arrayOk: false,
        description: [
            'Determines which trace information appear on the graph.'
        ].join(' ')
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
    orientation: barAttrs.orientation,

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
    alignmentgroup: barAttrs.offsetgroup
};
