/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var HeatmapGl = {};

HeatmapGl.attributes = require('./attributes');
HeatmapGl.supplyDefaults = require('../heatmap/defaults');
HeatmapGl.colorbar = require('../heatmap/colorbar');

HeatmapGl.calc = require('../heatmap/calc');
HeatmapGl.plot = require('./convert');

HeatmapGl.moduleType = 'trace';
HeatmapGl.name = 'heatmapgl';
HeatmapGl.basePlotModule = require('../../plots/gl2d');
HeatmapGl.categories = ['gl2d', '2dMap'];
HeatmapGl.meta = {
    description: [
        'WebGL heatmap (beta)'
    ].join(' ')
};

module.exports = HeatmapGl;
