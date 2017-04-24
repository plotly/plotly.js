/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var extendFlat = require('../../lib/extend').extendFlat;
var fontAttrs = require('../../plots/font_attributes');
var constants = require('./constants');

module.exports = {
    dragmode: {
        valType: 'enumerated',
        role: 'info',
        values: ['zoom', 'pan', 'select', 'lasso', 'orbit', 'turntable'],
        dflt: 'zoom',
        description: [
            'Determines the mode of drag interactions.',
            '*select* and *lasso* apply only to scatter traces with',
            'markers or text. *orbit* and *turntable* apply only to',
            '3D scenes.'
        ].join(' ')
    },
    hovermode: {
        valType: 'enumerated',
        role: 'info',
        values: ['x', 'y', 'closest', false],
        description: 'Determines the mode of hover interactions.'
    },

    hoverlabel: {
        bgcolor: {
            valType: 'color',
            role: 'style',
            description: [
                'Sets the background color of all hover labels on graph'
            ].join(' ')
        },
        bordercolor: {
            valType: 'color',
            role: 'style',
            description: [
                'Sets the border color of all hover labels on graph.'
            ].join(' ')
        },
        font: {
            family: extendFlat({}, fontAttrs.family, {
                dflt: constants.HOVERFONT
            }),
            size: extendFlat({}, fontAttrs.size, {
                dflt: constants.HOVERFONTSIZE
            }),
            color: extendFlat({}, fontAttrs.color)
        }
    }
};
