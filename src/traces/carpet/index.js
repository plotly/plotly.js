/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Carpet = {};

Carpet.attributes = require('./attributes');
Carpet.supplyDefaults = require('./defaults');
Carpet.plot = require('./plot');
Carpet.calc = require('./calc');
Carpet.animatable = true;
Carpet.isContainer = true; // so carpet traces get `calc` before other traces

Carpet.moduleType = 'trace';
Carpet.name = 'carpet';
Carpet.basePlotModule = require('../../plots/cartesian');
Carpet.categories = ['cartesian', 'svg', 'carpet', 'carpetAxis', 'notLegendIsolatable'];
Carpet.meta = {
    description: [
        'The data describing carpet axis layout is set in `y` and (optionally)',
        'also `x`. If only `y` is present, `x` the plot is interpreted as a',
        'cheater plot and is filled in using the `y` values.',

        '`x` and `y` may either be 2D arrays matching with each dimension matching',
        'that of `a` and `b`, or they may be 1D arrays with total length equal to',
        'that of `a` and `b`.'
    ].join(' ')
};

module.exports = Carpet;
