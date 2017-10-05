/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var annAttrs = require('../../components/annotations/attributes');
var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;

module.exports = overrideAll({
    domain: {
        x: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number', min: 0, max: 1},
                {valType: 'number', min: 0, max: 1}
            ],
            dflt: [0, 1],
            description: [
                'Sets the horizontal domain of this `table` trace',
                '(in plot fraction).'
            ].join(' ')
        },
        y: {
            valType: 'info_array',
            role: 'info',
            items: [
                {valType: 'number', min: 0, max: 1},
                {valType: 'number', min: 0, max: 1}
            ],
            dflt: [0, 1],
            description: [
                'Sets the vertical domain of this `table` trace',
                '(in plot fraction).'
            ].join(' ')
        }
    },

    columnwidth: {
        valType: 'number',
        arrayOk: true,
        dflt: null,
        role: 'style',
        description: 'The width of cells.'
    },

    columnorder: {
        valType: 'data_array',
        role: 'info',
        description: [
            'Specifies the rendered order of the data columns; for example, a value `2` at position `0`',
            'means that column index `0` in the data will be rendered as the',
            'third column, as columns have an index base of zero.'
        ].join(' ')
    },

    header: {

        values: {
            valType: 'data_array',
            role: 'info',
            dflt: [],
            description: [
                'Header cell values. `values[m][n]` represents the value of the `n`th point in column `m`,',
                'therefore the `values[m]` vector length for all columns must be the same (longer vectors',
                'will be truncated). Each value must be a finite number or a string.'
            ].join(' ')
        },

        format: {
            valType: 'data_array',
            role: 'info',
            dflt: [],
            description: [
                'Sets the cell value formatting rule using d3 formatting mini-language',
                'which is similar to those of Python. See',
                'https://github.com/d3/d3-format/blob/master/README.md#locale_format'
            ].join(' ')
        },

        prefix: {
            valType: 'string',
            arrayOk: true,
            dflt: null,
            role: 'style',
            description: 'Prefix for cell values.'
        },

        suffix: {
            valType: 'string',
            arrayOk: true,
            dflt: null,
            role: 'style',
            description: 'Suffix for cell values.'
        },

        height: {
            valType: 'number',
            dflt: 28,
            role: 'style',
            description: 'The height of cells.'
        },

        align: extendFlat({}, annAttrs.align, {arrayOk: true}),

        line: {
            width: {
                valType: 'number',
                arrayOk: true,
                role: 'style'
            },
            color: {
                valType: 'color',
                arrayOk: true,
                role: 'style'
            }
        },

        fill: {
            color: {
                valType: 'color',
                arrayOk: true,
                dflt: 'white',
                role: 'style',
                description: [
                    'Sets the cell fill color. It accepts either a specific color',
                    ' or an array of colors.'
                ].join('')
            }
        },

        font: {
            family: {
                valType: 'string',
                arrayOk: true,
                role: 'style',
                noBlank: true,
                strict: true,
                description: [
                    'HTML font family - the typeface that will be applied by the web browser.',
                    'The web browser will only be able to apply a font if it is available on the system',
                    'which it operates. Provide multiple font families, separated by commas, to indicate',
                    'the preference in which to apply fonts if they aren\'t available on the system.',
                    'The plotly service (at https://plot.ly or on-premise) generates images on a server,',
                    'where only a select number of',
                    'fonts are installed and supported.',
                    'These include *Arial*, *Balto*, *Courier New*, *Droid Sans*,, *Droid Serif*,',
                    '*Droid Sans Mono*, *Gravitas One*, *Old Standard TT*, *Open Sans*, *Overpass*,',
                    '*PT Sans Narrow*, *Raleway*, *Times New Roman*.'
                ].join(' ')
            },
            size: {
                valType: 'number',
                arrayOk: true,
                role: 'style'
            },
            color: {
                valType: 'color',
                arrayOk: true,
                role: 'style'
            }
        }
    },

    cells: {

        values: {
            valType: 'data_array',
            role: 'info',
            dflt: [],
            description: [
                'Cell values. `values[m][n]` represents the value of the `n`th point in column `m`,',
                'therefore the `values[m]` vector length for all columns must be the same (longer vectors',
                'will be truncated). Each value must be a finite number or a string.'
            ].join(' ')
        },

        format: {
            valType: 'data_array',
            role: 'info',
            dflt: [],
            description: [
                'Sets the cell value formatting rule using d3 formatting mini-language',
                'which is similar to those of Python. See',
                'https://github.com/d3/d3-format/blob/master/README.md#locale_format'
            ].join(' ')
        },

        prefix: {
            valType: 'string',
            arrayOk: true,
            dflt: null,
            role: 'style',
            description: 'Prefix for cell values.'
        },

        suffix: {
            valType: 'string',
            arrayOk: true,
            dflt: null,
            role: 'style',
            description: 'Suffix for cell values.'
        },

        height: {
            valType: 'number',
            dflt: 20,
            role: 'style',
            description: 'The height of cells.'
        },

        align: extendFlat({}, annAttrs.align, {arrayOk: true}),

        line: {
            width: {
                valType: 'number',
                arrayOk: true,
                role: 'style'
            },
            color: {
                valType: 'color',
                arrayOk: true,
                role: 'style'
            }
        },

        fill: {
            color: {
                valType: 'color',
                arrayOk: true,
                role: 'style',
                dflt: 'white',
                description: [
                    'Sets the cell fill color. It accepts either a specific color',
                    ' or an array of colors.'
                ].join('')
            }
        },

        font: {
            family: {
                valType: 'string',
                arrayOk: true,
                role: 'style',
                noBlank: true,
                strict: true,
                description: [
                    'HTML font family - the typeface that will be applied by the web browser.',
                    'The web browser will only be able to apply a font if it is available on the system',
                    'which it operates. Provide multiple font families, separated by commas, to indicate',
                    'the preference in which to apply fonts if they aren\'t available on the system.',
                    'The plotly service (at https://plot.ly or on-premise) generates images on a server,',
                    'where only a select number of',
                    'fonts are installed and supported.',
                    'These include *Arial*, *Balto*, *Courier New*, *Droid Sans*,, *Droid Serif*,',
                    '*Droid Sans Mono*, *Gravitas One*, *Old Standard TT*, *Open Sans*, *Overpass*,',
                    '*PT Sans Narrow*, *Raleway*, *Times New Roman*.'
                ].join(' ')
            },
            size: {
                valType: 'number',
                arrayOk: true,
                role: 'style'
            },
            color: {
                valType: 'color',
                arrayOk: true,
                role: 'style'
            }
        }
    }
}, 'calc', 'from-root');
