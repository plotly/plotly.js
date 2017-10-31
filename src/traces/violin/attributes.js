/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var boxAttrs = require('../box/attributes');
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

    kernel: {
        valType: 'enumerated',
        values: ['gaussian', 'epanechnikov'],
        dflt: 'gaussian',
        role: 'info',
        editType: 'calc',
        description: [
            'Determines which kernel is used to compute the kernel density estimation.'
        ].join(' ')
    },
    bandwidth: {
        valType: 'number',
        min: 0,
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the bandwidth used to compute the kernel density estimate.',
            'By default, the bandwidth is determined by Silverman\'s rule of thumb.'
        ].join(' ')
    },

    scalegroup: {
        valType: 'string',
        role: 'info',
        dflt: '',
        editType: 'calc',
        description: [
            'If there are multiple violins that should be sized according to',
            'to some metric (see `scalemode`), link them by providing a non-empty group id here',
            'shared by every trace in the same group.'
        ].join(' ')
    },
    scalemode: {
        valType: 'enumerated',
        values: ['width', 'count'],
        dflt: 'width',
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the metric by which the width of each violin is determined.',
            '*width* means each violin has the same (max) width',
            '*count* means the violins are scaled by the number of sample points making',
            'up each violin.'
        ].join('')
    },

    spanmode: {
        valType: 'enumerated',
        values: ['soft', 'hard', 'manual'],
        dflt: 'soft',
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the method by which the span in data space where the density function will be computed.',
            '*soft* means the span goes from the sample\'s minimum value minus two bandwidths',
            'to the sample\'s maximum value plus two bandwidths.',
            '*hard* means the span goes from the sample\'s minimum to its maximum value.',
            'For custom span settings, use mode *manual* and fill in the `span` attribute.'
        ].join(' ')
    },
    span: {
        valType: 'info_array',
        items: [
            {valType: 'any', editType: 'calc'},
            {valType: 'any', editType: 'calc'}
        ],
        role: 'info',
        editType: 'calc',
        description: [
            'Sets the span in data space for which the density function will be computed.',
            'Has an effect only when `spanmode` is set to *manual*.'
        ].join(' ')
    },

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
        editType: 'plot'
    },
    fillcolor: boxAttrs.fillcolor,

    // TODO update description
    points: boxAttrs.boxpoints,
    jitter: boxAttrs.jitter,
    pointpos: boxAttrs.pointpos,
    marker: boxAttrs.marker,
    text: boxAttrs.text,

    showinnerbox: {
        valType: 'boolean',
        dflt: false,
        role: 'info',
        editType: 'plot',
        description: '.'
    },
    innerboxwidth: {
        valType: 'number',
        min: 0,
        max: 1,
        dflt: 0.25,
        role: 'info',
        editType: 'plot',
        description: '...'
    },
    innerboxlinecolor: {
        valType: 'color',
        role: 'style',
        editType: 'style',
        description: ''
    },
    innerboxfillcolor: {
        valType: 'color',
        role: 'style',
        editType: 'style',
        description: ''
    },
    innerboxlinewidth: {
        valType: 'number',
        min: 0,
        role: 'style',
        editType: 'style',
        description: ''
    },

    showmeanline: {
        valType: 'boolean',
        dflt: false,
        role: 'info',
        editType: 'plot',
        description: 'Toggle'
    },
    meanlinecolor: {
        valType: 'color',
        role: 'style',
        editType: 'style',
        description: ''
    },
    meanlinewidth: {
        valType: 'number',
        min: 0,
        role: 'style',
        editType: 'style',
        description: ''
    },
    hoveron: boxAttrs.hoveron

    side: {
        valType: 'enumerated',
        values: ['both', 'positive', 'negative'],
        dflt: 'both',
        role: 'info',
        editType: 'plot',
        description: [
            'Determines on which side of the position value the density function making up',
            'one half of a violin is plotted.',
            'Useful when comparing two violin traces under *overlay* mode, where one trace',
            'has `side` set to *positive* and the other to *negative*.'
        ].join(' ')
    },
};
