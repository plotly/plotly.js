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

var buttonsAttrs = {
    _isLinkedToArray: true,

    method: {
        valType: 'enumerated',
        values: ['restyle', 'relayout'],
        dflt: 'restyle',
        role: 'info',
        description: [
            'Sets the Plotly method to be called on click.'
        ].join(' ')
    },
    args: {
        valType: 'info_array',
        role: 'info',
        freeLength: true,
        items: [
            { valType: 'any' },
            { valType: 'any' },
            { valType: 'any' }
        ],
        description: [
            'Sets the arguments values to be passed to the Plotly',
            'method set in `method` on click.'
        ].join(' ')
    },
    label: {
        valType: 'string',
        role: 'info',
        dflt: '',
        description: 'Sets the text label to appear on the button.'
    }
};

module.exports = {
    _isLinkedToArray: true,

    visible: {
        valType: 'boolean',
        role: 'info',
        description: [
            'Determines whether or not the update menu is visible.'
        ].join(' ')
    },

    active: {
        valType: 'integer',
        role: 'info',
        min: -1,
        dflt: 0,
        description: [
            'Determines which button (by index starting from 0) is',
            'considered active.'
        ].join(' ')
    },

    buttons: buttonsAttrs,

    x: {
        valType: 'number',
        min: -2,
        max: 3,
        dflt: -0.05,
        role: 'style',
        description: 'Sets the x position (in normalized coordinates) of the update menu.'
    },
    xanchor: {
        valType: 'enumerated',
        values: ['auto', 'left', 'center', 'right'],
        dflt: 'right',
        role: 'info',
        description: [
            'Sets the update menu\'s horizontal position anchor.',
            'This anchor binds the `x` position to the *left*, *center*',
            'or *right* of the range selector.'
        ].join(' ')
    },
    y: {
        valType: 'number',
        min: -2,
        max: 3,
        dflt: 1,
        role: 'style',
        description: 'Sets the y position (in normalized coordinates) of the update menu.'
    },
    yanchor: {
        valType: 'enumerated',
        values: ['auto', 'top', 'middle', 'bottom'],
        dflt: 'bottom',
        role: 'info',
        description: [
            'Sets the update menu\'s vertical position anchor',
            'This anchor binds the `y` position to the *top*, *middle*',
            'or *bottom* of the range selector.'
        ].join(' ')
    },

    font: extendFlat({}, fontAttrs, {
        description: 'Sets the font of the update menu button text.'
    }),

    bgcolor: {
        valType: 'color',
        role: 'style',
        description: 'Sets the background color of the update menu buttons.'
    },
    bordercolor: {
        valType: 'color',
        dflt: colorAttrs.borderLine,
        role: 'style',
        description: 'Sets the color of the border enclosing the update menu.'
    },
    borderwidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        role: 'style',
        description: 'Sets the width (in px) of the border enclosing the update menu.'
    }
};
