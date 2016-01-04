/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

Plotly.Plots.register(exports, 'choropleth', ['geo', 'noOpacity'], {
    description: [
        'The data that describes the choropleth value-to-color mapping',
        'is set in `z`.',
        'The geographic locations corresponding to each value in `z`',
        'are set in `locations`.'
    ].join(' ')
});

exports.attributes = require('./attributes');

exports.supplyDefaults = require('./defaults');

exports.colorbar = require('../heatmap/colorbar');

exports.calc = require('../surface/calc');
