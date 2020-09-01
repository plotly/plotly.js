/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var extendFlat = require('../../lib/extend').extendFlat;
var extendDeep = require('../../lib/extend').extendDeep;
var overrideAll = require('../../plot_api/edit_types').overrideAll;
var fontAttrs = require('../../plots/font_attributes');
var colorAttrs = require('../../components/color/attributes');
var domainAttrs = require('../../plots/domain').attributes;
var axesAttrs = require('../../plots/cartesian/layout_attributes');
var templatedArray = require('../../plot_api/plot_template').templatedArray;
var delta = require('../../constants/delta.js');
var FORMAT_LINK = require('../../constants/docs').FORMAT_LINK;

var textFontAttrs = fontAttrs({
    editType: 'plot',
    colorEditType: 'plot'
});

var gaugeBarAttrs = {
    color: {
        valType: 'color',
        editType: 'plot',
        role: 'info',
        description: [
            'Sets the background color of the arc.'
        ].join(' ')
    },
    line: {
        color: {
            valType: 'color',
            role: 'info',
            dflt: colorAttrs.defaultLine,
            editType: 'plot',
            description: [
                'Sets the color of the line enclosing each sector.'
            ].join(' ')
        },
        width: {
            valType: 'number',
            role: 'info',
            min: 0,
            dflt: 0,
            editType: 'plot',
            description: [
                'Sets the width (in px) of the line enclosing each sector.'
            ].join(' ')
        },
        editType: 'calc'
    },
    thickness: {
        valType: 'number',
        role: 'info',
        min: 0,
        max: 1,
        dflt: 1,
        editType: 'plot',
        description: [
            'Sets the thickness of the bar as a fraction of the total thickness of the gauge.'
        ].join(' ')
    },
    editType: 'calc'
};

var rangeAttr = {
    valType: 'info_array',
    role: 'info',
    items: [
            {valType: 'number', editType: 'plot'},
            {valType: 'number', editType: 'plot'}
    ],
    editType: 'plot',
    description: [
        'Sets the range of this axis.'
        // TODO: add support for other axis type
        // 'If the axis `type` is *log*, then you must take the log of your',
        // 'desired range (e.g. to set the range from 1 to 100,',
        // 'set the range from 0 to 2).',
        // 'If the axis `type` is *date*, it should be date strings,',
        // 'like date data, though Date objects and unix milliseconds',
        // 'will be accepted and converted to strings.',
        // 'If the axis `type` is *category*, it should be numbers,',
        // 'using the scale where each category is assigned a serial',
        // 'number from zero in the order it appears.'
    ].join(' ')
};

var stepsAttrs = templatedArray('step', extendDeep({}, gaugeBarAttrs, {
    range: rangeAttr
}));

module.exports = {
    mode: {
        valType: 'flaglist',
        editType: 'calc',
        role: 'info',
        flags: ['number', 'delta', 'gauge'],
        dflt: 'number',
        description: [
            'Determines how the value is displayed on the graph.',
            '`number` displays the value numerically in text.',
            '`delta` displays the difference to a reference value in text.',
            'Finally, `gauge` displays the value graphically on an axis.',
        ].join(' ')
    },
    value: {
        valType: 'number',
        editType: 'calc',
        role: 'info',
        anim: true,
        description: [
            'Sets the number to be displayed.'
        ].join(' ')
    },
    align: {
        valType: 'enumerated',
        values: ['left', 'center', 'right'],
        role: 'info',
        editType: 'plot',
        description: [
            'Sets the horizontal alignment of the `text` within the box.',
            'Note that this attribute has no effect if an angular gauge is displayed:',
            'in this case, it is always centered'
        ].join(' ')
    },
    // position
    domain: domainAttrs({name: 'indicator', trace: true, editType: 'calc'}),

    title: {
        text: {
            valType: 'string',
            role: 'info',
            editType: 'plot',
            description: [
                'Sets the title of this indicator.'
            ].join(' ')
        },
        align: {
            valType: 'enumerated',
            values: ['left', 'center', 'right'],
            role: 'info',
            editType: 'plot',
            description: [
                'Sets the horizontal alignment of the title.',
                'It defaults to `center` except for bullet charts',
                'for which it defaults to right.'
            ].join(' ')
        },
        font: extendFlat({}, textFontAttrs, {
            description: [
                'Set the font used to display the title'
            ].join(' ')
        }),
        editType: 'plot'
    },
    number: {
        valueformat: {
            valType: 'string',
            dflt: '',
            role: 'info',
            editType: 'plot',
            description: [
                'Sets the value formatting rule using d3 formatting mini-language',
                'which is similar to those of Python. See',
                FORMAT_LINK
            ].join(' ')
        },
        font: extendFlat({}, textFontAttrs, {
            description: [
                'Set the font used to display main number'
            ].join(' ')
        }),
        prefix: {
            valType: 'string',
            dflt: '',
            role: 'info',
            editType: 'plot',
            description: [
                'Sets a prefix appearing before the number.'
            ].join(' ')
        },
        suffix: {
            valType: 'string',
            dflt: '',
            role: 'info',
            editType: 'plot',
            description: [
                'Sets a suffix appearing next to the number.'
            ].join(' ')
        },
        editType: 'plot'
    },
    delta: {
        reference: {
            valType: 'number',
            role: 'info',
            editType: 'calc',
            description: [
                'Sets the reference value to compute the delta.',
                'By default, it is set to the current value.'
            ].join(' ')
        },
        position: {
            valType: 'enumerated',
            values: ['top', 'bottom', 'left', 'right'],
            role: 'info',
            dflt: 'bottom',
            editType: 'plot',
            description: [
                'Sets the position of delta with respect to the number.'
            ].join(' ')
        },
        relative: {
            valType: 'boolean',
            editType: 'plot',
            role: 'info',
            dflt: false,
            description: [
                'Show relative change'
            ].join(' ')
        },
        valueformat: {
            valType: 'string',
            role: 'info',
            editType: 'plot',
            description: [
                'Sets the value formatting rule using d3 formatting mini-language',
                'which is similar to those of Python. See',
                FORMAT_LINK
            ].join(' ')
        },
        increasing: {
            symbol: {
                valType: 'string',
                role: 'info',
                dflt: delta.INCREASING.SYMBOL,
                editType: 'plot',
                description: [
                    'Sets the symbol to display for increasing value'
                ].join(' ')
            },
            color: {
                valType: 'color',
                role: 'info',
                dflt: delta.INCREASING.COLOR,
                editType: 'plot',
                description: [
                    'Sets the color for increasing value.'
                ].join(' ')
            },
            // TODO: add attribute to show sign
            editType: 'plot'
        },
        decreasing: {
            symbol: {
                valType: 'string',
                role: 'info',
                dflt: delta.DECREASING.SYMBOL,
                editType: 'plot',
                description: [
                    'Sets the symbol to display for increasing value'
                ].join(' ')
            },
            color: {
                valType: 'color',
                role: 'info',
                dflt: delta.DECREASING.COLOR,
                editType: 'plot',
                description: [
                    'Sets the color for increasing value.'
                ].join(' ')
            },
            // TODO: add attribute to hide sign
            editType: 'plot'
        },
        font: extendFlat({}, textFontAttrs, {
            description: [
                'Set the font used to display the delta'
            ].join(' ')
        }),
        editType: 'calc'
    },
    gauge: {
        shape: {
            valType: 'enumerated',
            editType: 'plot',
            role: 'info',
            dflt: 'angular',
            values: ['angular', 'bullet'],
            description: [
                'Set the shape of the gauge'
            ].join(' ')
        },
        bar: extendDeep({}, gaugeBarAttrs, {
            color: {dflt: 'green'},
            description: [
                'Set the appearance of the gauge\'s value'
            ].join(' ')
        }),
        // Background of the gauge
        bgcolor: {
            valType: 'color',
            role: 'info',
            editType: 'plot',
            description: 'Sets the gauge background color.'
        },
        bordercolor: {
            valType: 'color',
            dflt: colorAttrs.defaultLine,
            role: 'info',
            editType: 'plot',
            description: 'Sets the color of the border enclosing the gauge.'
        },
        borderwidth: {
            valType: 'number',
            min: 0,
            dflt: 1,
            role: 'info',
            editType: 'plot',
            description: 'Sets the width (in px) of the border enclosing the gauge.'
        },
        axis: overrideAll({
            range: rangeAttr,
            visible: extendFlat({}, axesAttrs.visible, {
                dflt: true
            }),
            // tick and title properties named and function exactly as in axes
            tickmode: axesAttrs.tickmode,
            nticks: axesAttrs.nticks,
            tick0: axesAttrs.tick0,
            dtick: axesAttrs.dtick,
            tickvals: axesAttrs.tickvals,
            ticktext: axesAttrs.ticktext,
            ticks: extendFlat({}, axesAttrs.ticks, {dflt: 'outside'}),
            ticklen: axesAttrs.ticklen,
            tickwidth: axesAttrs.tickwidth,
            tickcolor: axesAttrs.tickcolor,
            showticklabels: axesAttrs.showticklabels,
            tickfont: fontAttrs({
                description: 'Sets the color bar\'s tick label font'
            }),
            tickangle: axesAttrs.tickangle,
            tickformat: axesAttrs.tickformat,
            tickformatstops: axesAttrs.tickformatstops,
            tickprefix: axesAttrs.tickprefix,
            showtickprefix: axesAttrs.showtickprefix,
            ticksuffix: axesAttrs.ticksuffix,
            showticksuffix: axesAttrs.showticksuffix,
            separatethousands: axesAttrs.separatethousands,
            exponentformat: axesAttrs.exponentformat,
            minexponent: axesAttrs.minexponent,
            showexponent: axesAttrs.showexponent,
            editType: 'plot'
        }, 'plot'),
        // Steps (or ranges) and thresholds
        steps: stepsAttrs,
        threshold: {
            line: {
                color: extendFlat({}, gaugeBarAttrs.line.color, {
                    description: [
                        'Sets the color of the threshold line.'
                    ].join(' ')
                }),
                width: extendFlat({}, gaugeBarAttrs.line.width, {
                    dflt: 1,
                    description: [
                        'Sets the width (in px) of the threshold line.'
                    ].join(' ')
                }),
                editType: 'plot'
            },
            thickness: extendFlat({}, gaugeBarAttrs.thickness, {
                dflt: 0.85,
                description: [
                    'Sets the thickness of the threshold line as a fraction of the thickness of the gauge.'
                ].join(' ')
            }),
            value: {
                valType: 'number',
                editType: 'calc',
                dflt: false,
                role: 'info',
                description: [
                    'Sets a treshold value drawn as a line.'
                ].join(' ')
            },
            editType: 'plot'
        },
        description: 'The gauge of the Indicator plot.',
        editType: 'plot'
        // TODO: in future version, add marker: (bar|needle)
    }
};
