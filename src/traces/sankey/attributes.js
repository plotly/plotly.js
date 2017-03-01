/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {

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

    nodes: {
        _isLinkedToArray: 'node',
        label: {
            valType: 'string',
            role: 'info',
            description: 'The shown name of the dimension.'
        },
        visible: {
            valType: 'boolean',
            dflt: true,
            role: 'info',
            description: 'Shows the node when set to `true` (the default). Hides the node for `false`.'
        },
        description: 'The nodes of the Sankey plot.'
    },

    links: {
        _isLinkedToArray: 'link',
        label: {
            valType: 'string',
            role: 'info',
            description: 'The shown name of the dimension.'
        },
        visible: {
            valType: 'boolean',
            dflt: true,
            role: 'info',
            description: 'Shows the node when set to `true` (the default). Hides the node for `false`.'
        },
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
        description: 'The nodes of the Sankey plot.'
    }
};
