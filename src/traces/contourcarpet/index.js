/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var ContourCarpet = {};

ContourCarpet.attributes = require('./attributes');
ContourCarpet.supplyDefaults = require('./defaults');
ContourCarpet.colorbar = require('../contour/colorbar');
ContourCarpet.calc = require('./calc');
ContourCarpet.plot = require('./plot');
ContourCarpet.style = require('../contour/style');

ContourCarpet.moduleType = 'trace';
ContourCarpet.name = 'contourcarpet';
ContourCarpet.basePlotModule = require('../../plots/cartesian');
ContourCarpet.categories = ['cartesian', 'svg', 'carpet', 'contour', 'symbols', 'showLegend', 'hasLines', 'carpetDependent'];
ContourCarpet.meta = {
    hrName: 'contour_carpet',
    description: [
        'Plots contours on either the first carpet axis or the',
        'carpet axis with a matching `carpet` attribute. Data `z`',
        'is interpreted as matching that of the corresponding carpet',
        'axis.'
    ].join(' ')
};

module.exports = ContourCarpet;
