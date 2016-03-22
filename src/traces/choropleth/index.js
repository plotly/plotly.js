/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Choropleth = {};

Choropleth.attributes = require('./attributes');
Choropleth.supplyDefaults = require('./defaults');
Choropleth.colorbar = require('../heatmap/colorbar');
Choropleth.calc = require('./calc');
Choropleth.plot = require('./plot').plot;

Choropleth.moduleType = 'trace';
Choropleth.name = 'choropleth';
Choropleth.basePlotModule = require('../../plots/geo');
Choropleth.categories = ['geo', 'noOpacity'];
Choropleth.meta = {
    description: [
        'The data that describes the choropleth value-to-color mapping',
        'is set in `z`.',
        'The geographic locations corresponding to each value in `z`',
        'are set in `locations`.'
    ].join(' ')
};

module.exports = Choropleth;
