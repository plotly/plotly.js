/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorAttributes = require('../../components/colorscale/color_attributes');
var colorbarAttrs = require('../../components/colorbar/attributes');
var colorscales = require('../../components/colorscale/scales');
var axesAttrs = require('../../plots/cartesian/layout_attributes');
var fontAttrs = require('../../plots/font_attributes');

var extend = require('../../lib/extend');
var extendDeepAll = extend.extendDeepAll;
var extendFlat = extend.extendFlat;

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
                'Sets the horizontal domain of this `parcoords` trace',
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
                'Sets the vertical domain of this `parcoords` trace',
                '(in plot fraction).'
            ].join(' ')
        },
        editType: 'calc'
    },

    labelfont: fontAttrs({
        editType: 'calc',
        description: 'Sets the font for the `dimension` labels.'
    }),
    tickfont: fontAttrs({
        editType: 'calc',
        description: 'Sets the font for the `dimension` tick values.'
    }),
    rangefont: fontAttrs({
        editType: 'calc',
        description: 'Sets the font for the `dimension` range values.'
    }),

    dimensions: {
        _isLinkedToArray: 'dimension',
        label: {
            valType: 'string',
            role: 'info',
            editType: 'calc',
            description: 'The shown name of the dimension.'
        },
        tickvals: extendFlat({}, axesAttrs.tickvals, {editType: 'calc'}),
        ticktext: extendFlat({}, axesAttrs.ticktext, {editType: 'calc'}),
        tickformat: {
            valType: 'string',
            dflt: '3s',
            role: 'style',
            editType: 'calc',
            description: [
                'Sets the tick label formatting rule using d3 formatting mini-language',
                'which is similar to those of Python. See',
                'https://github.com/d3/d3-format/blob/master/README.md#locale_format'
            ].join(' ')
        },
        visible: {
            valType: 'boolean',
            dflt: true,
            role: 'info',
            editType: 'calc',
            description: 'Shows the dimension when set to `true` (the default). Hides the dimension for `false`.'
        },
        range: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number', editType: 'calc'},
                {valType: 'number', editType: 'calc'}
            ],
            editType: 'calc',
            description: [
                'The domain range that represents the full, shown axis extent. Defaults to the `values` extent.',
                'Must be an array of `[fromValue, toValue]` with finite numbers as elements.'
            ].join(' ')
        },
        constraintrange: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number', editType: 'calc'},
                {valType: 'number', editType: 'calc'}
            ],
            editType: 'calc',
            description: [
                'The domain range to which the filter on the dimension is constrained. Must be an array',
                'of `[fromValue, toValue]` with finite numbers as elements.'
            ].join(' ')
        },
        values: {
            valType: 'data_array',
            role: 'info',
            dflt: [],
            editType: 'calc',
            description: [
                'Dimension values. `values[n]` represents the value of the `n`th point in the dataset,',
                'therefore the `values` vector for all dimensions must be the same (longer vectors',
                'will be truncated). Each value must be a finite number.'
            ].join(' ')
        },
        editType: 'calc',
        description: 'The dimensions (variables) of the parallel coordinates chart. 2..60 dimensions are supported.'
    },

    line: extendFlat(
        // the default autocolorscale isn't quite usable for parcoords due to context ambiguity around 0 (grey, off-white)
        // autocolorscale therefore defaults to false too, to avoid being overridden by the  blue-white-red autocolor palette
        extendDeepAll(
            colorAttributes('line', 'calc'),
            {
                colorscale: {dflt: colorscales.Viridis},
                autocolorscale: {
                    dflt: false,
                    description: [
                        'Has an effect only if line.color` is set to a numerical array.',
                        'Determines whether the colorscale is a default palette (`autocolorscale: true`)',
                        'or the palette determined by `line.colorscale`.',
                        'In case `colorscale` is unspecified or `autocolorscale` is true, the default ',
                        'palette will be chosen according to whether numbers in the `color` array are',
                        'all positive, all negative or mixed.',
                        'The default value is false, so that `parcoords` colorscale can default to `Viridis`.'
                    ].join(' ')
                }

            }
        ),

        {
            showscale: {
                valType: 'boolean',
                role: 'info',
                dflt: false,
                editType: 'calc',
                description: [
                    'Has an effect only if `line.color` is set to a numerical array.',
                    'Determines whether or not a colorbar is displayed.'
                ].join(' ')
            },
            colorbar: colorbarAttrs,
            editType: 'calc'
        }
    )
};
