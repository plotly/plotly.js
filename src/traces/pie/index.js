/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Plotly = require('../../plotly');

Plotly.Plots.register(exports, 'pie', ['pie', 'showLegend'], {
    description: [
        'A data visualized by the sectors of the pie is set in `values`.',
        'The sector labels are set in `labels`.',
        'The sector colors are set in `marker.colors`'
    ].join(' ')
});

exports.attributes = require('./attributes');
exports.supplyDefaults = require('./defaults');
exports.supplyLayoutDefaults = require('./layout_defaults');
exports.layoutAttributes = require('./layout_attributes');
exports.calc = require('./calc');
exports.plot = require('./plot');
exports.style = require('./style');
exports.styleOne = require('./style_one');
