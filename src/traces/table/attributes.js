'use strict';

var annAttrs = require('../../components/annotations/attributes');
var extendFlat = require('../../lib/extend').extendFlat;
var overrideAll = require('../../plot_api/edit_types').overrideAll;
var fontAttrs = require('../../plots/font_attributes');
var domainAttrs = require('../../plots/domain').attributes;
var descriptionOnlyNumbers = require('../../plots/cartesian/axis_format_attributes').descriptionOnlyNumbers;

var attrs = module.exports = overrideAll({
    domain: domainAttrs({name: 'table', trace: true}),

    columnwidth: {
        valType: 'number',
        arrayOk: true,
        dflt: null,
        description: [
            'The width of columns expressed as a ratio. Columns fill the available width',
            'in proportion of their specified column widths.'
        ].join(' ')
    },

    columnorder: {
        valType: 'data_array',
        description: [
            'Specifies the rendered order of the data columns; for example, a value `2` at position `0`',
            'means that column index `0` in the data will be rendered as the',
            'third column, as columns have an index base of zero.'
        ].join(' ')
    },

    header: {

        values: {
            valType: 'data_array',
            dflt: [],
            description: [
                'Header cell values. `values[m][n]` represents the value of the `n`th point in column `m`,',
                'therefore the `values[m]` vector length for all columns must be the same (longer vectors',
                'will be truncated). Each value must be a finite number or a string.'
            ].join(' ')
        },

        format: {
            valType: 'data_array',
            dflt: [],
            description: descriptionOnlyNumbers('cell value')
        },

        prefix: {
            valType: 'string',
            arrayOk: true,
            dflt: null,
            description: 'Prefix for cell values.'
        },

        suffix: {
            valType: 'string',
            arrayOk: true,
            dflt: null,
            description: 'Suffix for cell values.'
        },

        height: {
            valType: 'number',
            dflt: 28,
            description: 'The height of cells.'
        },

        align: extendFlat({}, annAttrs.align, {arrayOk: true}),

        line: {
            width: {
                valType: 'number',
                arrayOk: true,
                dflt: 1,
            },
            color: {
                valType: 'color',
                arrayOk: true,
                dflt: 'grey',
            }
        },

        fill: {
            color: {
                valType: 'color',
                arrayOk: true,
                dflt: 'white',
                description: [
                    'Sets the cell fill color. It accepts either a specific color',
                    'or an array of colors or a 2D array of colors.'
                ].join(' ')
            }
        },

        font: extendFlat({}, fontAttrs({arrayOk: true}))
    },

    cells: {

        values: {
            valType: 'data_array',
            dflt: [],
            description: [
                'Cell values. `values[m][n]` represents the value of the `n`th point in column `m`,',
                'therefore the `values[m]` vector length for all columns must be the same (longer vectors',
                'will be truncated). Each value must be a finite number or a string.'
            ].join(' ')
        },

        format: {
            valType: 'data_array',
            dflt: [],
            description: descriptionOnlyNumbers('cell value')
        },

        prefix: {
            valType: 'string',
            arrayOk: true,
            dflt: null,
            description: 'Prefix for cell values.'
        },

        suffix: {
            valType: 'string',
            arrayOk: true,
            dflt: null,
            description: 'Suffix for cell values.'
        },

        height: {
            valType: 'number',
            dflt: 20,
            description: 'The height of cells.'
        },

        align: extendFlat({}, annAttrs.align, {arrayOk: true}),

        line: {
            width: {
                valType: 'number',
                arrayOk: true,
                dflt: 1,
            },
            color: {
                valType: 'color',
                arrayOk: true,
                dflt: 'grey',
            }
        },

        fill: {
            color: {
                valType: 'color',
                arrayOk: true,
                dflt: 'white',
                description: [
                    'Sets the cell fill color. It accepts either a specific color',
                    'or an array of colors or a 2D array of colors.'
                ].join(' ')
            }
        },

        font: extendFlat({}, fontAttrs({arrayOk: true}))
    }
}, 'calc', 'from-root');
attrs.transforms = undefined;
