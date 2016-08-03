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
var buttonAttrs = require('./button_attributes');

buttonAttrs = extendFlat(buttonAttrs, {
    _isLinkedToArray: true,
    description: [
        'Sets the specifications for each buttons.',
        'By default, a range selector comes with no buttons.'
    ].join(' ')
});

module.exports = {
    visible: {
        valType: 'boolean',
        role: 'info',
        description: [
            'Determines whether or not this range selector is visible.',
            'Note that range selectors are only available for x axes of',
            '`type` set to or auto-typed to *date*.'
        ].join(' ')
    },

    buttons: buttonAttrs,

    x: {
        valType: 'number',
        min: -2,
        max: 3,
        role: 'style',
        description: 'Sets the x position (in normalized coordinates) of the range selector.'
    },
    xanchor: {
        valType: 'enumerated',
        values: ['auto', 'left', 'center', 'right'],
        dflt: 'left',
        role: 'info',
        description: [
            'Sets the range selector\'s horizontal position anchor.',
            'This anchor binds the `x` position to the *left*, *center*',
            'or *right* of the range selector.'
        ].join(' ')
    },
    y: {
        valType: 'number',
        min: -2,
        max: 3,
        role: 'style',
        description: 'Sets the y position (in normalized coordinates) of the range selector.'
    },
    yanchor: {
        valType: 'enumerated',
        values: ['auto', 'top', 'middle', 'bottom'],
        dflt: 'bottom',
        role: 'info',
        description: [
            'Sets the range selector\'s vertical position anchor',
            'This anchor binds the `y` position to the *top*, *middle*',
            'or *bottom* of the range selector.'
        ].join(' ')
    },

    font: extendFlat({}, fontAttrs, {
        description: 'Sets the font of the range selector button text.'
    }),

    bgcolor: {
        valType: 'color',
        dflt: colorAttrs.lightLine,
        role: 'style',
        description: 'Sets the background color of the range selector buttons.'
    },
    activecolor: {
        valType: 'color',
        role: 'style',
        description: 'Sets the background color of the active range selector button.'
    },
    bordercolor: {
        valType: 'color',
        dflt: colorAttrs.defaultLine,
        role: 'style',
        description: 'Sets the color of the border enclosing the range selector.'
    },
    borderwidth: {
        valType: 'number',
        min: 0,
        dflt: 0,
        role: 'style',
        description: 'Sets the width (in px) of the border enclosing the range selector.'
    }
};
