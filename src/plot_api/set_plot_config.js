/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/


'use strict';

var defaultConfig = require('./plot_config');

/**
 * Extends the plot config
 *
 * @param {object} configObj partial plot configuration object
 *      to extend the current plot configuration.
 *
 */
module.exports = function setPlotConfig(configObj) {
    var keys = Object.keys(configObj);

    for(var i = 0; i < keys.length; i++) {
        var key = keys[i];

        defaultConfig[key].dflt = configObj[key];
    }

    return defaultConfig;
};
