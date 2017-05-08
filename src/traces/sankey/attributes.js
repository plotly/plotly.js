/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var shapeAttrs = require('../../components/shapes/attributes');
var fontAttrs = require('../../plots/font_attributes');
var plotAttrs = require('../../plots/attributes');

var extendFlat = require('../../lib/extend').extendFlat;

module.exports = {
    hoverinfo: extendFlat({}, plotAttrs.hoverinfo, {
        flags: ['label', 'text', 'value', 'percent', 'name']
    }),
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
                'Sets the horizontal domain of this `sankey` trace',
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
                'Sets the vertical domain of this `sankey` trace',
                '(in plot fraction).'
            ].join(' ')
        }
    },

    orientation: {
        valType: 'enumerated',
        values: ['v', 'h'],
        dflt: 'h',
        role: 'style',
        description: 'Sets the orientation of the Sankey diagram.'
    },

    nodepad: {
        valType: 'number',
        min: 0,
        dflt: 20,
        role: 'style',
        description: 'Sets the padding (in px) between the `nodes`.'
    },

    nodethickness: {
        valType: 'number',
        min: 1,
        dflt: 20,
        role: 'style',
        description: 'Sets the thickness of the `nodes`.'
    },

    valueformat: {
        valType: 'string',
        dflt: '.3s',
        role: 'style',
        description: [
            'Sets the value formatting rule using d3 formatting mini-language',
            'which is similar to those of Python. See',
            'https://github.com/d3/d3-format/blob/master/README.md#locale_format'
        ].join(' ')
    },

    valuesuffix: {
        valType: 'string',
        dflt: '',
        role: 'style',
        description: [
            'Adds a unit to follow the value in the hover tooltip. Add a space if a separation',
            'is necessary from the value.'
        ].join(' ')
    },

    arrangement: {
        valType: 'enumerated',
        values: ['snap', 'perpendicular', 'freeform', 'fixed'],
        dflt: 'snap',
        role: 'style',
        description: [
            'If value is `snap` (the default), the node arrangement is assisted by automatic snapping of elements to',
            'preserve space between nodes specified via `nodepad`.',
            'If value is `perpendicular`, the nodes can only move along a line perpendicular to the flow.',
            'If value is `freeform`, the nodes can freely move on the plane.',
            'If value is `fixed`, the nodes are stationary.'
        ].join(' ')
    },

    textfont: fontAttrs,

    nodes: {
        _isLinkedToArray: 'node',
        label: {
            valType: 'string',
            dflt: '',
            role: 'info',
            description: 'The shown name of the node.'
        },
        parallel: {
            valType: 'number',
            role: 'style',
            min: 0,
            max: 1,
            description: 'Node position parallel to the flow, e.g. left/right if `orientation` is `horizontal`.'
        },
        perpendicular: {
            valType: 'number',
            role: 'style',
            min: 0,
            max: 1,
            description: 'Node position perpendicular to the flow, e.g. up/down if `orientation` is `horizontal`.'
        },
        visible: shapeAttrs.visible,
        color: extendFlat({}, shapeAttrs.fillcolor, {
            dflt: 'rgb(0,255,0,0.5)'
        }),
        description: 'The nodes of the Sankey plot.'
    },

    links: {
        _isLinkedToArray: 'link',
        label: {
            valType: 'string',
            dflt: '',
            role: 'info',
            description: 'The shown name of the link.'
        },
        visible: shapeAttrs.visible,
        color: extendFlat({}, shapeAttrs.fillcolor, {dflt: 'rgba(0,0,0,0.2)'}),
        source: {
            valType: 'number',
            role: 'info',
            description: 'An integer number `[0..nodes.length - 1]` that represents the source node.'
        },
        target: {
            valType: 'number',
            role: 'info',
            description: 'An integer number `[0..nodes.length - 1]` that represents the target node.'
        },
        value: {
            valType: 'number',
            dflt: 1,
            role: 'info',
            description: 'A numeric value representing the flow volume value.'
        },
        description: 'The links of the Sankey plot.'
    }
};
