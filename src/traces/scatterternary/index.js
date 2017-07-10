/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var ScatterTernary = {};

ScatterTernary.attributes = require('./attributes');
ScatterTernary.supplyDefaults = require('./defaults');
ScatterTernary.colorbar = require('../scatter/colorbar');
ScatterTernary.calc = require('./calc');
ScatterTernary.plot = require('./plot');
ScatterTernary.style = require('./style');
ScatterTernary.hoverPoints = require('./hover');
ScatterTernary.selectPoints = require('./select');

ScatterTernary.moduleType = 'trace';
ScatterTernary.name = 'scatterternary';
ScatterTernary.basePlotModule = require('../../plots/ternary');
ScatterTernary.categories = ['ternary', 'symbols', 'markerColorscale', 'showLegend', 'scatter-like'];
ScatterTernary.meta = {
    hrName: 'scatter_ternary',
    description: [
        'Provides similar functionality to the *scatter* type but on a ternary phase diagram.',
        'The data is provided by at least two arrays out of `a`, `b`, `c` triplets.'
    ].join(' ')
};

module.exports = ScatterTernary;
