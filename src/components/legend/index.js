/**
* Copyright 2012-2016, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../../plotly');
var d3 = require('d3');

var Lib = require('../../lib');

var Plots = require('../../plots/plots');
var Fx = require('../../plots/cartesian/graph_interact');

var Color = require('../color');
var Drawing = require('../drawing');

var subTypes = require('../../traces/scatter/subtypes');
var styleOne = require('../../traces/pie/style_one');

var legend = module.exports = {};

var constants = require('./constants');
legend.layoutAttributes = require('./attributes');

legend.supplyLayoutDefaults = require('./defaults');

legend.draw = require('./draw');

legend.style = require('./style');
