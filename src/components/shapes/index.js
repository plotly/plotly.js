/**
* Copyright 2012-2020, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var drawModule = require('./draw');

module.exports = {
    moduleType: 'component',
    name: 'shapes',

    layoutAttributes: require('./attributes'),
    supplyLayoutDefaults: require('./defaults'),
    supplyDrawNewShapeDefaults: require('./draw_newshape/defaults'),
    includeBasePlot: require('../../plots/cartesian/include_components')('shapes'),

    calcAutorange: require('./calc_autorange'),
    draw: drawModule.draw,
    drawOne: drawModule.drawOne
};
