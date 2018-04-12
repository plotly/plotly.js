/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var fontAttrs = require('./font_attributes');
var colorAttrs = require('../components/color/attributes');

var globalFont = fontAttrs({
    editType: 'calc',
    description: [
        'Sets the global font.',
        'Note that fonts used in traces and other',
        'layout components inherit from the global font.'
    ].join(' ')
});
globalFont.family.dflt = '"Open Sans", verdana, arial, sans-serif';
globalFont.size.dflt = 12;
globalFont.color.dflt = colorAttrs.defaultLine;

module.exports = {
    font: globalFont,
    title: {
        valType: 'string',
        role: 'info',
        editType: 'layoutstyle',
        description: [
            'Sets the plot\'s title.'
        ].join(' ')
    },
    titlefont: fontAttrs({
        editType: 'layoutstyle',
        description: 'Sets the title font.'
    }),
    autosize: {
        valType: 'boolean',
        role: 'info',
        dflt: false,
        // autosize, width, and height get special editType treatment in _relayout
        // so we can handle noop resizes more efficiently
        editType: 'none',
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
        editType: 'plot',
        description: [
            'Sets the plot\'s width (in px).'
        ].join(' ')
    },
    height: {
        valType: 'number',
        role: 'info',
        min: 10,
        dflt: 450,
        editType: 'plot',
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
            editType: 'plot',
            description: 'Sets the left margin (in px).'
        },
        r: {
            valType: 'number',
            role: 'info',
            min: 0,
            dflt: 80,
            editType: 'plot',
            description: 'Sets the right margin (in px).'
        },
        t: {
            valType: 'number',
            role: 'info',
            min: 0,
            dflt: 100,
            editType: 'plot',
            description: 'Sets the top margin (in px).'
        },
        b: {
            valType: 'number',
            role: 'info',
            min: 0,
            dflt: 80,
            editType: 'plot',
            description: 'Sets the bottom margin (in px).'
        },
        pad: {
            valType: 'number',
            role: 'info',
            min: 0,
            dflt: 0,
            editType: 'plot',
            description: [
                'Sets the amount of padding (in px)',
                'between the plotting area and the axis lines'
            ].join(' ')
        },
        autoexpand: {
            valType: 'boolean',
            role: 'info',
            dflt: true,
            editType: 'plot'
        },
        editType: 'plot'
    },
    paper_bgcolor: {
        valType: 'color',
        role: 'style',
        dflt: colorAttrs.background,
        editType: 'plot',
        description: 'Sets the color of paper where the graph is drawn.'
    },
    plot_bgcolor: {
        // defined here, but set in cartesian.supplyLayoutDefaults
        // because it needs to know if there are (2D) axes or not
        valType: 'color',
        role: 'style',
        dflt: colorAttrs.background,
        editType: 'layoutstyle',
        description: [
            'Sets the color of plotting area in-between x and y axes.'
        ].join(' ')
    },
    separators: {
        valType: 'string',
        role: 'style',
        editType: 'plot',
        description: [
            'Sets the decimal and thousand separators.',
            'For example, *. * puts a \'.\' before decimals and a space',
            'between thousands. In English locales, dflt is *.,* but',
            'other locales may alter this default.'
        ].join(' ')
    },
    hidesources: {
        valType: 'boolean',
        role: 'info',
        dflt: false,
        editType: 'plot',
        description: [
            'Determines whether or not a text link citing the data source is',
            'placed at the bottom-right cored of the figure.',
            'Has only an effect only on graphs that have been generated via',
            'forked graphs from the plotly service (at https://plot.ly or on-premise).'
        ].join(' ')
    },
    showlegend: {
        // handled in legend.supplyLayoutDefaults
        // but included here because it's not in the legend object
        valType: 'boolean',
        role: 'info',
        editType: 'legend',
        description: 'Determines whether or not a legend is drawn.'
    },
    colorway: {
        valType: 'colorlist',
        dflt: colorAttrs.defaults,
        role: 'style',
        editType: 'calc',
        description: 'Sets the default trace colors.'
    },
    datarevision: {
        valType: 'any',
        role: 'info',
        editType: 'calc',
        description: [
            'If provided, a changed value tells `Plotly.react` that',
            'one or more data arrays has changed. This way you can modify',
            'arrays in-place rather than making a complete new copy for an',
            'incremental change.',
            'If NOT provided, `Plotly.react` assumes that data arrays are',
            'being treated as immutable, thus any data array with a',
            'different identity from its predecessor contains new data.'
        ].join(' ')
    },
    template: {
        valType: 'any',
        role: 'info',
        editType: 'calc',
        description: [
            'Default attributes to be applied to the plot. Templates can be',
            'created from existing plots using `Plotly.makeTemplate`, or',
            'created manually. They should be objects with format:',
            '`{layout: layoutTemplate, data: {[type]: [traceTemplate, ...]}, ...}`',
            '`layoutTemplate` and `traceTemplate` are objects matching the',
            'attribute structure of `layout` and a data trace. ',
            'Trace templates are applied cyclically to traces of each type.',
            'Container arrays (eg `annotations`) have special handling:',
            'An object ending in `defaults` (eg `annotationdefaults`) is applied',
            'to each array item. But if an item has a `templateitemname` key',
            'we look in the template array for an item with matching `name` and',
            'apply that instead. If no matching `name` is found we mark the item',
            'invisible. Any named template item not referenced is appended to',
            'the end of the array, so you can use this for a watermark annotation',
            'or a logo image, for example. To omit one of these items on the plot,',
            'make an item with matching `templateitemname` and `visible: false`.'
        ].join(' ')
    }
};
