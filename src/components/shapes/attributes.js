/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var annAttrs = require('../annotations/attributes');
var scatterLineAttrs = require('../../traces/scatter/attributes').line;
var dash = require('../drawing/attributes').dash;
var extendFlat = require('../../lib/extend').extendFlat;

module.exports = {
    _isLinkedToArray: 'shape',

    visible: {
        valType: 'boolean',
        role: 'info',
        dflt: true,
        description: [
            'Determines whether or not this shape is visible.'
        ].join(' ')
    },

    type: {
        valType: 'enumerated',
        values: ['circle', 'rect', 'path', 'line'],
        role: 'info',
        description: [
            'Specifies the shape type to be drawn.',

            'If *line*, a line is drawn from (`x0`,`y0`) to (`x1`,`y1`)',

            'If *circle*, a circle is drawn from',
            '((`x0`+`x1`)/2, (`y0`+`y1`)/2))',
            'with radius',
            '(|(`x0`+`x1`)/2 - `x0`|, |(`y0`+`y1`)/2 -`y0`)|)',

            'If *rect*, a rectangle is drawn linking',
            '(`x0`,`y0`), (`x1`,`y0`), (`x1`,`y1`), (`x0`,`y1`), (`x0`,`y0`)',

            'If *path*, draw a custom SVG path using `path`.'
        ].join(' ')
    },

    layer: {
        valType: 'enumerated',
        values: ['below', 'above'],
        dflt: 'above',
        role: 'info',
        description: 'Specifies whether shapes are drawn below or above traces.'
    },

    xref: extendFlat({}, annAttrs.xref, {
        description: [
            'Sets the shape\'s x coordinate axis.',
            'If set to an x axis id (e.g. *x* or *x2*), the `x` position',
            'refers to an x coordinate',
            'If set to *paper*, the `x` position refers to the distance from',
            'the left side of the plotting area in normalized coordinates',
            'where *0* (*1*) corresponds to the left (right) side.',
            'If the axis `type` is *log*, then you must take the',
            'log of your desired range.',
            'If the axis `type` is *date*, then you must convert',
            'the date to unix time in milliseconds.'
        ].join(' ')
    }),
    x0: {
        valType: 'any',
        role: 'info',
        description: [
            'Sets the shape\'s starting x position.',
            'See `type` for more info.'
        ].join(' ')
    },
    x1: {
        valType: 'any',
        role: 'info',
        description: [
            'Sets the shape\'s end x position.',
            'See `type` for more info.'
        ].join(' ')
    },

    yref: extendFlat({}, annAttrs.yref, {
        description: [
            'Sets the annotation\'s y coordinate axis.',
            'If set to an y axis id (e.g. *y* or *y2*), the `y` position',
            'refers to an y coordinate',
            'If set to *paper*, the `y` position refers to the distance from',
            'the bottom of the plotting area in normalized coordinates',
            'where *0* (*1*) corresponds to the bottom (top).'
        ].join(' ')
    }),
    y0: {
        valType: 'any',
        role: 'info',
        description: [
            'Sets the shape\'s starting y position.',
            'See `type` for more info.'
        ].join(' ')
    },
    y1: {
        valType: 'any',
        role: 'info',
        description: [
            'Sets the shape\'s end y position.',
            'See `type` for more info.'
        ].join(' ')
    },

    path: {
        valType: 'string',
        role: 'info',
        description: [
            'For `type` *path* - a valid SVG path but with the pixel values',
            'replaced by data values. There are a few restrictions / quirks',
            'only absolute instructions, not relative. So the allowed segments',
            'are: M, L, H, V, Q, C, T, S, and Z',
            'arcs (A) are not allowed because radius rx and ry are relative.',

            'In the future we could consider supporting relative commands,',
            'but we would have to decide on how to handle date and log axes.',
            'Note that even as is, Q and C Bezier paths that are smooth on',
            'linear axes may not be smooth on log, and vice versa.',
            'no chained "polybezier" commands - specify the segment type for',
            'each one.',

            'On category axes, values are numbers scaled to the serial numbers',
            'of categories because using the categories themselves there would',
            'be no way to describe fractional positions',
            'On data axes: because space and T are both normal components of path',
            'strings, we can\'t use either to separate date from time parts.',
            'Therefore we\'ll use underscore for this purpose:',
            '2015-02-21_13:45:56.789'
        ].join(' ')
    },

    opacity: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 1,
        role: 'info',
        description: 'Sets the opacity of the shape.'
    },
    line: {
        color: scatterLineAttrs.color,
        width: scatterLineAttrs.width,
        dash: dash,
        role: 'info'
    },
    fillcolor: {
        valType: 'color',
        dflt: 'rgba(0,0,0,0)',
        role: 'info',
        description: [
            'Sets the color filling the shape\'s interior.'
        ].join(' ')
    }
};
