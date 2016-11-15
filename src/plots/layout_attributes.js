/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Lib = require('../lib');
var extendFlat = Lib.extendFlat;

var fontAttrs = require('./font_attributes');
var colorAttrs = require('../components/color/attributes');

module.exports = {
    font: {
        family: extendFlat({}, fontAttrs.family, {
            dflt: '"Open Sans", verdana, arial, sans-serif'
        }),
        size: extendFlat({}, fontAttrs.size, {
            dflt: 12
        }),
        color: extendFlat({}, fontAttrs.color, {
            dflt: colorAttrs.defaultLine
        }),
        description: [
            'Sets the global font.',
            'Note that fonts used in traces and other',
            'layout components inherit from the global font.'
        ].join(' ')
    },
    title: {
        valType: 'string',
        role: 'info',
        dflt: 'Click to enter Plot title',
        description: [
            'Sets the plot\'s title.'
        ].join(' ')
    },
    titlefont: extendFlat({}, fontAttrs, {
        description: 'Sets the title font.'
    }),
    autosize: {
        valType: 'boolean',
        role: 'info',
        dflt: false,
        description: [
            'Determines whether or not a layout width or height',
            'that has been left undefined by the user',
            'is initialized on each relayout.',

            'Note that, regardless of this attribute,',
            'an undefined layout width or height',
            'is always initialized on the first call to plot.'
        ].join(' ')
    },
    width: {
        valType: 'number',
        role: 'info',
        min: 10,
        dflt: 700,
        description: [
            'Sets the plot\'s width (in px).'
        ].join(' ')
    },
    height: {
        valType: 'number',
        role: 'info',
        min: 10,
        dflt: 450,
        description: [
            'Sets the plot\'s height (in px).'
        ].join(' ')
    },
    margin: {
        l: {
            valType: 'number',
            role: 'info',
            min: 0,
            dflt: 80,
            description: 'Sets the left margin (in px).'
        },
        r: {
            valType: 'number',
            role: 'info',
            min: 0,
            dflt: 80,
            description: 'Sets the right margin (in px).'
        },
        t: {
            valType: 'number',
            role: 'info',
            min: 0,
            dflt: 100,
            description: 'Sets the top margin (in px).'
        },
        b: {
            valType: 'number',
            role: 'info',
            min: 0,
            dflt: 80,
            description: 'Sets the bottom margin (in px).'
        },
        pad: {
            valType: 'number',
            role: 'info',
            min: 0,
            dflt: 0,
            description: [
                'Sets the amount of padding (in px)',
                'between the plotting area and the axis lines'
            ].join(' ')
        },
        autoexpand: {
            valType: 'boolean',
            role: 'info',
            dflt: true
        }
    },
    paper_bgcolor: {
        valType: 'color',
        role: 'style',
        dflt: colorAttrs.background,
        description: 'Sets the color of paper where the graph is drawn.'
    },
    plot_bgcolor: {
        // defined here, but set in Axes.supplyLayoutDefaults
        // because it needs to know if there are (2D) axes or not
        valType: 'color',
        role: 'style',
        dflt: colorAttrs.background,
        description: [
            'Sets the color of plotting area in-between x and y axes.'
        ].join(' ')
    },
    separators: {
        valType: 'string',
        role: 'style',
        dflt: '.,',
        description: [
            'Sets the decimal and thousand separators.',
            'For example, *. * puts a \'.\' before decimals and',
            'a space between thousands.'
        ].join(' ')
    },
    hidesources: {
        valType: 'boolean',
        role: 'info',
        dflt: false,
        description: [
            'Determines whether or not a text link citing the data source is',
            'placed at the bottom-right cored of the figure.',
            'Has only an effect only on graphs that have been generated via',
            'forked graphs from the plotly service (at https://plot.ly or on-premise).'
        ].join(' ')
    },
    smith: {
        // will become a boolean if/when we implement this
        valType: 'enumerated',
        role: 'info',
        values: [false],
        dflt: false
    },
    showlegend: {
        // handled in legend.supplyLayoutDefaults
        // but included here because it's not in the legend object
        valType: 'boolean',
        role: 'info',
        description: 'Determines whether or not a legend is drawn.'
    },

    dragmode: {
        valType: 'enumerated',
        role: 'info',
        values: ['zoom', 'pan', 'select', 'lasso', 'orbit', 'turntable'],
        dflt: 'zoom',
        description: [
            'Determines the mode of drag interactions.',
            '*select* and *lasso* apply only to scatter traces with',
            'markers or text. *orbit* and *turntable* apply only to',
            '3D scenes.'
        ].join(' ')
    },
    hovermode: {
        valType: 'enumerated',
        role: 'info',
        values: ['x', 'y', 'closest', false],
        description: 'Determines the mode of hover interactions.'
    }
};
