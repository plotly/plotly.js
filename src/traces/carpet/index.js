/**
* Copyright 2012-2017, Plotly, Inc.
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
Carpet.calcPriority = 1;

Carpet.moduleType = 'trace';
Carpet.name = 'carpet';
Carpet.basePlotModule = require('../../plots/cartesian');
Carpet.categories = ['cartesian', 'carpet'];
Carpet.meta = {
    description: [
    ].join(' ')
};

module.exports = Carpet;
