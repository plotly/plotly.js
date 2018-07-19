/**
* Copyright 2012-2018, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

module.exports = {
    moduleType: 'component',
    name: 'images',
    isDrawable: true,

    layoutAttributes: require('./attributes'),
    supplyLayoutDefaults: require('./defaults'),
    includeBasePlot: require('../../plots/cartesian/include_components')('images'),

    draw: require('./draw'),
    drawOne: require('./draw'),

    convertCoords: require('./convert_coords')
};
