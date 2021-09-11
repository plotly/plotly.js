'use strict';

var fontAttrs = require('../../plots/font_attributes');
var colorAttrs = require('../color/attributes');


module.exports = {
    bgcolor: {
        valType: 'color',
        editType: 'legend',
        description: [
            'Sets the legend background color.',
            'Defaults to `layout.paper_bgcolor`.'
        ].join(' ')
    },
    bordercolor: {
        valType: 'color',
        dflt: colorAttrs.defaultLine,
        editType: 'legend',
        description: 'Sets the color of the border enclosing the legend.'
    },
    borderwidth: {
        valType: 'number',
        min: 0,
        dflt: 0,
        editType: 'legend',
        description: 'Sets the width (in px) of the border enclosing the legend.'
    },
    font: fontAttrs({
        editType: 'legend',
        description: 'Sets the font used to text the legend items.'
    }),
    orientation: {
        valType: 'enumerated',
        values: ['v', 'h'],
        dflt: 'v',
        editType: 'legend',
        description: 'Sets the orientation of the legend.'
    },
    traceorder: {
        valType: 'flaglist',
        flags: ['reversed', 'grouped'],
        extras: ['normal'],
        editType: 'legend',
        description: [
            'Determines the order at which the legend items are displayed.',

            'If *normal*, the items are displayed top-to-bottom in the same',
            'order as the input data.',

            'If *reversed*, the items are displayed in the opposite order',
            'as *normal*.',

            'If *grouped*, the items are displayed in groups',
            '(when a trace `legendgroup` is provided).',

            'if *grouped+reversed*, the items are displayed in the opposite order',
            'as *grouped*.'
        ].join(' ')
    },
    tracegroupgap: {
        valType: 'number',
        min: 0,
        dflt: 10,
        editType: 'legend',
        description: [
            'Sets the amount of vertical space (in px) between legend groups.'
        ].join(' ')
    },
    itemsizing: {
        valType: 'enumerated',
        values: ['trace', 'constant'],
        dflt: 'trace',
        editType: 'legend',
        description: [
            'Determines if the legend items symbols scale with their corresponding *trace* attributes',
            'or remain *constant* independent of the symbol size on the graph.'
        ].join(' ')
    },
    itemwidth: {
        valType: 'number',
        min: 30,
        dflt: 30,
        editType: 'legend',
        description: 'Sets the width (in px) of the legend item symbols (the part other than the title.text).',
    },
    itemclick: {
        valType: 'enumerated',
        values: ['toggle', 'toggleothers', false],
        dflt: 'toggle',
        editType: 'legend',
        description: [
            'Determines the behavior on legend item click.',
            '*toggle* toggles the visibility of the item clicked on the graph.',
            '*toggleothers* makes the clicked item the sole visible item on the graph.',
            '*false* disables legend item click interactions.'
        ].join(' ')
    },
    itemdoubleclick: {
        valType: 'enumerated',
        values: ['toggle', 'toggleothers', false],
        dflt: 'toggleothers',
        editType: 'legend',
        description: [
            'Determines the behavior on legend item double-click.',
            '*toggle* toggles the visibility of the item clicked on the graph.',
            '*toggleothers* makes the clicked item the sole visible item on the graph.',
            '*false* disables legend item double-click interactions.'
        ].join(' ')
    },
    groupclick: {
        valType: 'enumerated',
        values: ['toggleitem', 'togglegroup'],
        dflt: 'togglegroup',
        editType: 'legend',
        description: [
            'Determines the behavior on legend group item click.',
            '*toggleitem* toggles the visibility of the individual item clicked on the graph.',
            '*togglegroup* toggles the visibility of all items in the same legendgroup as the item clicked on the graph.'
        ].join(' ')
    },
    x: {
        valType: 'number',
        min: -2,
        max: 3,
        editType: 'legend',
        description: [
            'Sets the x position (in normalized coordinates) of the legend.',
            'Defaults to *1.02* for vertical legends and',
            'defaults to *0* for horizontal legends.'
        ].join(' ')
    },
    xanchor: {
        valType: 'enumerated',
        values: ['auto', 'left', 'center', 'right'],
        dflt: 'left',
        editType: 'legend',
        description: [
            'Sets the legend\'s horizontal position anchor.',
            'This anchor binds the `x` position to the *left*, *center*',
            'or *right* of the legend.',
            'Value *auto* anchors legends to the right for `x` values greater than or equal to 2/3,',
            'anchors legends to the left for `x` values less than or equal to 1/3 and',
            'anchors legends with respect to their center otherwise.'
        ].join(' ')
    },
    y: {
        valType: 'number',
        min: -2,
        max: 3,
        editType: 'legend',
        description: [
            'Sets the y position (in normalized coordinates) of the legend.',
            'Defaults to *1* for vertical legends,',
            'defaults to *-0.1* for horizontal legends on graphs w/o range sliders and',
            'defaults to *1.1* for horizontal legends on graph with one or multiple range sliders.'
        ].join(' ')
    },
    yanchor: {
        valType: 'enumerated',
        values: ['auto', 'top', 'middle', 'bottom'],
        editType: 'legend',
        description: [
            'Sets the legend\'s vertical position anchor',
            'This anchor binds the `y` position to the *top*, *middle*',
            'or *bottom* of the legend.',
            'Value *auto* anchors legends at their bottom for `y` values less than or equal to 1/3,',
            'anchors legends to at their top for `y` values greater than or equal to 2/3 and',
            'anchors legends with respect to their middle otherwise.'
        ].join(' ')
    },
    uirevision: {
        valType: 'any',
        editType: 'none',
        description: [
            'Controls persistence of legend-driven changes in trace and pie label',
            'visibility. Defaults to `layout.uirevision`.'
        ].join(' ')
    },
    valign: {
        valType: 'enumerated',
        values: ['top', 'middle', 'bottom'],
        dflt: 'middle',
        editType: 'legend',
        description: [
            'Sets the vertical alignment of the symbols with respect to their associated text.',
        ].join(' ')
    },
    title: {
        text: {
            valType: 'string',
            dflt: '',
            editType: 'legend',
            description: [
                'Sets the title of the legend.'
            ].join(' ')
        },
        font: fontAttrs({
            editType: 'legend',
            description: [
                'Sets this legend\'s title font.',
                'Defaults to `legend.font` with its size increased about 20%.'
            ].join(' '),
        }),
        side: {
            valType: 'enumerated',
            values: ['top', 'left', 'top left'],
            editType: 'legend',
            description: [
                'Determines the location of legend\'s title',
                'with respect to the legend items.',
                'Defaulted to *top* with `orientation` is *h*.',
                'Defaulted to *left* with `orientation` is *v*.',
                'The *top left* options could be used to expand',
                'legend area in both x and y sides.'
            ].join(' ')
        },
        editType: 'legend',
    },
    editType: 'legend'
};
