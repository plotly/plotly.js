/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var fontAttrs = require('../../plots/font_attributes');
var colorAttrs = require('../color/attributes');
var extendFlat = require('../../lib/extend').extendFlat;
var padAttrs = require('../../plots/pad_attributes');

var buttonsAttrs = {
    _isLinkedToArray: 'button',

    method: {
        valType: 'enumerated',
        values: ['restyle', 'relayout', 'animate', 'update'],
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
    _isLinkedToArray: 'updatemenu',

    visible: {
        valType: 'boolean',
        role: 'info',
        description: [
            'Determines whether or not the update menu is visible.'
        ].join(' ')
    },

    type: {
        valType: 'enumerated',
        values: ['dropdown', 'buttons'],
        dflt: 'dropdown',
        role: 'info',
        description: [
            'Determines whether the buttons are accessible via a dropdown menu',
            'or whether the buttons are stacked horizontally or vertically'
        ].join(' ')
    },

    direction: {
        valType: 'enumerated',
        values: ['left', 'right', 'up', 'down'],
        dflt: 'down',
        role: 'info',
        description: [
            'Determines the direction in which the buttons are laid out, whether',
            'in a dropdown menu or a row/column of buttons. For `left` and `up`,',
            'the buttons will still appear in left-to-right or top-to-bottom order',
            'respectively.'
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

    showactive: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        description: 'Highlights active dropdown item or active button if true.'
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
        dflt: 'top',
        role: 'info',
        description: [
            'Sets the update menu\'s vertical position anchor',
            'This anchor binds the `y` position to the *top*, *middle*',
            'or *bottom* of the range selector.'
        ].join(' ')
    },

    pad: extendFlat({}, padAttrs, {
        description: 'Sets the padding around the buttons or dropdown menu.'
    }),

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
