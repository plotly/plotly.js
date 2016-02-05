/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var fontAttrs = require('../../plots/font_attributes');
var colorAttrs = require('../color/attributes');
var extendFlat = require('../../lib/extend').extendFlat;


module.exports = {
    bgcolor: {
        valType: 'color',
        role: 'style',
        description: 'Sets the legend background color.'
    },
    bordercolor: {
        valType: 'color',
        dflt: colorAttrs.defaultLine,
        role: 'style',
        description: 'Sets the color of the border enclosing the legend.'
    },
    borderwidth: {
        valType: 'number',
        min: 0,
        dflt: 0,
        role: 'style',
        description: 'Sets the width (in px) of the border enclosing the legend.'
    },
    font: extendFlat({}, fontAttrs, {
        description: 'Sets the font used to text the legend items.'
    }),
    traceorder: {
        valType: 'flaglist',
        flags: ['reversed', 'grouped'],
        extras: ['normal'],
        role: 'style',
        description: [
            'Determines the order at which the legend items are displayed.',

            'If *normal*, the items are displayed top-to-bottom in the same',
            'order as the input data.',

            'If *reversed*, the items are displayed in the opposite order',
            'as *normal*.',

            'If *grouped*, the items are displayed in groups',
            '(when a trace `legendgroup` is provided).',

            'if *grouped+reversed*, the items are displayed in the opposite order',
            'as *grouped*.'
        ].join(' ')
    },
    tracegroupgap: {
        valType: 'number',
        min: 0,
        dflt: 10,
        role: 'style',
        description: [
            'Sets the amount of vertical space (in px) between legend groups.'
        ].join(' ')
    },
    x: {
        valType: 'number',
        min: -2,
        max: 3,
        dflt: 1.02,
        role: 'style',
        description: 'Sets the x position (in normalized coordinates) of the legend.'
    },
    xanchor: {
        valType: 'enumerated',
        values: ['auto', 'left', 'center', 'right'],
        dflt: 'left',
        role: 'info',
        description: [
            'Sets the legend\'s horizontal position anchor.',
            'This anchor binds the `x` position to the *left*, *center*',
            'or *right* of the legend.'
        ].join(' ')
    },
    y: {
        valType: 'number',
        min: -2,
        max: 3,
        dflt: 1,
        role: 'style',
        description: 'Sets the y position (in normalized coordinates) of the legend.'
    },
    yanchor: {
        valType: 'enumerated',
        values: ['auto', 'top', 'middle', 'bottom'],
        dflt: 'auto',
        role: 'info',
        description: [
            'Sets the legend\'s vertical position anchor',
            'This anchor binds the `y` position to the *top*, *middle*',
            'or *bottom* of the legend.'
        ].join(' ')
    }
};
