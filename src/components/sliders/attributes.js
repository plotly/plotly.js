'use strict';

var fontAttrs = require('../../plots/font_attributes');
var padAttrs = require('../../plots/pad_attributes');
var extendDeepAll = require('../../lib/extend').extendDeepAll;
var overrideAll = require('../../plot_api/edit_types').overrideAll;
var animationAttrs = require('../../plots/animation_attributes');
var templatedArray = require('../../plot_api/plot_template').templatedArray;
var constants = require('./constants');

var stepsAttrs = templatedArray('step', {
    visible: {
        valType: 'boolean',
        dflt: true,
        description: [
            'Determines whether or not this step is included in the slider.'
        ].join(' ')
    },
    method: {
        valType: 'enumerated',
        values: ['restyle', 'relayout', 'animate', 'update', 'skip'],
        dflt: 'restyle',
        description: [
            'Sets the Plotly method to be called when the slider value is changed.',
            'If the `skip` method is used, the API slider will function as normal',
            'but will perform no API calls and will not bind automatically to state',
            'updates. This may be used to create a component interface and attach to',
            'slider events manually via JavaScript.'
        ].join(' ')
    },
    args: {
        valType: 'info_array',
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
        description: 'Sets the text label to appear on the slider'
    },
    value: {
        valType: 'string',
        description: [
            'Sets the value of the slider step, used to refer to the step programatically.',
            'Defaults to the slider label if not provided.'
        ].join(' ')
    },
    execute: {
        valType: 'boolean',
        dflt: true,
        description: [
            'When true, the API method is executed. When false, all other behaviors are the same',
            'and command execution is skipped. This may be useful when hooking into, for example,',
            'the `plotly_sliderchange` method and executing the API command manually without losing',
            'the benefit of the slider automatically binding to the state of the plot through the',
            'specification of `method` and `args`.'
        ].join(' ')
    }
});

module.exports = overrideAll(templatedArray('slider', {
    visible: {
        valType: 'boolean',
        dflt: true,
        description: [
            'Determines whether or not the slider is visible.'
        ].join(' ')
    },

    active: {
        valType: 'number',
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
        description: 'Sets the x position (in normalized coordinates) of the slider.'
    },
    pad: extendDeepAll(padAttrs({editType: 'arraydraw'}), {
        description: 'Set the padding of the slider component along each side.'
    }, {t: {dflt: 20}}),
    xanchor: {
        valType: 'enumerated',
        values: ['auto', 'left', 'center', 'right'],
        dflt: 'left',
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
        description: 'Sets the y position (in normalized coordinates) of the slider.'
    },
    yanchor: {
        valType: 'enumerated',
        values: ['auto', 'top', 'middle', 'bottom'],
        dflt: 'top',
        description: [
            'Sets the slider\'s vertical position anchor',
            'This anchor binds the `y` position to the *top*, *middle*',
            'or *bottom* of the range selector.'
        ].join(' ')
    },

    transition: {
        duration: {
            valType: 'number',
            min: 0,
            dflt: 150,
            description: 'Sets the duration of the slider transition'
        },
        easing: {
            valType: 'enumerated',
            values: animationAttrs.transition.easing.values,
            dflt: 'cubic-in-out',
            description: 'Sets the easing function of the slider transition'
        }
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
            description: [
                'The alignment of the value readout relative to the length of the slider.'
            ].join(' ')
        },

        offset: {
            valType: 'number',
            dflt: 10,
            description: [
                'The amount of space, in pixels, between the current value label',
                'and the slider.'
            ].join(' ')
        },

        prefix: {
            valType: 'string',
            description: 'When currentvalue.visible is true, this sets the prefix of the label.'
        },

        suffix: {
            valType: 'string',
            description: 'When currentvalue.visible is true, this sets the suffix of the label.'
        },

        font: fontAttrs({
            description: 'Sets the font of the current value label text.'
        })
    },

    font: fontAttrs({
        description: 'Sets the font of the slider step labels.'
    }),

    activebgcolor: {
        valType: 'color',
        dflt: constants.gripBgActiveColor,
        description: [
            'Sets the background color of the slider grip',
            'while dragging.'
        ].join(' ')
    },
    bgcolor: {
        valType: 'color',
        dflt: constants.railBgColor,
        description: 'Sets the background color of the slider.'
    },
    bordercolor: {
        valType: 'color',
        dflt: constants.railBorderColor,
        description: 'Sets the color of the border enclosing the slider.'
    },
    borderwidth: {
        valType: 'number',
        min: 0,
        dflt: constants.railBorderWidth,
        description: 'Sets the width (in px) of the border enclosing the slider.'
    },
    ticklen: {
        valType: 'number',
        min: 0,
        dflt: constants.tickLength,
        description: 'Sets the length in pixels of step tick marks'
    },
    tickcolor: {
        valType: 'color',
        dflt: constants.tickColor,
        description: 'Sets the color of the border enclosing the slider.'
    },
    tickwidth: {
        valType: 'number',
        min: 0,
        dflt: 1,
        description: 'Sets the tick width (in px).'
    },
    minorticklen: {
        valType: 'number',
        min: 0,
        dflt: constants.minorTickLength,
        description: 'Sets the length in pixels of minor step tick marks'
    }
}), 'arraydraw', 'from-root');
