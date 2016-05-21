/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Pie = {};

Pie.attributes = require('./attributes');
Pie.supplyDefaults = require('./defaults');
Pie.supplyLayoutDefaults = require('./layout_defaults');
Pie.layoutAttributes = require('./layout_attributes');
Pie.calc = require('./calc');
Pie.plot = require('./plot');
Pie.style = require('./style');
Pie.styleOne = require('./style_one');

Pie.moduleType = 'trace';
Pie.name = 'pie';
Pie.basePlotModule = require('./base_plot');
Pie.categories = ['pie', 'showLegend'];
Pie.meta = {
    description: [
        'A data visualized by the sectors of the pie is set in `values`.',
        'The sector labels are set in `labels`.',
        'The sector colors are set in `marker.colors`'
    ].join(' ')
};

module.exports = Pie;
