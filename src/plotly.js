/**
* Copyright 2012-2017, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

/*
 * Pack internal modules unto an object.
 *
 * This object is require'ed in as 'Plotly' in numerous src and test files.
 * Require'ing 'Plotly' bypasses circular dependencies.
 *
 * Future development should move away from this pattern.
 *
 */

// configuration
module.exports.defaultConfig = require('./plot_api/plot_config');

// plots
module.exports.Plots = require('./plots/plots');
module.exports.Axes = require('./plots/cartesian/axes');

// components
module.exports.ModeBar = require('./components/modebar');

// plot api
var API = require('./plot_api/plot_api');

for(var method in API) {
    if(API.hasOwnProperty(method)) {
        module.exports[method] = API[method];
    }
}
