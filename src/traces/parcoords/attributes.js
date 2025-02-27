'use strict';

var colorScaleAttrs = require('../../components/colorscale/attributes');
var axesAttrs = require('../../plots/cartesian/layout_attributes');
var fontAttrs = require('../../plots/font_attributes');
var domainAttrs = require('../../plots/domain').attributes;

var extendFlat = require('../../lib/extend').extendFlat;
var templatedArray = require('../../plot_api/plot_template').templatedArray;

module.exports = {
    domain: domainAttrs({name: 'parcoords', trace: true, editType: 'plot'}),

    labelangle: {
        valType: 'angle',
        dflt: 0,
        editType: 'plot',
        description: [
            'Sets the angle of the labels with respect to the horizontal.',
            'For example, a `tickangle` of -90 draws the labels vertically.',
            'Tilted labels with *labelangle* may be positioned better',
            'inside margins when `labelposition` is set to *bottom*.'
        ].join(' ')
    },

    labelside: {
        valType: 'enumerated',
        values: ['top', 'bottom'],
        dflt: 'top',
        editType: 'plot',
        description: [
            'Specifies the location of the `label`.',
            '*top* positions labels above, next to the title',
            '*bottom* positions labels below the graph',
            'Tilted labels with *labelangle* may be positioned better',
            'inside margins when `labelposition` is set to *bottom*.'
        ].join(' ')
    },

    labelfont: fontAttrs({
        editType: 'plot',
        description: 'Sets the font for the `dimension` labels.'
    }),
    tickfont: fontAttrs({
        autoShadowDflt: true,
        editType: 'plot',
        description: 'Sets the font for the `dimension` tick values.'
    }),
    rangefont: fontAttrs({
        editType: 'plot',
        description: 'Sets the font for the `dimension` range values.'
    }),

    dimensions: templatedArray('dimension', {
        label: {
            valType: 'string',
            editType: 'plot',
            description: 'The shown name of the dimension.'
        },
        // TODO: better way to determine ordinal vs continuous axes,
        // so users can use tickvals/ticktext with a continuous axis.
        tickvals: extendFlat({}, axesAttrs.tickvals, {
            editType: 'plot',
            description: [
                'Sets the values at which ticks on this axis appear.'
            ].join(' ')
        }),
        ticktext: extendFlat({}, axesAttrs.ticktext, {
            editType: 'plot',
            description: [
                'Sets the text displayed at the ticks position via `tickvals`.'
            ].join(' ')
        }),
        tickformat: extendFlat({}, axesAttrs.tickformat, {
            editType: 'plot'
        }),
        visible: {
            valType: 'boolean',
            dflt: true,
            editType: 'plot',
            description: 'Shows the dimension when set to `true` (the default). Hides the dimension for `false`.'
        },
        range: {
            valType: 'info_array',
            items: [
                {valType: 'number', editType: 'plot'},
                {valType: 'number', editType: 'plot'}
            ],
            editType: 'plot',
            description: [
                'The domain range that represents the full, shown axis extent. Defaults to the `values` extent.',
                'Must be an array of `[fromValue, toValue]` with finite numbers as elements.'
            ].join(' ')
        },
        constraintrange: {
            valType: 'info_array',
            freeLength: true,
            dimensions: '1-2',
            items: [
                {valType: 'any', editType: 'plot'},
                {valType: 'any', editType: 'plot'}
            ],
            editType: 'plot',
            description: [
                'The domain range to which the filter on the dimension is constrained. Must be an array',
                'of `[fromValue, toValue]` with `fromValue <= toValue`, or if `multiselect` is not',
                'disabled, you may give an array of arrays, where each inner array is `[fromValue, toValue]`.'
            ].join(' ')
        },
        multiselect: {
            valType: 'boolean',
            dflt: true,
            editType: 'plot',
            description: 'Do we allow multiple selection ranges or just a single range?'
        },
        values: {
            valType: 'data_array',
            editType: 'calc',
            description: [
                'Dimension values. `values[n]` represents the value of the `n`th point in the dataset,',
                'therefore the `values` vector for all dimensions must be the same (longer vectors',
                'will be truncated). Each value must be a finite number.'
            ].join(' ')
        },
        editType: 'calc',
        description: 'The dimensions (variables) of the parallel coordinates chart. 2..60 dimensions are supported.'
    }),

    line: extendFlat({editType: 'calc'},
        colorScaleAttrs('line', {
            // the default autocolorscale isn't quite usable for parcoords due to context ambiguity around 0 (grey, off-white)
            // autocolorscale therefore defaults to false too, to avoid being overridden by the blue-white-red autocolor palette
            colorscaleDflt: 'Viridis',
            autoColorDflt: false,
            editTypeOverride: 'calc'
        })
    ),

    unselected: {
        line: {
            color: {
                valType: 'color',
                dflt: '#7f7f7f',
                editType: 'plot',
                description: [
                    'Sets the base color of unselected lines.',
                    'in connection with `unselected.line.opacity`.'
                ].join(' ')
            },
            opacity: {
                valType: 'number',
                min: 0,
                max: 1,
                dflt: 'auto',
                editType: 'plot',
                description: [
                    'Sets the opacity of unselected lines.',
                    'The default *auto* decreases the opacity smoothly as the number of lines increases.',
                    'Use *1* to achieve exact `unselected.line.color`.'
                ].join(' ')
            },
            editType: 'plot'
        },
        editType: 'plot'
    }
};
