/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var Plotly = require('./core');

Plotly.register([
    require('./bar'),
    require('./histogram'),
    require('./pie'),
    require('./ohlc'),
    require('./candlestick')
]);

module.exports = Plotly;
