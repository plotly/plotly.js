/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Parcoords = {};

Parcoords.attributes = require('./attributes');
Parcoords.supplyDefaults = require('./defaults');
Parcoords.calc = require('./calc');
Parcoords.plot = require('./plot');
Parcoords.colorbar = {
    container: 'line',
    min: 'cmin',
    max: 'cmax'
};

Parcoords.moduleType = 'trace';
Parcoords.name = 'parcoords';
Parcoords.basePlotModule = require('./base_plot');
Parcoords.categories = ['gl', 'regl', 'noOpacity'];
Parcoords.meta = {
    description: [
        'Parallel coordinates for multidimensional exploratory data analysis.',
        'The samples are specified in `dimensions`.',
        'The colors are set in `line.color`.'
    ].join(' ')
};

module.exports = Parcoords;
