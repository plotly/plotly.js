/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var ScatterCarpet = {};

ScatterCarpet.attributes = require('./attributes');
ScatterCarpet.supplyDefaults = require('./defaults');
ScatterCarpet.colorbar = require('../scatter/colorbar');
ScatterCarpet.calc = require('./calc');
ScatterCarpet.plot = require('./plot');
ScatterCarpet.style = require('./style');
ScatterCarpet.hoverPoints = require('./hover');
ScatterCarpet.selectPoints = require('./select');

ScatterCarpet.moduleType = 'trace';
ScatterCarpet.name = 'scattercarpet';
ScatterCarpet.basePlotModule = require('../../plots/cartesian');
ScatterCarpet.categories = ['carpet', 'symbols', 'markerColorscale', 'showLegend', 'carpetDependent'];
ScatterCarpet.meta = {
    hrName: 'scatter_carpet',
    description: [
        'Plots a scatter trace on either the first carpet axis or the',
        'carpet axis with a matching `carpet` attribute.'
    ].join(' ')
};

module.exports = ScatterCarpet;
