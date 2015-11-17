/**
* Copyright 2012-2015, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../../plotly');
var attributes = require('./attributes');

Plotly.Plots.registerSubplot('geo', 'geo', 'geo', attributes);

exports.layoutAttributes = require('./layout_attributes');
exports.supplyLayoutDefaults = require('./defaults');
