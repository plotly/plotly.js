/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var fontAttrs = require('../../plots/font_attributes');
var padAttrs = require('../../plots/pad_attributes');
var extendFlat = require('../../lib/extend').extendFlat;
var extendDeep = require('../../lib/extend').extendDeep;
var animationAttrs = require('../../plots/animation_attributes');
var constants = require('./constants');

var stepsAttrs = {
    _isLinkedToArray: 'step',

    method: {
        valType: 'enumerated',
        values: ['restyle', 'relayout', 'animate', 'update'],
        dflt: 'restyle',
        role: 'info',
        description: [
            'Sets the Plotly method to be called when the slider value is changed.'
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
            'method set in `method` on slide.'
        ].join(' ')
    },
    label: {
        valType: 'string',
        role: 'info',
        description: 'Sets the text label to appear on the slider'
    },
    value: {
        valType: 'string',
        role: 'info',
        description: [
            'Sets the value of the slider step, used to refer to the step programatically.',
            'Defaults to the slider label if not provided.'
        ].join(' ')
    }
};

module.exports = {
    _isLinkedToArray: 'slider',

    visible: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        description: [
            'Determines whether or not the slider is visible.'
        ].join(' ')
    },

    active: {
        valType: 'number',
        role: 'info',
        min: 0,
        dflt: 0,
        description: [
            'Determines which button (by index starting from 0) is',
            'considered active.'
        ].join(' ')
    },

    steps: stepsAttrs,

    lenmode: {
        valType: 'enumerated',
        values: ['fraction', 'pixels'],
        role: 'info',
        dflt: 'fraction',
        description: [
            'Determines whether this slider length',
            'is set in units of plot *fraction* or in *pixels.',
            'Use `len` to set the value.'
        ].join(' ')
    },
    len: {
        valType: 'number',
        min: 0,
        dflt: 1,
        role: 'style',
        description: [
            'Sets the length of the slider',
            'This measure excludes the padding of both ends.',
            'That is, the slider\'s length is this length minus the',
            'padding on both ends.'
        ].join(' ')
    },
    x: {
        valType: 'number',
        min: -2,
        max: 3,
        dflt: 0,
        role: 'style',
        description: 'Sets the x position (in normalized coordinates) of the slider.'
    },
    pad: extendDeep({}, padAttrs, {
        description: 'Set the padding of the slider component along each side.'
    }, {t: {dflt: 20}}),
    xanchor: {
        valType: 'enumerated',
        values: ['auto', 'left', 'center', 'right'],
        dflt: 'left',
        role: 'info',
        description: [
            'Sets the slider\'s horizontal position anchor.',
            'This anchor binds the `x` position to the *left*, *center*',
            'or *right* of the range selector.'
        ].join(' ')
    },
    y: {
        valType: 'number',
        min: -2,
        max: 3,
        dflt: 0,
        role: 'style',
        description: 'Sets the y position (in normalized coordinates) of the slider.'
    },
    yanchor: {
        valType: 'enumerated',
        values: ['auto', 'top', 'middle', 'bottom'],
        dflt: 'top',
        role: 'info',
        description: [
            'Sets the slider\'s vertical position anchor',
            'This anchor binds the `y` position to the *top*, *middle*',
            'or *bottom* of the range selector.'
        ].join(' ')
    },

    transition: {
        duration: {
            valType: 'number',
            role: 'info',
            min: 0,
            dflt: 150,
            description: 'Sets the duration of the slider transition'
        },
        easing: {
            valType: 'enumerated',
            values: animationAttrs.transition.easing.values,
            role: 'info',
            dflt: 'cubic-in-out',
            description: 'Sets the easing function of the slider transition'
        },
    },

    currentvalue: {
        visible: {
            valType: 'boolean',
            role: 'info',
            dflt: true,
            description: [
                'Shows the currently-selected value above the slider.'
            ].join(' ')
        },

        xanchor: {
            valType: 'enumerated',
            values: ['left', 'center', 'right'],
            dflt: 'left',
            role: 'info',
            description: [
                'The alignment of the value readout relative to the length of the slider.'
            ].join(' ')
        },

        offset: {
            valType: 'number',
            dflt: 10,
            role: 'info',
            description: [
                'The amount of space, in pixels, between the current value label',
                'and the slider.'
            ].join(' ')
        },

        prefix: {
            valType: 'string',
            role: 'info',
            description: 'When currentvalue.visible is true, this sets the prefix of the label.'
        },

        suffix: {
            valType: 'string',
            role: 'info',
            description: 'When currentvalue.visible is true, this sets the suffix of the label.'
        },

        font: extendFlat({}, fontAttrs, {
            description: 'Sets the font of the current value label text.'
        }),
    },

    font: extendFlat({}, fontAttrs, {
        description: 'Sets the font of the slider step labels.'
    }),

    activebgcolor: {
        valType: 'color',
        role: 'style',
        dflt: constants.gripBgActiveColor,
        description: [
            'Sets the background color of the slider grip',
            'while dragging.'
        ].join(' ')
    },
    bgcolor: {
        valType: 'color',
        role: 'style',
        dflt: constants.railBgColor,
        description: 'Sets the background color of the slider.'
    },
    bordercolor: {
        valType: 'color',
        dflt: constants.railBorderColor,
        role: 'style',
        description: 'Sets the color of the border enclosing the slider.'
    },
    borderwidth: {
        valType: 'number',
        min: 0,
        dflt: constants.railBorderWidth,
        role: 'style',
        description: 'Sets the width (in px) of the border enclosing the slider.'
    },
    ticklen: {
        valType: 'number',
        min: 0,
        dflt: constants.tickLength,
        role: 'style',
        description: 'Sets the length in pixels of step tick marks'
    },
    tickcolor: {
        valType: 'color',
        dflt: constants.tickColor,
        role: 'style',
        description: 'Sets the color of the border enclosing the slider.'
    },
    tickwidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        role: 'style',
        description: 'Sets the tick width (in px).'
    },
    minorticklen: {
        valType: 'number',
        min: 0,
        dflt: constants.minorTickLength,
        role: 'style',
        description: 'Sets the length in pixels of minor step tick marks'
    },
};
