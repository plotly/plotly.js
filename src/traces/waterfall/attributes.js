/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var extendFlat = require('../../lib/extend').extendFlat;

var barAttrs = require('../bar/attributes');

var dash = require('../../components/drawing/attributes').dash;
var lineAttrs = require('../scatter/attributes').line;

module.exports = {

    operator: {
        valType: 'flaglist',
        flags: ['=', '+', '-', '%'],
        dflt: '+',
        arrayOk: true,
        role: 'calc',
        description: [
            'Sets the operation associated with each column/row depending on',
            'the `direction` of waterfall chart being horizontal or vertical.',
            '\'+\' The defualt operation is to add values to the previous sum.',
            '\'-\' Minus is to subtract (often positive) values from the sum.',
            '\'=\' could be used to show the sum.',
            '\'%\' Percent with either negative or positive values could be',
            'applied to compute percentage of the sum and then subtract/add the',
            'result to the sum. For example using -15 for 15% tax reduction.'
        ].join(' ')
    },

    x: barAttrs.x,
    x0: barAttrs.x0,
    dx: barAttrs.dx,
    y: barAttrs.y,
    y0: barAttrs.y0,
    dy: barAttrs.dy,

    r: barAttrs.r,
    t: barAttrs.t,

    text: barAttrs.text,
    hovertext: barAttrs.hovertext,
    hovertemplate: barAttrs.hovertemplate,

    textposition: barAttrs.textposition,

    textfont: barAttrs.textfont,

    insidetextfont: barAttrs.insidetextfont,

    outsidetextfont: barAttrs.outsidetextfont,

    constraintext: barAttrs.constraintext,

    cliponaxis: barAttrs.cliponaxis,

    orientation: barAttrs.orientation,

    offset: barAttrs.offset,

    width: barAttrs.width,

    marker: extendFlat({}, barAttrs.marker, {
        shape: {
            valType: 'enumerated',
            values: ['rectangle', 'triangle'],
            dflt: 'rectangle',
            role: 'style',
            editType: 'style',
            description: [
                'Defines the shape of positive/negative bars on the plot.',
                'Namely \'triangle`\ option could be used to emphasize on',
                'the direction of the changes.'
            ].join(' ')
        }
    }),

    connector: {
        color: extendFlat({}, lineAttrs.color, {dflt: '#FFFFFF'}),
        width: lineAttrs.width,
        dash: dash,
        editType: 'style'
    },

    selected: barAttrs.selected,
    unselected: barAttrs.unselected
};
