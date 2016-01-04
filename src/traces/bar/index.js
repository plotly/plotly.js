/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');

Plotly.Plots.register(exports, 'bar',
    ['cartesian', 'bar', 'oriented', 'markerColorscale', 'errorBarsOK', 'showLegend'], {
    description: [
        'The data visualized by the span of the bars is set in `y`',
        'if `orientation` is set th *v* (the default)',
        'and the labels are set in `x`.',

        'By setting `orientation` to *h*, the roles are interchanged.'
    ].join(' ')
});

exports.attributes = require('./attributes');

exports.layoutAttributes = require('./layout_attributes');

exports.supplyDefaults = require('./defaults');

exports.supplyLayoutDefaults = require('./layout_defaults');

exports.calc = require('./calc');

exports.setPositions = require('./set_positions');

exports.colorbar = require('../scatter/colorbar');

exports.arraysToCalcdata = require('./arrays_to_calcdata');

exports.plot = require('./plot');

exports.style = require('./style');

exports.hoverPoints = require('./hover');
