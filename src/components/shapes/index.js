/**
* Copyright 2012-2017, Plotly, Inc.
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

    calcAutorange: require('./calc_autorange'),
    draw: drawModule.draw,
    drawOne: drawModule.drawOne
};
