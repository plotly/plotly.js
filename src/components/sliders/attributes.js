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
var colorAttrs = require('../color/attributes');
var extendFlat = require('../../lib/extend').extendFlat;
var animationAttrs = require('../../plots/animation_attributes');

var stepsAttrs = {
    _isLinkedToArray: true,

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
            'method set in `method` on click.'
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
        min: -10,
        dflt: 0,
        description: [
            'Determines which button (by index starting from 0) is',
            'considered active.'
        ].join(' ')
    },

    steps: stepsAttrs,

    updateevent: {
        valType: 'string',
        arrayOk: true,
        role: 'info',
        description: [
            'The name of the event to which this component subscribes',
            'in order to trigger updates. When the event is received',
            'the component will attempt to update the slider position',
            'to reflect the value passed as the data property of the',
            'event. The corresponding step\'s API method is assumed to',
            'have been triggered externally and so is not triggered again',
            'when the event is received. If an array is provided, multiple',
            'events will be subscribed to for updates.'
        ].join(' ')
    },

    updatevalue: {
        valType: 'string',
        arrayOk: true,
        role: 'info',
        description: [
            'The property of the event data that is matched to a slider',
            'value when an event of type `updateevent` is received. If',
            'undefined, the data argument itself is used. If a string,',
            'that property is used, and if a string with dots, e.g.',
            '`item.0.label`, then `data[0].label` is used. If an array,',
            'it is matched to the respective updateevent item or if there',
            'is no corresponding updatevalue for a particular updateevent,',
            'it is interpreted as `undefined` and defaults to the data',
            'property itself.'
        ].join(' ')
    },

    lenmode: {
        valType: 'enumerated',
        values: ['fraction', 'pixels'],
        role: 'info',
        dflt: 'fraction',
        description: [
            'Determines whether this color bar\'s length',
            '(i.e. the measure in the color variation direction)',
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
            'Sets the length of the color bar',
            'This measure excludes the padding of both ends.',
            'That is, the color bar length is this length minus the',
            'padding on both ends.'
        ].join(' ')
    },
    x: {
        valType: 'number',
        min: -2,
        max: 3,
        dflt: -0.05,
        role: 'style',
        description: 'Sets the x position (in normalized coordinates) of the slider.'
    },
    pad: extendFlat({}, padAttrs, {
        description: 'Set the padding of the slider component along each side.'
    }),
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
        dflt: 1,
        role: 'style',
        description: 'Sets the y position (in normalized coordinates) of the slider.'
    },
    yanchor: {
        valType: 'enumerated',
        values: ['auto', 'top', 'middle', 'bottom'],
        dflt: 'bottom',
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
            description: [
                'When currentvalue.visible is true, this sets the prefix of the lable. If provided,',
                'it will be joined to the current value with a single space between.'
            ].join(' ')
        },

        font: extendFlat({}, fontAttrs, {
            description: 'Sets the font of the current value lable text.'
        }),
    },

    font: extendFlat({}, fontAttrs, {
        description: 'Sets the font of the slider step labels.'
    }),

    bgcolor: {
        valType: 'color',
        role: 'style',
        description: 'Sets the background color of the slider buttons.'
    },
    bordercolor: {
        valType: 'color',
        dflt: colorAttrs.borderLine,
        role: 'style',
        description: 'Sets the color of the border enclosing the slider.'
    },
    borderwidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        role: 'style',
        description: 'Sets the width (in px) of the border enclosing the slider.'
    }
};
