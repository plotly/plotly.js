/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';


var heatmapAttrs = require('../heatmap/attributes');
var colorscaleAttrs = require('../../components/colorscale/attributes');
var colorbarAttrs = require('../../components/colorbar/attributes');

var extendFlat = require('../../lib/extend').extendFlat;

var commonList = [
    'z',
    'x', 'x0', 'dx',
    'y', 'y0', 'dy',
    'text', 'transpose',
    'xtype', 'ytype'
];

var attrs = {};

for(var i = 0; i < commonList.length; i++) {
    var k = commonList[i];
    attrs[k] = heatmapAttrs[k];
}

extendFlat(
    attrs,
    colorscaleAttrs,
    { autocolorscale: extendFlat({}, colorscaleAttrs.autocolorscale, {dflt: false}) },
    { colorbar: colorbarAttrs }
);

module.exports = attrs;
