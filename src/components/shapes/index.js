/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

exports.moduleType = 'component';

exports.name = 'shapes';

exports.layoutAttributes = require('./attributes');

exports.supplyLayoutDefaults = require('./defaults');

exports.calcAutorange = require('./calc_autorange');

var drawModule = require('./draw');
exports.draw = drawModule.draw;
exports.drawOne = drawModule.drawOne;
