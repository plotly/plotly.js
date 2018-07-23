/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var drawModule = require('./draw');

module.exports = {
    moduleType: 'component',
    name: 'images',

    layoutAttributes: require('./attributes'),
    supplyLayoutDefaults: require('./defaults'),
    includeBasePlot: require('../../plots/cartesian/include_components')('images'),

    draw: drawModule,
    updateOnPan: drawModule,

    convertCoords: require('./convert_coords')
};
