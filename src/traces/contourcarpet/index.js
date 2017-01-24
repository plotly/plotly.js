/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var ContourCarpet = {};

ContourCarpet.attributes = require('./attributes');
ContourCarpet.supplyDefaults = require('./defaults');
// ContourCarpet.colorbar = require('../scatter/colorbar');
ContourCarpet.calc = require('./calc');
ContourCarpet.plot = require('./plot');
// ContourCarpet.style = require('./style');
// ContourCarpet.hoverPoints = require('./hover');
// ContourCarpet.selectPoints = require('./select');

ContourCarpet.moduleType = 'trace';
ContourCarpet.name = 'contourcarpet';
ContourCarpet.basePlotModule = require('../../plots/cartesian');
ContourCarpet.categories = ['cartesian', 'carpet', 'symbols', 'markerColorscale', 'showLegend'];
ContourCarpet.meta = {
    hrName: 'contour_carpet',
    description: [].join(' ')
};

module.exports = ContourCarpet;
