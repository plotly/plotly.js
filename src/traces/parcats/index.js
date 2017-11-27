/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Parcats = {};

Parcats.attributes = require('./attributes');
Parcats.supplyDefaults = require('./defaults');
Parcats.calc = require('./calc');
Parcats.plot = require('./plot');
Parcats.colorbar = require('./colorbar');

Parcats.moduleType = 'trace';
Parcats.name = 'parcats';
Parcats.basePlotModule = require('./base_plot');
Parcats.categories = ['noOpacity', 'markerColorscale'];
Parcats.meta = {
    description: [
        'Parallel categories diagram for multidimensional categorical data.'
    ].join(' ')
};

module.exports = Parcats;
