/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var colorAttrs = require('../../../components/color/attributes');
var domainAttrs = require('../../domain').attributes;
var ternaryAxesAttrs = require('./axis_attributes');
var overrideAll = require('../../../plot_api/edit_types').overrideAll;

module.exports = overrideAll({
    domain: domainAttrs({name: 'ternary'}),

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
}, 'plot', 'from-root');
