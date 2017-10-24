/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var boxAttrs = require('../box/attributes');
var scatterAttrs = require('../scatter/attributes');
var extendFlat = require('../../lib/extend').extendFlat;

module.exports = {
    y: boxAttrs.y,
    x: boxAttrs.x,
    x0: boxAttrs.x0,
    y0: boxAttrs.y0,
    name: boxAttrs.name,
    orientation: extendFlat({}, boxAttrs.orientation, {
        description: [
            'Sets the orientation of the violin(s).',
            'If *v* (*h*), the distribution is visualized along',
            'the vertical (horizontal).'
        ].join(' ')
    }),

    bandwidth: {
        valType: 'number',
        min: 0,
        role: 'info',
        editType: 'plot',
        description: [
            'Sets the bandwidth used to compute the kernel density estimate.',
            'By default, the bandwidth is determined by Silverman\'s rule of thumb.'
        ].join(' ')
    },
    scaleby: {
        valType: 'enumerated',
        values: ['width', 'area', 'count'],
        dflt: 'width',
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the method by which the width of each violin is determined.',
            '*width* means each violin has the same (max) width',
            '*area* means each violin has the same area',
            '*count* means the violins are scaled by the number of sample points making',
            'up each violin.'
        ].join('')
    },
    span: {
        valType: 'info_array',
        items: [
            {valType: 'any', editType: 'plot'},
            {valType: 'any', editType: 'plot'}
        ],
        role: 'info',
        editType: 'plot',
        description: [
            'Sets the span in data space for which the density function will be computed.',
            'By default, the span goes from the minimum value to maximum value in the sample.'
        ].join(' ')
    },
    side: {
        valType: 'enumerated',
        values: ['both', 'left', 'right'],
        dflt: 'both',
        role: 'info',
        editType: 'plot',
        description: [
            'Determines which side of the position line the density function making up',
            'one half of a is plotting.',
            'Useful when comparing two violin traces under *overlay* mode, where one trace.'
        ].join(' ')
    },

    // TODO update description
    points: boxAttrs.boxpoints,
    jitter: boxAttrs.jitter,
    pointpos: boxAttrs.pointpos,
    marker: boxAttrs.marker,
    text: boxAttrs.text,

    // TODO need attribute(s) similar to 'boxmean' to toggle lines for:
    // - mean
    // - median
    // - std
    // - quartiles

    line: {
        color: {
            valType: 'color',
            role: 'style',
            editType: 'style',
            description: 'Sets the color of line bounding the violin(s).'
        },
        width: {
            valType: 'number',
            role: 'style',
            min: 0,
            dflt: 2,
            editType: 'style',
            description: 'Sets the width (in px) of line bounding the violin(s).'
        },
        smoothing: scatterAttrs.line.smoothing,
        editType: 'plot'
    },

    fillcolor: boxAttrs.fillcolor,
    hoveron: boxAttrs.hoveron
};
