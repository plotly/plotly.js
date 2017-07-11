/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var extend = require('object-assign')

var Scatter = extend({}, require('../scatter/index'))

Scatter.name = 'scatterregl'
Scatter.plot = require('./plot')
Scatter.hoverPoints = require('./hover')
Scatter.calc = require('./calc')

module.exports = Scatter;
