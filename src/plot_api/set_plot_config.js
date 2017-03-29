/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var Plotly = require('../plotly');
var Lib = require('../lib');

/**
 * Extends the plot config
 *
 * @param {object} configObj partial plot configuration object
 *      to extend the current plot configuration.
 *
 */
module.exports = function setPlotConfig(configObj) {
    return Lib.extendFlat(Plotly.defaultConfig, configObj);
};
