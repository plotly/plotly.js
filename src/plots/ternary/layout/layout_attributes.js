/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorAttrs = require('../../../components/color/attributes');
var ternaryAxesAttrs = require('./axis_attributes');


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
                'Sets the horizontal domain of this subplot',
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
                'Sets the vertical domain of this subplot',
                '(in plot fraction).'
            ].join(' ')
        }
    },
    bgcolor: {
        valType: 'color',
        role: 'style',
        dflt: colorAttrs.background,
        description: 'Set the background color of the subplot'
    },
    sum: {
        valType: 'number',
        role: 'info',
        dflt: 1,
        min: 0,
        description: [
            'The number each triplet should sum to,',
            'and the maximum range of each axis'
        ].join(' ')
    },
    aaxis: ternaryAxesAttrs,
    baxis: ternaryAxesAttrs,
    caxis: ternaryAxesAttrs
};
