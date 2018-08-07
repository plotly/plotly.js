/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var extendFlat = require('../../lib/extend').extendFlat;
var colorAttributes = require('../../components/colorscale/attributes');

var scatterAttrs = require('../scatter/attributes');
var scatterLineAttrs = scatterAttrs.line;
var colorbarAttrs = require('../../components/colorbar/attributes');

var line = extendFlat({
    editType: 'calc'
}, colorAttributes('line', {editType: 'calc'}),
    {
        showscale: scatterLineAttrs.showscale,
        colorbar: colorbarAttrs,
        shape: {
            valType: 'enumerated',
            values: ['linear', 'hspline'],
            dflt: 'linear',
            role: 'info',
            editType: 'plot',
            description: 'Sets the shape of the paths'},
    });

module.exports = {
    domain: {
        x: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number', min: 0, max: 1, editType: 'calc'},
                {valType: 'number', min: 0, max: 1, editType: 'calc'}
            ],
            dflt: [0, 1],
            editType: 'calc',
            description: [
                'Sets the horizontal domain of this `parcats` trace',
                '(in plot fraction).'
            ].join(' ')
        },
        y: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number', min: 0, max: 1, editType: 'calc'},
                {valType: 'number', min: 0, max: 1, editType: 'calc'}
            ],
            dflt: [0, 1],
            editType: 'calc',
            description: [
                'Sets the vertical domain of this `parcats` trace',
                '(in plot fraction).'
            ].join(' ')
        },
        editType: 'calc'
    },

    tooltip: {
        valType: 'boolean',
        dflt: true,
        role: 'info',
        editType: 'plot',
        description: 'Shows a tooltip when hover mode is `category` or `color`.'
    },

    hovermode: {
        valType: 'enumerated',
        values: ['none', 'category', 'color'],
        dflt: 'category',
        role: 'info',
        editType: 'plot',
        description: 'Sets the hover mode of the parcats diagram'
    },
    bundlecolors: {
        valType: 'boolean',
        dflt: true,
        role: 'info',
        editType: 'plot',
        description: 'Sort paths so that like colors are bundled together'
    },
    sortpaths: {
        valType: 'enumerated',
        values: ['forward', 'backward'],
        dflt: 'forward',
        role: 'info',
        editType: 'plot',
        description: [
            'If `forward` then sort paths based on dimensions from left to right.',
            'If `backward` sort based on dimensions from right to left.'
        ].join(' ')
    },
    // labelfont: fontAttrs({
    //     editType: 'calc',
    //     description: 'Sets the font for the `dimension` labels.'
    // }),
    //
    // catfont: fontAttrs({
    //     editType: 'calc',
    //     description: 'Sets the font for the `category` labels.'
    // }),

    dimensions: {
        _isLinkedToArray: 'dimension',
        label: {
            valType: 'string',
            role: 'info',
            editType: 'calc',
            description: 'The shown name of the dimension.'
        },
        catDisplayInds: {
            valType: 'data_array',
            role: 'info',
            editType: 'calc',
            dflt: [],
            description: [
                ''
            ].join(' ')
        },
        catValues: {
            valType: 'data_array',
            role: 'info',
            editType: 'calc',
            dflt: [],
            description: [
                ''
            ].join(' ')
        },
        catLabels: {
            valType: 'data_array',
            role: 'info',
            editType: 'calc',
            dflt: [],
            description: [
                ''
            ].join(' ')
        },
        values: {
            valType: 'data_array',
            role: 'info',
            dflt: [],
            editType: 'calc',
            description: [
                'Dimension values. `values[n]` represents the category value of the `n`th point in the dataset,',
                'therefore the `values` vector for all dimensions must be the same (longer vectors',
                'will be truncated). Each value must an element of `catValues`.'
            ].join(' ')
        },
        displayInd: {
            valType: 'integer',
            role: 'info',
            editType: 'calc',
            description: [
                'The display index of dimension, from left to right, zero indexed, defaults to dimension' +
                'index.'
            ].join(' ')
        },
        editType: 'calc',
        description: 'The dimensions (variables) of the parallel categories diagram.'
    },

    line: line,
    counts: {
        valType: 'number',
        min: 0,
        dflt: 1,
        arrayOk: true,
        role: 'info',
        editType: 'calc',
        description: [
            'The number of observations represented by each state. Defaults to 1 so that each state represents ' +
                'one observation'
        ]
    }
};
